export type ReviewEdit = {
  id: string
  operation: 'replace' | 'remove' | 'retain' | 'add' | 'move' | 'merge'
  section: string
  before: string
  after: string
  insertAfter: string
  reason: string
  sourceQuotes: string[]
  confirmedAnswerId?: string
  requirementIds: string[]
}

export type ReviewReport = {
  schemaVersion: '3'
  scope: 'SELECTED_PASSAGES'
  priorities: { title: string; reason: string; editIds: string[] }[]
  // Paid fields are absent in server-redacted previews, not guessed by the UI.
  edits?: ReviewEdit[]
  sections?: { heading: string; editIds: string[]; retained: { text: string; sourceQuote: string }[]; items?: { editId: string; retainedIndex: number; sourceStart: number; sourceEnd: number }[] }[]
  questions?: { id: string; question: string; why: string; editIds: string[]; requirementIds?: string[] }[]
  outcomes?: { clearerNow: string[]; needsConfirmation: string[]; stillUnresolved: string[]; optionalImprovements?: string[] }
  cleanup?: { text: string; severity: string; sourceQuote: string }[]
  interviewPreparation?: string[]
  coverage?: { sourceQuote: string; disposition: string; reason: string }[]
}
