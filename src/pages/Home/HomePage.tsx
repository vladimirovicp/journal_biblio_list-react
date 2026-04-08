import { useMemo, useState } from 'react'
import EnvironmentSelector from '../../components/EnvironmentSelector/EnvironmentSelector'
import IssueSelector from '../../features/journal/components/IssueSelector'
import JournalArticles from '../../features/journal/components/JournalArticles'
import { useJournalArticles } from '../../features/journal/hooks/useJournalArticles'
import { useJournalIssues } from '../../features/journal/hooks/useJournalIssues'
import styles from './HomePage.module.css'

type HomePageProps = {
  environmentOptions: string[]
  selectedEnvironment: string
  selectedBaseUrl: string
  onEnvironmentChange: (environment: string) => void
}

const SELECTOR_HINT =
  'Выберите сайт для создания библиографического списка'
const ENVIRONMENT_LABEL = 'Выберите журнал'
const NOT_SELECTED_LABEL = 'Не выбрано'
const LOADING_ISSUES_LABEL = 'Загрузка выпусков...'
const ISSUE_SELECTOR_LABEL = 'Выберите Выпуск'
const NO_ISSUES_LABEL = 'Нет выпусков'
const LOADING_ARTICLES_LABEL = 'Загрузка статей...'
const NO_ARTICLES_LABEL = 'Нет статей для выбранного выпуска'
const ARTICLES_LABEL = 'Статьи выпуска'

const HomePage = ({
  environmentOptions,
  selectedEnvironment,
  selectedBaseUrl,
  onEnvironmentChange,
}: HomePageProps) => {
  const [selection, setSelection] = useState<{
    scopeKey: string
    nid: string
  }>({
    scopeKey: '',
    nid: '',
  })

  const scopeKey = `${selectedEnvironment}:${selectedBaseUrl}`

  const { issues, isLoadingIssues, issuesError, hasLoadedIssues } =
    useJournalIssues({
      selectedEnvironment,
      selectedBaseUrl,
    })

  const selectedIssue = useMemo(
    () => (selection.scopeKey === scopeKey ? selection.nid : ''),
    [scopeKey, selection.nid, selection.scopeKey],
  )

  const activeSelectedIssue = useMemo(
    () =>
      selectedIssue && issues.some((issue) => issue.nid === selectedIssue)
        ? selectedIssue
        : '',
    [issues, selectedIssue],
  )

  const selectedIssueUri = useMemo(
    () => issues.find((issue) => issue.nid === activeSelectedIssue)?.uri ?? null,
    [activeSelectedIssue, issues],
  )

  const {
    articles,
    isLoadingArticles,
    articlesError,
    hasLoadedArticles,
  } = useJournalArticles({
    selectedEnvironment,
    selectedBaseUrl,
    selectedIssueNid: activeSelectedIssue,
    selectedIssueUri,
  })

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
            <IssueSelector
              issues={issues}
              value={activeSelectedIssue}
              onChange={(nid) => {
                setSelection({
                  scopeKey,
                  nid,
                })
              }}
              label={ISSUE_SELECTOR_LABEL}
              emptyLabel={NO_ISSUES_LABEL}
              notSelectedLabel={NOT_SELECTED_LABEL}
            />
          ) : null}

          {activeSelectedIssue ? (
            <div className={styles.articleBlock}>
              {isLoadingArticles ? (
                <p className={styles.preload}>{LOADING_ARTICLES_LABEL}</p>
              ) : null}

              {!isLoadingArticles && articlesError ? (
                <p className={styles.error}>{articlesError}</p>
              ) : null}

              {!isLoadingArticles && hasLoadedArticles && !articlesError ? (
                <JournalArticles
                  articles={articles}
                  label={ARTICLES_LABEL}
                  emptyLabel={NO_ARTICLES_LABEL}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default HomePage
