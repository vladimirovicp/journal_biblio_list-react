import type { JournalArticle, JournalIssue, JournalIssueMetadata } from './types'

const COLLECTION_KEYS = ['list', 'items', 'nodes', 'data', 'results']

export const EMPTY_ISSUE_METADATA: JournalIssueMetadata = {
  fieldYear: '',
  fieldVolume: '',
  fieldNumber: '',
  fieldPart: '',
}

const normalizeScalarValue = (value: unknown): string | null => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  return null
}

const extractNestedScalarValue = (value: unknown): string | null => {
  const directValue = normalizeScalarValue(value)
  if (directValue !== null) {
    return directValue
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalizedEntry = extractNestedScalarValue(entry)
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
    const nestedValue = extractNestedScalarValue(source[key])
    if (nestedValue !== null) {
      return nestedValue
    }
  }

  return null
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

export const extractIssues = (payload: unknown): JournalIssue[] => {
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

export const extractIssueMetadata = (
  payload: unknown,
): JournalIssueMetadata => {
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
        appendRecord((item as Record<string, unknown>).node)
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
      fieldYear = extractNestedScalarValue(source.field_year) ?? ''
    }

    if (!fieldVolume) {
      fieldVolume = extractNestedScalarValue(source.field_volume) ?? ''
    }

    if (!fieldNumber) {
      fieldNumber = extractNestedScalarValue(source.field_number) ?? ''
    }

    if (!fieldPart) {
      fieldPart = extractNestedScalarValue(source.field_part) ?? ''
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
    extractNestedScalarValue(source.field_journal_link) ??
    extractNestedScalarValue(nestedNode?.field_journal_link)

  if (!idValue || !title || !journalLinkValue) {
    return null
  }

  return {
    id: idValue,
    title,
    journalLink: journalLinkValue,
  }
}

export const extractArticles = (
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

