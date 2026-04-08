import type { JournalIssue } from './types'

export const compareIssueField = (left: string, right: string) => {
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

export const sortIssuesByMetadata = (issues: JournalIssue[]) =>
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
  })

