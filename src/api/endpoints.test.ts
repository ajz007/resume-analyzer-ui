import { describe, expect, it } from 'vitest'
import { getResumeParseFailure, withResultAnalysisId } from './endpoints'

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

describe('getResumeParseFailure', () => {
  it('normalizes parse failures from status responses', () => {
    const failure = getResumeParseFailure({
      status: 'PARSE_FAILED',
      code: 'UNSUPPORTED_RESUME_FORMAT',
      title: 'Unable to reliably read resume',
      message: 'Resume format is unsupported.',
      recommendations: ['Upload a DOCX version'],
      parser_used: 'pdfjs',
      extracted_character_count: 42,
    })

    expect(failure).toMatchObject({
      status: 'PARSE_FAILED',
      code: 'UNSUPPORTED_RESUME_FORMAT',
      parserUsed: 'pdfjs',
      extractedCharacterCount: 42,
    })
  })

  it('recognizes the backend parse failure response shape', () => {
    const failure = getResumeParseFailure({
      analysisId: 'cb05eb78-f8fc-431d-af45-bd5ca2663139',
      atsInsight: {
        message:
          'Your resume format may not be ATS-friendly. If our parser cannot reliably extract text, some ATS platforms may also struggle to process it.',
        title: 'Resume Format Warning',
      },
      code: 'UNSUPPORTED_RESUME_FORMAT',
      completedAt: '2026-05-30T19:53:28.602031Z',
      id: 'cb05eb78-f8fc-431d-af45-bd5ca2663139',
      message:
        'Your resume appears to use formatting that may be difficult for ATS systems and resume parsers to read.',
      mode: 'JOB_MATCH',
      recommendations: [
        'Upload a DOCX version',
        'Export as a text-based PDF',
        'Avoid Canva-style or image-heavy layouts',
        'Try a simpler ATS-friendly format',
      ],
      startedAt: '2026-05-30T19:53:28.481886Z',
      status: 'PARSE_FAILED',
      title: 'Unable to reliably read resume',
    })

    expect(failure).toMatchObject({
      status: 'PARSE_FAILED',
      code: 'UNSUPPORTED_RESUME_FORMAT',
      title: 'Unable to reliably read resume',
      recommendations: [
        'Upload a DOCX version',
        'Export as a text-based PDF',
        'Avoid Canva-style or image-heavy layouts',
        'Try a simpler ATS-friendly format',
      ],
    })
  })
})
