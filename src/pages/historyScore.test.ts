import { describe, expect, it } from 'vitest'
import { getMatchScore, getOverallScore } from './historyScore'

describe('historyScore helpers', () => {
  it('returns overall score only when completed', () => {
    expect(getOverallScore({ status: 'processing', finalScore: 72 })).toBe('—')
    expect(getOverallScore({ status: 'completed', finalScore: 72 })).toBe('72/100')
  })

  it('returns match score when present', () => {
    expect(getMatchScore({ matchScore: 64 })).toBe('64/100')
    expect(getMatchScore({ matchScore: undefined })).toBe('—')
  })
})
