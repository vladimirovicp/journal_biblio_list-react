import { useEffect, useState, type ChangeEvent } from 'react'
import EnvironmentSelector from '../../components/EnvironmentSelector/EnvironmentSelector'
import styles from './HomePage.module.css'

type HomePageProps = {
  environmentOptions: string[]
  selectedEnvironment: string
  selectedBaseUrl: string
  onEnvironmentChange: (environment: string) => void
}

type JournalIssue = {
  uri: string
  title: string
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
const DEV_PROXY_PREFIXES: Record<string, string> = {
  mmi: '/__proxy/mmi',
  andjournal: '/__proxy/andjournal',
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

  const title =
    typeof source.title === 'string'
      ? source.title
      : typeof nestedNode?.title === 'string'
        ? nestedNode.title
        : null

  if (!uri || !title) {
    return null
  }

  return { uri, title }
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

  const seenUris = new Set<string>()
  const issues: JournalIssue[] = []

  for (const item of items) {
    const normalizedIssue = normalizeIssue(item)
    if (!normalizedIssue || seenUris.has(normalizedIssue.uri)) {
      continue
    }

    seenUris.add(normalizedIssue.uri)
    issues.push(normalizedIssue)
  }

  return issues
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

  useEffect(() => {
    if (!selectedEnvironment || !selectedBaseUrl) {
      setIssues([])
      setSelectedIssue('')
      setIssuesError('')
      setHasLoadedIssues(false)
      setIsLoadingIssues(false)
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
        const loadedIssues = extractIssues(payload)

        if (!abortController.signal.aborted) {
          setIssues(loadedIssues)
          setSelectedIssue('')
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

  const handleIssueChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedIssue(event.target.value)
  }

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
            <div className={styles.issueSelectorWrapper}>
              <label htmlFor="issue-selector" className={styles.issueLabel}>
                {ISSUE_SELECTOR_LABEL}
              </label>
              <select
                id="issue-selector"
                className={styles.issueSelect}
                value={selectedIssue}
                onChange={handleIssueChange}
                disabled={issues.length === 0}
              >
                {issues.length === 0 ? (
                  <option value="">{NO_ISSUES_LABEL}</option>
                ) : (
                  <>
                    <option value="">{NOT_SELECTED_LABEL}</option>
                    {issues.map((issue) => (
                      <option key={issue.uri} value={issue.uri}>
                        {issue.title}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default HomePage
