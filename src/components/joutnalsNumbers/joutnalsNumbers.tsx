import { type ChangeEvent, useMemo } from 'react'
import styles from './joutnalsNumbers.module.css'

type JournalIssueOption = {
  nid: string
  uri: string
  title: string
  fieldYear: string
  fieldVolume: string
  fieldNumber: string
  fieldPart: string
}

type JoutnalsNumbersProps = {
  issues: JournalIssueOption[]
  value: string
  onChange: (value: string) => void
  label: string
  emptyLabel: string
  notSelectedLabel: string
}

const compareIssueField = (left: string, right: string) => {
  const leftTrimmed = left.trim()
  const rightTrimmed = right.trim()

  const leftNumeric = Number(leftTrimmed)
  const rightNumeric = Number(rightTrimmed)
  const isLeftNumeric = leftTrimmed !== '' && !Number.isNaN(leftNumeric)
  const isRightNumeric = rightTrimmed !== '' && !Number.isNaN(rightNumeric)

  if (isLeftNumeric && isRightNumeric && leftNumeric !== rightNumeric) {
    return rightNumeric - leftNumeric
  }

  return rightTrimmed.localeCompare(leftTrimmed, 'ru', {
    sensitivity: 'base',
    numeric: true,
  })
}

const JoutnalsNumbers = ({
  issues,
  value,
  onChange,
  label,
  emptyLabel,
  notSelectedLabel,
}: JoutnalsNumbersProps) => {
  const sortedIssues = useMemo(
    () =>
      [...issues].sort((a, b) => {
        const byYear = compareIssueField(a.fieldYear, b.fieldYear)
        if (byYear !== 0) {
          return byYear
        }

        const byIssue = compareIssueField(a.fieldVolume, b.fieldVolume)
        if (byIssue !== 0) {
          return byIssue
        }

        const byVolume = compareIssueField(a.fieldNumber, b.fieldNumber)
        if (byVolume !== 0) {
          return byVolume
        }

        const byPart = compareIssueField(a.fieldPart, b.fieldPart)
        if (byPart !== 0) {
          return byPart
        }

        return b.title.localeCompare(a.title, 'ru', {
          sensitivity: 'base',
          numeric: true,
        })
      }),
    [issues],
  )

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value)
  }

  //console.log(issues);

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

export default JoutnalsNumbers
