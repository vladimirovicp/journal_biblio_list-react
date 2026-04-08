import { type ChangeEvent, useMemo } from 'react'
import { sortIssuesByMetadata } from '../model/sort'
import type { JournalIssue } from '../model/types'
import styles from './IssueSelector.module.css'

type IssueSelectorProps = {
  issues: JournalIssue[]
  value: string
  onChange: (value: string) => void
  label: string
  emptyLabel: string
  notSelectedLabel: string
}

const IssueSelector = ({
  issues,
  value,
  onChange,
  label,
  emptyLabel,
  notSelectedLabel,
}: IssueSelectorProps) => {
  const sortedIssues = useMemo(() => sortIssuesByMetadata(issues), [issues])

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value)
  }

  return (
    <div className={styles.wrapper}>
      <label htmlFor="issue-selector" className={styles.label}>
        {label}
      </label>
      <select
        id="issue-selector"
        className={styles.select}
        value={value}
        onChange={handleChange}
        disabled={issues.length === 0}
      >
        {issues.length === 0 ? (
          <option value="">{emptyLabel}</option>
        ) : (
          <>
            <option value="">{notSelectedLabel}</option>
            {sortedIssues.map((issue) => (
              <option
                key={issue.nid}
                value={issue.nid}
                data-year={issue.fieldYear}
                data-issue={issue.fieldVolume}
                data-volume={issue.fieldNumber}
                data-part={issue.fieldPart}
              >
                {issue.title}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  )
}

export default IssueSelector

