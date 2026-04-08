export type JournalIssue = {
  nid: string
  uri: string
  title: string
  fieldYear: string
  fieldVolume: string
  fieldNumber: string
  fieldPart: string
}

export type JournalArticle = {
  id: string
  title: string
  journalLink: string
}

export type JournalIssueMetadata = Pick<
  JournalIssue,
  'fieldYear' | 'fieldVolume' | 'fieldNumber' | 'fieldPart'
>
