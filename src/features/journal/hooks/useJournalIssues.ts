import { useEffect, useState } from 'react'
import { fetchJournalIssues } from '../api/journalApi'
import type { JournalIssue } from '../model/types'

type UseJournalIssuesParams = {
  selectedEnvironment: string
  selectedBaseUrl: string
}

type UseJournalIssuesResult = {
  issues: JournalIssue[]
  isLoadingIssues: boolean
  issuesError: string
  hasLoadedIssues: boolean
}

const ISSUES_ERROR_LABEL = 'Не удалось загрузить список выпусков.'

export const useJournalIssues = ({
  selectedEnvironment,
  selectedBaseUrl,
}: UseJournalIssuesParams): UseJournalIssuesResult => {
  const [issues, setIssues] = useState<JournalIssue[]>([])
  const [isLoadingIssues, setIsLoadingIssues] = useState(false)
  const [issuesError, setIssuesError] = useState('')
  const [hasLoadedIssues, setHasLoadedIssues] = useState(false)

  useEffect(() => {
    if (!selectedEnvironment || !selectedBaseUrl) {
      setIssues([])
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
        const loadedIssues = await fetchJournalIssues(
          selectedEnvironment,
          selectedBaseUrl,
          abortController.signal,
        )

        if (!abortController.signal.aborted) {
          setIssues(loadedIssues)
          setHasLoadedIssues(true)
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        setIssues([])
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

  return {
    issues,
    isLoadingIssues,
    issuesError,
    hasLoadedIssues,
  }
}

