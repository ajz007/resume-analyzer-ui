import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { AnalysisResponse } from '../../api/types'
import { normalizeAnalysisResponse } from '../../analysis/normalizeAnalysisResponse'
import AtsChecksSection from './AtsChecksSection'

const buildResult = (ats: Record<string, unknown>): AnalysisResponse =>
  ({
    analysisId: 'analysis-1',
    createdAt: new Date().toISOString(),
    finalScore: 73,
    matchScore: 0,
    missingKeywords: [],
    weakKeywords: [],
    atsChecks: [],
    bulletSuggestions: [],
    summary: '',
    nextSteps: [],
    issues: [],
    ats,
  }) as AnalysisResponse

describe('AtsChecksSection', () => {
  it('shows missing job keywords and formatting issues instead of "no issues"', () => {
    const result = normalizeAnalysisResponse(
      buildResult({
        score: 73,
        missingKeywords: { fromJobDescription: ['distributed systems', 'SLO'], industryCommon: [] },
        formattingIssues: ['Education has no graduation year.'],
      }),
    )
    const html = renderToStaticMarkup(<AtsChecksSection result={result} />)
    expect(html).toContain('distributed systems')
    expect(html).toContain('Education has no graduation year.')
    expect(html).not.toContain('No ATS-specific issues were flagged.')
  })

  it('says no issues were flagged only when there are none', () => {
    const result = normalizeAnalysisResponse(
      buildResult({ score: 90, missingKeywords: { fromJobDescription: [] }, formattingIssues: [] }),
    )
    const html = renderToStaticMarkup(<AtsChecksSection result={result} />)
    expect(html).toContain('No ATS-specific issues were flagged.')
  })
})
