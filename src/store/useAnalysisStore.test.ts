import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/endpoints', () => ({
  ResumeParseError: class ResumeParseError extends Error {
    parseFailure: unknown

    constructor(parseFailure: unknown) {
      super('parse failed')
      this.parseFailure = parseFailure
    }
  },
  analyzeDocument: vi.fn(),
  fetchUsage: vi.fn(),
  getResumeParseFailure: vi.fn(),
}))

vi.mock('./useUsageStore', () => ({
  useUsageStore: {
    getState: () => ({ fetch: vi.fn() }),
  },
}))

const { useAnalysisStore } = await import('./useAnalysisStore')
const { ResumeParseError, analyzeDocument, getResumeParseFailure } = await import('../api/endpoints')
const mockedAnalyze = vi.mocked(analyzeDocument)
const mockedGetResumeParseFailure = vi.mocked(getResumeParseFailure)

describe('useAnalysisStore validation', () => {

  const baseResult = {
    analysisId: 'a1',
    createdAt: new Date().toISOString(),
    matchScore: 0,
    missingKeywords: [],
    weakKeywords: [],
    atsChecks: [],
    bulletSuggestions: [],
    summary: '',
    nextSteps: [],
  }

  beforeEach(() => {
    globalThis.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage
    useAnalysisStore.getState().reset()
    useAnalysisStore.setState({
      status: 'idle',
      lastStatus: 'idle',
      lastErrorCode: undefined,
      lastSubmitAt: undefined,
      error: undefined,
      result: undefined,
      analysisId: undefined,
    })
    mockedAnalyze.mockReset()
    mockedGetResumeParseFailure.mockReset()
  })

  it('allows ATS submit with empty JD when resume is uploaded', async () => {
    mockedAnalyze.mockResolvedValue(baseResult)

    useAnalysisStore.setState({
      analysisMode: 'ATS',
      jdText: '',
      uploadedDoc: {
        documentId: 'doc-1',
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 123,
        uploadedAt: new Date().toISOString(),
      },
    })

    await useAnalysisStore.getState().submitAnalysis()

    expect(mockedAnalyze).toHaveBeenCalled()
    expect(useAnalysisStore.getState().error).toBeUndefined()
  })

  it('blocks JOB_MATCH submit with short JD', async () => {
    useAnalysisStore.setState({
      analysisMode: 'JOB_MATCH',
      jdText: 'short',
      uploadedDoc: {
        documentId: 'doc-2',
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 123,
        uploadedAt: new Date().toISOString(),
      },
    })

    await useAnalysisStore.getState().submitAnalysis()

    expect(mockedAnalyze).not.toHaveBeenCalled()
    expect(useAnalysisStore.getState().error).toContain('Job description is too short')
  })

  it('stores structured parse failures without generic analysis error', async () => {
    const parseFailure = {
        status: 'PARSE_FAILED',
        code: 'UNSUPPORTED_RESUME_FORMAT',
        title: 'Unable to reliably read resume',
        message: 'Parser could not extract enough text.',
        recommendations: ['Upload a DOCX version'],
      }
    mockedAnalyze.mockRejectedValue(new ResumeParseError(parseFailure))
    mockedGetResumeParseFailure.mockReturnValue(parseFailure)

    useAnalysisStore.setState({
      analysisMode: 'ATS',
      jdText: '',
      uploadedDoc: {
        documentId: 'doc-3',
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 123,
        uploadedAt: new Date().toISOString(),
      },
    })

    await useAnalysisStore.getState().submitAnalysis()

    expect(useAnalysisStore.getState().status).toBe('error')
    expect(useAnalysisStore.getState().error).toBeUndefined()
    expect(useAnalysisStore.getState().parseFailure?.code).toBe('UNSUPPORTED_RESUME_FORMAT')
  })
})
