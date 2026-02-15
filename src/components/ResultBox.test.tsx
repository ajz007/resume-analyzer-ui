import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { AnalysisResponse } from '../api/types'
import { normalizeAnalysisResponse } from '../analysis/normalizeAnalysisResponse'
import ResultBox from './ResultBox'

const buildResult = (overrides: Partial<AnalysisResponse> = {}): AnalysisResponse => ({
  analysisId: 'analysis-1',
  createdAt: new Date().toISOString(),
  finalScore: 80,
  matchScore: 65,
  missingKeywords: [],
  weakKeywords: [],
  atsChecks: [],
  bulletSuggestions: [],
  summary: '',
  nextSteps: [],
  ...overrides,
})

describe('ResultBox wrapper', () => {
  it('renders ATS report when mode is ATS', () => {
    const normalized = normalizeAnalysisResponse(buildResult({ matchScore: 0 }))
    const html = renderToStaticMarkup(<ResultBox result={normalized} mode="ATS" />)
    expect(html).toContain('ATS Readiness')
    expect(html).toContain('ATS Score')
  })

  it('renders Job Match report when mode is JOB_MATCH', () => {
    const normalized = normalizeAnalysisResponse(buildResult())
    const html = renderToStaticMarkup(<ResultBox result={normalized} mode="JOB_MATCH" />)
    expect(html).toContain('Job Match Score')
    expect(html).toContain('ATS Readiness')
  })
})
