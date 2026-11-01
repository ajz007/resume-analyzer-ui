import { beforeEach, describe, expect, it } from 'vitest'
import { startNewJobReview, startNewReview } from './NewJobLink'
import { useAnalysisStore } from '../store/useAnalysisStore'

describe('explicit new-review actions', () => {
  beforeEach(() => useAnalysisStore.getState().reset())
  it('clears previous job and run state while preserving the source', () => {
    const source = { documentId: 'source', fileName: 'resume.pdf', sizeBytes: 20, mimeType: 'application/pdf', uploadedAt: '2026-11-01' }
    useAnalysisStore.setState({ uploadedDoc: source, companyName: 'Previous company', targetRole: 'Previous role', jdText: 'Previous posting', analysisId: 'old-review', status: 'success', lastStatus: 'completed', analysisMode: 'ATS' })
    startNewJobReview()
    const state = useAnalysisStore.getState()
    expect(state.uploadedDoc).toEqual(source)
    expect([state.companyName, state.targetRole, state.jdText]).toEqual(['', '', ''])
    expect(state.analysisId).toBeUndefined()
    expect(state.status).toBe('idle')
    expect(state.analysisMode).toBe('JOB_MATCH')
  })
  it('also starts an explicit readability review without a previous job context', () => {
    useAnalysisStore.setState({ companyName: 'Old company', jdText: 'Old posting' })
    startNewReview('ATS')
    expect(useAnalysisStore.getState().analysisMode).toBe('ATS')
    expect(useAnalysisStore.getState().jdText).toBe('')
    expect(useAnalysisStore.getState().companyName).toBe('')
  })
})
