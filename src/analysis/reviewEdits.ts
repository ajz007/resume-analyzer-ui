import type { ReviewEdit, ReviewReport } from '../api/reviewReport'

export type DiffToken = { text: string; changed: boolean }

// Word-level LCS; keep whitespace and render text through React, never innerHTML.
export function addedWords(before: string, after: string): DiffToken[] {
  const a = before.match(/\S+|\s+/g) ?? []
  const b = after.match(/\S+|\s+/g) ?? []
  if (a.length * b.length > 250_000) return [{ text: after, changed: before !== after }]
  const rows = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      rows[i][j] = a[i] === b[j] ? rows[i + 1][j + 1] + 1 : Math.max(rows[i + 1][j], rows[i][j + 1])
  let i = 0
  let j = 0
  const result: DiffToken[] = []
  while (j < b.length) {
    if (i < a.length && a[i] === b[j]) { result.push({ text: b[j++], changed: false }); i++ }
    else if (i < a.length && rows[i + 1][j] >= rows[i][j + 1]) i++
    else result.push({ text: b[j++], changed: b[j - 1].trim().length > 0 })
  }
  return result
}

export const chosenEditText = (edit: ReviewEdit, excluded: ReadonlySet<string>) =>
  excluded.has(edit.id) ? edit.before : edit.after

export const readablePassage = (text: string) => text.replace(/\s+/g, ' ').replace(/([\p{L}\p{N}])\s*-\s*(?=[\p{L}\p{N}])/gu, '$1-').trim()

export function sectionPassages(section: NonNullable<ReviewReport['sections']>[number], report: ReviewReport, excluded: ReadonlySet<string>): { key: string; text: string }[] {
  const edits = new Map((report.edits ?? []).map(edit => [edit.id, edit]))
  const fallback = [
    ...section.editIds.map(editId => ({ editId, retainedIndex: -1 })),
    ...section.retained.map((_item, retainedIndex) => ({ editId: '', retainedIndex })),
  ]
  const items = section.items?.length === fallback.length ? section.items : fallback
  return items.flatMap(item => {
    if (item.editId) {
      const edit = edits.get(item.editId)
      if (!edit || (edit.operation === 'move' && excluded.has(edit.id))) return []
      const text = readablePassage(chosenEditText(edit, excluded))
      return text ? [{ key: edit.id, text }] : []
    }
    const retained = section.retained[item.retainedIndex]
    return retained ? [{ key: `retained-${item.retainedIndex}`, text: readablePassage(retained.text) }] : []
  })
}

// Legacy questions remain available verbatim in details. The first visible ask
// omits follow-up sentences and separately introduced questions where safe.
export function questionFocus(question: string): string {
  if (!question.includes('?')) return question
  let focus = question.split('?')[0].trim()
  const firstAsk = /\b(?:what|which|when|where|how|have you|did you|do you|can you)\b/i.exec(focus)
  const followups = focus.matchAll(/,\s+(?:(?:and\s+)?(?:what|which|when|where|how|did you)\b|or performed\b)|\s+and\s+(?:what|which|when|where|how)\b/gi)
  const followup = [...followups].find(match => firstAsk && match.index! > firstAsk.index + firstAsk[0].length)
  if (followup) focus = focus.slice(0, followup.index).trim()
  return focus ? `${focus}?` : question
}

export function unresolvedOutcomes(report: ReviewReport): { required: string[]; optional: string[] } {
  const required: string[] = []
  const optional = [...(report.outcomes?.optionalImprovements ?? [])]
  for (const text of report.outcomes?.stillUnresolved ?? []) {
    if (/^(?:preferred|optional)\b/i.test(text)) optional.push(text)
    else required.push(text)
  }
  return { required, optional }
}

export function revisedPassages(report: ReviewReport, excluded: ReadonlySet<string>): string {
  const sections = (report.sections ?? []).map(section => [
    section.heading,
    ...sectionPassages(section, report, excluded).map(item => item.text),
  ].join('\n\n'))
  const kept = (report.edits ?? []).filter(edit => excluded.has(edit.id) && (edit.operation === 'remove' || edit.operation === 'move'))
  if (kept.length) sections.push(['Kept in original resume', ...kept.map(edit => `${edit.section}\n${readablePassage(edit.before)}`)].join('\n\n'))
  return sections.join('\n\n')
}
