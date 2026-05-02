import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ResumeForm, { AnalysisProgressCard } from './ResumeForm'
import { useAnalysisStore } from '../store/useAnalysisStore'

vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({ ref: () => {} }),
    isDragActive: false,
  }),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

describe('ResumeForm rendering', () => {
  it('hides JD textarea in ATS mode', () => {
    useAnalysisStore.setState({
      jdText: '',
      status: 'idle',
      lastStatus: 'idle',
      lastErrorCode: undefined,
      error: undefined,
      uploadedDoc: undefined,
    })

    const html = renderToStaticMarkup(<ResumeForm analysisMode="ATS" />)

    expect(html).not.toContain('Job description')
    expect(html).not.toContain('id="jd"')
  })

  it('shows JD textarea in JOB_MATCH mode', () => {
    useAnalysisStore.setState({
      jdText: '',
      status: 'idle',
      lastStatus: 'idle',
      lastErrorCode: undefined,
      error: undefined,
      uploadedDoc: undefined,
    })

    const html = renderToStaticMarkup(<ResumeForm analysisMode="JOB_MATCH" />)

    expect(html).toContain('Job description')
    expect(html).toContain('id="jd"')
  })

  it('shows JOB_MATCH analysis progress steps while running', () => {
    const html = renderToStaticMarkup(
      <AnalysisProgressCard analysisMode="JOB_MATCH" elapsedSeconds={0} runStatus="processing" />,
    )

    expect(html).toContain('Analyzing your resume')
    expect(html).toContain('Elapsed: 0s')
    expect(html).toContain('checking ATS readability, job requirements, proof gaps, and AI shortlist signals')
    expect(html).toContain('Upload received')
    expect(html).toContain('Identifying job priorities')
    expect(html).toContain('Comparing resume evidence with role requirements')
    expect(html).toContain('Preparing recommendations and rewrite suggestions')
  })

  it('shows ATS analysis progress steps while running', () => {
    const html = renderToStaticMarkup(
      <AnalysisProgressCard analysisMode="ATS" elapsedSeconds={0} runStatus="processing" />,
    )

    expect(html).toContain('checking readability, structure, formatting, and ATS parsing risk')
    expect(html).toContain('Checking structure and formatting')
    expect(html).toContain('Finding ATS readability issues')
    expect(html).toContain('Preparing recommendations')
  })

  it('shows calm long-running helper text after sixty seconds', () => {
    const html = renderToStaticMarkup(
      <AnalysisProgressCard analysisMode="JOB_MATCH" elapsedSeconds={61} runStatus="processing" />,
    )

    expect(html).toContain('This is taking a little longer than usual')
  })

  it('shows completion state without active progress copy', () => {
    const successHtml = renderToStaticMarkup(
      <AnalysisProgressCard analysisMode="JOB_MATCH" elapsedSeconds={10} runStatus="completed" complete />,
    )
    expect(successHtml).toContain('Report ready. Opening your results...')
    expect(successHtml).not.toContain('Elapsed:')
  })
})
