import { describe, expect, it } from 'vitest'
import { fromBackendResult } from './fromBackend'
import { normalizeAnalysisResponse } from '../normalizeAnalysisResponse'

describe('report diagnostic coverage through adapters', () => {
  it('keeps string/object formatting findings and JD terminology in the displayed report', () => {
    const result = normalizeAnalysisResponse(fromBackendResult({
      meta: { mode: 'JOB_MATCH' },
      ats: {
        score: 82,
        missingKeywords: { fromJobDescription: ['SLO'], industryCommon: ['observability'] },
        formattingIssues: ['Review split words in the extraction.', { problem: 'Duplicated skills sections.' }],
      },
    }))
    expect(result.normalized.atsFormattingIssues).toEqual(['Review split words in the extraction.', 'Duplicated skills sections.'])
    expect(result.normalized.missingKeywordsFromJD).toEqual(['SLO'])
    expect(result.normalized.missingKeywordsIndustryCommon).toEqual(['observability'])
  })
  it('retains observed issues even if the score is absent', () => {
    const result = normalizeAnalysisResponse(fromBackendResult({ ats: { formattingIssues: ['Check the section order.'] } }))
    expect(result.normalized.atsFormattingIssues).toEqual(['Check the section order.'])
    expect(result.ats?.score).toBeUndefined()
  })
})
