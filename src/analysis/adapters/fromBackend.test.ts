import { describe, expect, it } from 'vitest'
import { fromBackendResult } from './fromBackend'

describe('fromBackendResult', () => {
  it('uses ats.score as finalScore and derives matchScore from JD gap when missing', () => {
    const result = fromBackendResult({
      meta: { analysisId: 'a1', jobDescriptionProvided: true },
      ats: {
        score: 74,
        missingKeywords: {
          fromJobDescription: ['A', 'B', 'C', 'D', 'E'],
        },
      },
    })

    expect(result.finalScore).toBe(74)
    expect(result.matchScore).toBe(80)
  })

  it('prefers ats.score even when scoreExplanation exists and computes JD match score', () => {
    const result = fromBackendResult({
      meta: { analysisId: 'a3', jobDescriptionProvided: true },
      ats: {
        score: 74,
        scoreExplanation: {
          totalScore: 88,
          components: [
            { id: 'ats_readability', score: 90, weight: 0.25 },
            { id: 'skill_match', score: 80, weight: 0.35 },
            { id: 'experience_relevance', score: 95, weight: 0.25 },
            { id: 'resume_structure', score: 85, weight: 0.15 },
          ],
        },
        missingKeywords: {
          fromJobDescription: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
        },
      },
    })

    expect(result.finalScore).toBe(74)
    expect(result.matchScore).toBe(60)
  })

  it('falls back to scoreExplanation when ats.score is missing', () => {
    const result = fromBackendResult({
      meta: { analysisId: 'a2', jobDescriptionProvided: false },
      ats: {
        scoreExplanation: {
          totalScore: 88,
          components: [
            { id: 'ats_readability', score: 90, weight: 0.25 },
            { id: 'skill_match', score: 80, weight: 0.35 },
            { id: 'experience_relevance', score: 95, weight: 0.25 },
            { id: 'resume_structure', score: 85, weight: 0.15 },
          ],
        },
      },
    })

    expect(result.finalScore).toBe(88)
    expect(result.matchScore).toBe(0)
  })
})
