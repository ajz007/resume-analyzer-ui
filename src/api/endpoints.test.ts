import { describe, expect, it } from 'vitest'
import { withResultAnalysisId } from './endpoints'

describe('withResultAnalysisId', () => {
  it('injects top-level status id into result.meta.analysisId when missing', () => {
    const resultWithId = withResultAnalysisId({
      id: '11111111-2222-3333-4444-555555555555',
      status: 'completed',
      result: {
        summary: { overview: 'done' },
      },
    })

    expect(resultWithId?.meta?.analysisId).toBe('11111111-2222-3333-4444-555555555555')
  })

  it('preserves existing result.meta.analysisId when present', () => {
    const resultWithId = withResultAnalysisId({
      id: 'top-level-id',
      status: 'completed',
      result: {
        meta: { analysisId: 'nested-id' },
      },
    })

    expect(resultWithId?.meta?.analysisId).toBe('nested-id')
  })
})
