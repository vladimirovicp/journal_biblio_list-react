import { useEffect, useState } from 'react'
import { fetchJournalArticles } from '../api/journalApi'
import type { JournalArticle } from '../model/types'

type UseJournalArticlesParams = {
  selectedEnvironment: string
  selectedBaseUrl: string
  selectedIssueNid: string
  selectedIssueUri: string | null
}

type UseJournalArticlesResult = {
  articles: JournalArticle[]
  isLoadingArticles: boolean
  articlesError: string
  hasLoadedArticles: boolean
}

const ARTICLES_ERROR_LABEL = 'Не удалось загрузить список статей.'

export const useJournalArticles = ({
  selectedEnvironment,
  selectedBaseUrl,
  selectedIssueNid,
  selectedIssueUri,
}: UseJournalArticlesParams): UseJournalArticlesResult => {
  const [articles, setArticles] = useState<JournalArticle[]>([])
  const [isLoadingArticles, setIsLoadingArticles] = useState(false)
  const [articlesError, setArticlesError] = useState('')
  const [hasLoadedArticles, setHasLoadedArticles] = useState(false)

  useEffect(() => {
    if (!selectedEnvironment || !selectedBaseUrl || !selectedIssueNid) {
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
        const loadedArticles = await fetchJournalArticles(
          selectedEnvironment,
          selectedBaseUrl,
          selectedIssueNid,
          selectedIssueUri,
          abortController.signal,
        )

        if (!abortController.signal.aborted) {

          console.log('Articles loaded for selected issue:', loadedArticles)

          
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
  }, [selectedBaseUrl, selectedEnvironment, selectedIssueNid, selectedIssueUri])

  return {
    articles,
    isLoadingArticles,
    articlesError,
    hasLoadedArticles,
  }
}


