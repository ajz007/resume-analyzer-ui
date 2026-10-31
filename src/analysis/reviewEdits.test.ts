import { describe, expect, it } from 'vitest'
import { addedWords, revisedPassages } from './reviewEdits'
import type { ReviewReport } from '../api/reviewReport'

const report: ReviewReport = {
  schemaVersion: '3', scope: 'SELECTED_PASSAGES', priorities: [],
  edits: [{ id: 'e1', operation: 'replace', section: 'Experience', before: 'Built APIs.', after: 'Built Java APIs.', insertAfter: '', reason: 'Supported clarification.', sourceQuotes: ['Built Java APIs.'], requirementIds: [] }],
  sections: [{ heading: 'Employer', editIds: ['e1'], retained: [{ text: 'Kept achievement.', sourceQuote: 'Kept achievement.' }] }],
}

describe('canonical reviewed passages', () => {
  it('highlights only additions and retains whitespace and literal markup', () => {
    const diff = addedWords('Built APIs.', 'Built Java APIs.')
    expect(diff.filter(x => x.changed).map(x => x.text).join('')).toBe('Java')
    expect(diff.map(x => x.text).join('')).toBe('Built Java APIs.')
    expect(addedWords('', '<script>alert(1)</script>').map(x => x.text).join('')).toBe('<script>alert(1)</script>')
  })
  it('uses the same canonical wording and user choice for the full result', () => {
    expect(revisedPassages(report, new Set())).toContain('Built Java APIs.')
    const kept = revisedPassages(report, new Set(['e1']))
    expect(kept).toContain('Built APIs.')
    expect(kept).not.toContain('Built Java APIs.')
    expect(kept).toContain('Kept achievement.')
  })
  it('supports strong resumes with no forced edits', () => {
    expect(revisedPassages({ ...report, edits: [], sections: [] }, new Set())).toBe('')
  })
  it('shows rejected removal and move operations as kept in their original location', () => {
    const source = report.edits![0]
    const changed: ReviewReport = { ...report, edits: [
      { ...source, id: 'removed', operation: 'remove', after: '' },
      { ...source, id: 'moved', operation: 'move', insertAfter: 'Anchor' },
    ], sections: [{ heading: 'Proposed destination', editIds: ['moved'], retained: [] }] }
    const text = revisedPassages(changed, new Set(['removed', 'moved']))
    expect(text).toContain('Kept in original resume')
    expect(text.split('Kept in original resume')[0]).not.toContain('Built APIs.')
    expect(text).not.toContain('Built Java APIs.')
  })
})
