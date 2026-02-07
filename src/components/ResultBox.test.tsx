import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { AnalysisResponse } from '../api/types'

let currentMode: 'ATS' | 'JOB_MATCH' = 'JOB_MATCH'

vi.mock('../store/useAnalysisStore', () => ({
  useAnalysisStore: () => ({ analysisMode: currentMode }),
}))

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

describe('ResultBox label', () => {
  it('shows ATS Score when mode is ATS', async () => {
    currentMode = 'ATS'
    const { default: ResultBox } = await import('./ResultBox')
    const html = renderToStaticMarkup(<ResultBox result={buildResult()} />)
    expect(html).toContain('ATS Score')
    expect(html).toContain('Estimates ATS friendliness')
  })

  it('shows Match Score when mode is JOB_MATCH', async () => {
    currentMode = 'JOB_MATCH'
    const { default: ResultBox } = await import('./ResultBox')
    const html = renderToStaticMarkup(<ResultBox result={buildResult()} />)
    expect(html).toContain('Match Score')
    expect(html).toContain('Estimates how well your resume aligns')
  })
})
