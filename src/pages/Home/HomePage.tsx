import { useEffect, useState } from 'react'
import EnvironmentSelector from '../../components/EnvironmentSelector/EnvironmentSelector'
import JoutnalsNumbers from '../../components/joutnalsNumbers/joutnalsNumbers'
import styles from './HomePage.module.css'

type HomePageProps = {
  environmentOptions: string[]
  selectedEnvironment: string
  selectedBaseUrl: string
  onEnvironmentChange: (environment: string) => void
}

type JournalIssue = {
  nid: string
  uri: string
  title: string
  fieldYear: string
  fieldVolume: string
  fieldNumber: string
  fieldPart: string
}

type JournalArticle = {
  id: string
  title: string
  journalLink: string
}

const COLLECTION_KEYS = ['list', 'items', 'nodes', 'data', 'results']
const SELECTOR_HINT =
  'Выберите сайт для создания библиографического списка'
const ENVIRONMENT_LABEL = 'Выберите журнал'
const NOT_SELECTED_LABEL = 'Не выбрано'
const LOADING_ISSUES_LABEL =
  'Загрузка выпусков...'
const ISSUES_ERROR_LABEL =
  'Не удалось загрузить список выпусков.'
const ISSUE_SELECTOR_LABEL =
  'Выберите Выпуск'
const NO_ISSUES_LABEL = 'Нет выпусков'
const LOADING_ARTICLES_LABEL = 'Загрузка статей...'
const ARTICLES_ERROR_LABEL = 'Не удалось загрузить список статей.'
const NO_ARTICLES_LABEL = 'Нет статей для выбранного выпуска'
const ARTICLES_LABEL = 'Статьи выпуска'
const DEV_PROXY_PREFIXES: Record<string, string> = {
  mmi: '/__proxy/mmi',
  andjournal: '/__proxy/andjournal',
}
const PAGE_QUERY_PARAM = 'page'
const MAX_ISSUES_PAGES = 100
const EMPTY_ISSUE_METADATA = {
  fieldYear: '',
  fieldVolume: '',
  fieldNumber: '',
  fieldPart: '',
}

const normalizeIssue = (item: unknown): JournalIssue | null => {
  if (typeof item !== 'object' || item === null) {
    return null
  }

  const source = item as Record<string, unknown>
  const nestedNode =
    typeof source.node === 'object' && source.node !== null
      ? (source.node as Record<string, unknown>)
      : null

  const uri =
    typeof source.uri === 'string'
      ? source.uri
      : typeof nestedNode?.uri === 'string'
        ? nestedNode.uri
        : null

  const nidValue =
    typeof source.nid === 'string' || typeof source.nid === 'number'
      ? source.nid
      : typeof nestedNode?.nid === 'string' || typeof nestedNode?.nid === 'number'
        ? nestedNode.nid
        : null
  const nid = nidValue === null ? null : String(nidValue)

  const title =
    typeof source.title === 'string'
      ? source.title
      : typeof nestedNode?.title === 'string'
        ? nestedNode.title
        : null

  if (!uri || !title || !nid) {
    return null
  }

  return {
    nid,
    uri,
    title,
    ...EMPTY_ISSUE_METADATA,
  }
}

const extractIssues = (payload: unknown): JournalIssue[] => {
  const items: unknown[] = []

  if (Array.isArray(payload)) {
    items.push(...payload)
  } else if (typeof payload === 'object' && payload !== null) {
    const source = payload as Record<string, unknown>

    for (const key of COLLECTION_KEYS) {
      const value = source[key]
      if (Array.isArray(value)) {
        items.push(...value)
      }
    }
  }

  const seenNids = new Set<string>()
  const issues: JournalIssue[] = []

  for (const item of items) {
    const normalizedIssue = normalizeIssue(item)
    if (!normalizedIssue || seenNids.has(normalizedIssue.nid)) {
      continue
    }

    seenNids.add(normalizedIssue.nid)
    issues.push(normalizedIssue)
  }

  return issues
}

const normalizeScalarValue = (value: unknown): string | null => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  return null
}

const extractJournalLinkValue = (value: unknown): string | null => {
  const directValue = normalizeScalarValue(value)
  if (directValue !== null) {
    return directValue
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalizedEntry = extractJournalLinkValue(entry)
      if (normalizedEntry !== null) {
        return normalizedEntry
      }
    }

    return null
  }

  if (typeof value !== 'object' || value === null) {
    return null
  }

  const source = value as Record<string, unknown>
  const preferredKeys = ['target_id', 'nid', 'id', 'value', 'uri', 'und', 'ru', 'en']

  for (const key of preferredKeys) {
    const nestedValue = extractJournalLinkValue(source[key])
    if (nestedValue !== null) {
      return nestedValue
    }
  }

  return null
}

const extractIssueMetadata = (
  payload: unknown,
): Pick<
  JournalIssue,
  'fieldYear' | 'fieldVolume' | 'fieldNumber' | 'fieldPart'
> => {
  const records: Record<string, unknown>[] = []

  const appendRecord = (value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      records.push(value as Record<string, unknown>)
    }
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      appendRecord(item)
      if (typeof item === 'object' && item !== null) {
        const source = item as Record<string, unknown>
        appendRecord(source.node)
      }
    }
  } else if (typeof payload === 'object' && payload !== null) {
    const source = payload as Record<string, unknown>
    appendRecord(source)
    appendRecord(source.node)
  }

  let fieldYear = ''
  let fieldVolume = ''
  let fieldNumber = ''
  let fieldPart = ''

  for (const source of records) {
    if (!fieldYear) {
      fieldYear = extractJournalLinkValue(source.field_year) ?? ''
    }

    if (!fieldVolume) {
      fieldVolume = extractJournalLinkValue(source.field_volume) ?? ''
    }

    if (!fieldNumber) {
      fieldNumber = extractJournalLinkValue(source.field_number) ?? ''
    }

    if (!fieldPart) {
      fieldPart = extractJournalLinkValue(source.field_part) ?? ''
    }
  }

  return {
    fieldYear,
    fieldVolume,
    fieldNumber,
    fieldPart,
  }
}

const normalizeArticle = (item: unknown): JournalArticle | null => {
  if (typeof item !== 'object' || item === null) {
    return null
  }

  const source = item as Record<string, unknown>
  const nestedNode =
    typeof source.node === 'object' && source.node !== null
      ? (source.node as Record<string, unknown>)
      : null

  const idValue =
    normalizeScalarValue(source.nid) ??
    normalizeScalarValue(nestedNode?.nid) ??
    normalizeScalarValue(source.id) ??
    normalizeScalarValue(nestedNode?.id)

  const title =
    typeof source.title === 'string'
      ? source.title
      : typeof nestedNode?.title === 'string'
        ? nestedNode.title
        : null

  const journalLinkValue =
    extractJournalLinkValue(source.field_journal_link) ??
    extractJournalLinkValue(nestedNode?.field_journal_link)

  if (!idValue || !title || !journalLinkValue) {
    return null
  }

  return {
    id: idValue,
    title,
    journalLink: journalLinkValue,
  }
}

const extractArticles = (
  payload: unknown,
  selectedIssueNid: string,
  selectedIssueUri: string | null,
): JournalArticle[] => {
  const items: unknown[] = []

  if (Array.isArray(payload)) {
    items.push(...payload)
  } else if (typeof payload === 'object' && payload !== null) {
    const source = payload as Record<string, unknown>

    for (const key of COLLECTION_KEYS) {
      const value = source[key]
      if (Array.isArray(value)) {
        items.push(...value)
      }
    }
  }

  const seenIds = new Set<string>()
  const articles: JournalArticle[] = []

  for (const item of items) {
    const normalizedArticle = normalizeArticle(item)
    if (
      !normalizedArticle ||
      (normalizedArticle.journalLink !== selectedIssueNid &&
        normalizedArticle.journalLink !== selectedIssueUri) ||
      seenIds.has(normalizedArticle.id)
    ) {
      continue
    }

    seenIds.add(normalizedArticle.id)
    articles.push(normalizedArticle)
  }

  return articles
}

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

  const response = await fetch(pageEndpoint.toString(), {
    signal,
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as unknown
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
        const response = await fetch(endpoint.toString(), {
          signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload = (await response.json()) as unknown
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

const HomePage = ({
  environmentOptions,
  selectedEnvironment,
  selectedBaseUrl,
  onEnvironmentChange,
}: HomePageProps) => {
  const [issues, setIssues] = useState<JournalIssue[]>([])
  const [selectedIssue, setSelectedIssue] = useState('')
  const [isLoadingIssues, setIsLoadingIssues] = useState(false)
  const [issuesError, setIssuesError] = useState('')
  const [hasLoadedIssues, setHasLoadedIssues] = useState(false)
  const [articles, setArticles] = useState<JournalArticle[]>([])
  const [isLoadingArticles, setIsLoadingArticles] = useState(false)
  const [articlesError, setArticlesError] = useState('')
  const [hasLoadedArticles, setHasLoadedArticles] = useState(false)
  const selectedIssueUri =
    issues.find((issue) => issue.nid === selectedIssue)?.uri ?? null

  useEffect(() => {
    if (!selectedEnvironment || !selectedBaseUrl) {
      setIssues([])
      setSelectedIssue('')
      setIssuesError('')
      setHasLoadedIssues(false)
      setIsLoadingIssues(false)
      setArticles([])
      setArticlesError('')
      setHasLoadedArticles(false)
      setIsLoadingArticles(false)
      return
    }

    const abortController = new AbortController()

    const loadIssues = async () => {
      setIsLoadingIssues(true)
      setIssuesError('')
      setHasLoadedIssues(false)

      try {
        const endpoint = buildIssuesEndpoint(
          selectedEnvironment,
          selectedBaseUrl,
        )
        endpoint.searchParams.set('parameters[type]', 'journal_number')

        const loadedIssues = await loadAllIssues(
          endpoint,
          abortController.signal,
        )
        const loadedIssuesWithDetails = await loadIssueDetails(
          selectedEnvironment,
          selectedBaseUrl,
          loadedIssues,
          abortController.signal,
        )

        if (!abortController.signal.aborted) {
          setIssues(loadedIssuesWithDetails)
          setSelectedIssue('')
          setArticles([])
          setArticlesError('')
          setHasLoadedArticles(false)
          setIsLoadingArticles(false)
          setHasLoadedIssues(true)
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        setIssues([])
        setSelectedIssue('')
        setIssuesError(ISSUES_ERROR_LABEL)
        setHasLoadedIssues(true)
        console.error('Issues loading error:', error)
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingIssues(false)
        }
      }
    }

    void loadIssues()

    return () => {
      abortController.abort()
    }
  }, [selectedBaseUrl, selectedEnvironment])

  useEffect(() => {
    if (!selectedEnvironment || !selectedBaseUrl || !selectedIssue) {
      setArticles([])
      setArticlesError('')
      setHasLoadedArticles(false)
      setIsLoadingArticles(false)
      return
    }

    const abortController = new AbortController()

    const loadArticles = async () => {
      setIsLoadingArticles(true)
      setArticlesError('')
      setHasLoadedArticles(false)

      try {
        const endpoint = buildIssuesEndpoint(
          selectedEnvironment,
          selectedBaseUrl,
        )
        endpoint.searchParams.set('parameters[type]', 'journalarticle')

        const response = await fetch(endpoint.toString(), {
          signal: abortController.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload = (await response.json()) as unknown
        const loadedArticles = extractArticles(
          payload,
          selectedIssue,
          selectedIssueUri,
        )

        if (!abortController.signal.aborted) {
          setArticles(loadedArticles)
          setHasLoadedArticles(true)
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        setArticles([])
        setArticlesError(ARTICLES_ERROR_LABEL)
        setHasLoadedArticles(true)
        console.error('Articles loading error:', error)
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingArticles(false)
        }
      }
    }

    void loadArticles()

    return () => {
      abortController.abort()
    }
  }, [
    selectedBaseUrl,
    selectedEnvironment,
    selectedIssue,
    selectedIssueUri,
  ])

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Home</h1>

      <p className={styles.selectorHint}>{SELECTOR_HINT}</p>

      <EnvironmentSelector
        options={environmentOptions}
        value={selectedEnvironment}
        onChange={onEnvironmentChange}
        label={ENVIRONMENT_LABEL}
      />

      <p className={styles.baseUrl}>
        Base URL:{' '}
        <span className={styles.baseUrlValue}>
          {selectedBaseUrl || NOT_SELECTED_LABEL}
        </span>
      </p>

      {selectedEnvironment ? (
        <div className={styles.issueBlock}>
          {isLoadingIssues ? (
            <p className={styles.preload}>{LOADING_ISSUES_LABEL}</p>
          ) : null}

          {!isLoadingIssues && issuesError ? (
            <p className={styles.error}>{issuesError}</p>
          ) : null}

          {!isLoadingIssues && hasLoadedIssues && !issuesError ? (
            <JoutnalsNumbers
              issues={issues}
              value={selectedIssue}
              onChange={setSelectedIssue}
              label={ISSUE_SELECTOR_LABEL}
              emptyLabel={NO_ISSUES_LABEL}
              notSelectedLabel={NOT_SELECTED_LABEL}
            />
          ) : null}

          {selectedIssue ? (
            <div className={styles.articleBlock}>
              {isLoadingArticles ? (
                <p className={styles.preload}>{LOADING_ARTICLES_LABEL}</p>
              ) : null}

              {!isLoadingArticles && articlesError ? (
                <p className={styles.error}>{articlesError}</p>
              ) : null}

              {!isLoadingArticles && hasLoadedArticles && !articlesError ? (
                articles.length === 0 ? (
                  <p className={styles.text}>{NO_ARTICLES_LABEL}</p>
                ) : (
                  <div className={styles.articleListWrapper}>
                    <p className={styles.articleLabel}>{ARTICLES_LABEL}</p>
                    <ul className={styles.articleList}>
                      {articles.map((article) => (
                        <li key={article.id} className={styles.articleListItem}>
                          {article.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default HomePage
