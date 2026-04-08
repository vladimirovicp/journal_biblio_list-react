import { requestJson } from '../../../shared/lib/http/requestJson'
import {
  EMPTY_ISSUE_METADATA,
  extractArticles,
  extractIssueMetadata,
  extractIssues,
} from '../model/parsers'
import type { JournalArticle, JournalIssue } from '../model/types'

const DEV_PROXY_PREFIXES: Record<string, string> = {
  mmi: '/__proxy/mmi',
  andjournal: '/__proxy/andjournal',
}

const PAGE_QUERY_PARAM = 'page'
const MAX_ISSUES_PAGES = 100

const buildIssuesEndpoint = (
  selectedEnvironment: string,
  selectedBaseUrl: string,
) => {
  if (import.meta.env.DEV) {
    const proxyPrefix = DEV_PROXY_PREFIXES[selectedEnvironment]
    if (proxyPrefix) {
      return new URL(`${proxyPrefix}/api/node.json`, window.location.origin)
    }
  }

  return new URL('/api/node.json', selectedBaseUrl)
}

const buildIssueDetailsEndpoint = (
  selectedEnvironment: string,
  selectedBaseUrl: string,
  issueUri: string,
) => {
  const issueEndpoint = new URL(issueUri, selectedBaseUrl)

  if (import.meta.env.DEV) {
    const proxyPrefix = DEV_PROXY_PREFIXES[selectedEnvironment]
    if (proxyPrefix) {
      return new URL(
        `${proxyPrefix}${issueEndpoint.pathname}${issueEndpoint.search}`,
        window.location.origin,
      )
    }
  }

  return issueEndpoint
}

const fetchIssuesPage = async (
  endpoint: URL,
  signal: AbortSignal,
  page?: number,
) => {
  const pageEndpoint = new URL(endpoint.toString())

  if (page !== undefined) {
    pageEndpoint.searchParams.set(PAGE_QUERY_PARAM, String(page))
  }

  const payload = await requestJson<unknown>(
    pageEndpoint.toString(),
    signal,
  )

  return extractIssues(payload)
}

const loadAllIssues = async (endpoint: URL, signal: AbortSignal) => {
  const loadedIssues: JournalIssue[] = []
  const seenNids = new Set<string>()

  const firstPageIssues = await fetchIssuesPage(endpoint, signal)

  for (const issue of firstPageIssues) {
    if (!seenNids.has(issue.nid)) {
      seenNids.add(issue.nid)
      loadedIssues.push(issue)
    }
  }

  for (let page = 0; page < MAX_ISSUES_PAGES; page += 1) {
    const pageIssues = await fetchIssuesPage(endpoint, signal, page)

    if (pageIssues.length === 0) {
      if (page === 0) {
        continue
      }

      break
    }

    let hasNewIssue = false

    for (const issue of pageIssues) {
      if (seenNids.has(issue.nid)) {
        continue
      }

      seenNids.add(issue.nid)
      loadedIssues.push(issue)
      hasNewIssue = true
    }

    if (!hasNewIssue && page > 1) {
      break
    }
  }

  return loadedIssues
}

const loadIssueDetails = async (
  selectedEnvironment: string,
  selectedBaseUrl: string,
  issues: JournalIssue[],
  signal: AbortSignal,
) =>
  Promise.all(
    issues.map(async (issue) => {
      const endpoint = buildIssueDetailsEndpoint(
        selectedEnvironment,
        selectedBaseUrl,
        issue.uri,
      )

      try {
        const payload = await requestJson<unknown>(
          endpoint.toString(),
          signal,
        )
        const issueMetadata = extractIssueMetadata(payload)

        return {
          ...issue,
          ...issueMetadata,
        }
      } catch (error) {
        if (signal.aborted) {
          throw error
        }

        console.error(`Issue details loading error for uri=${issue.uri}:`, error)

        return {
          ...issue,
          ...EMPTY_ISSUE_METADATA,
        }
      }
    }),
  )

export const fetchJournalIssues = async (
  selectedEnvironment: string,
  selectedBaseUrl: string,
  signal: AbortSignal,
) => {
  const endpoint = buildIssuesEndpoint(selectedEnvironment, selectedBaseUrl)
  endpoint.searchParams.set('parameters[type]', 'journal_number')

  const loadedIssues = await loadAllIssues(endpoint, signal)

  return loadIssueDetails(
    selectedEnvironment,
    selectedBaseUrl,
    loadedIssues,
    signal,
  )
}

export const fetchJournalArticles = async (
  selectedEnvironment: string,
  selectedBaseUrl: string,
  selectedIssueNid: string,
  selectedIssueUri: string | null,
  signal: AbortSignal,
): Promise<JournalArticle[]> => {
  const endpoint = buildIssuesEndpoint(selectedEnvironment, selectedBaseUrl)
  endpoint.searchParams.set('parameters[type]', 'journalarticle')

  const payload = await requestJson<unknown>(endpoint.toString(), signal)

  return extractArticles(payload, selectedIssueNid, selectedIssueUri)
}

