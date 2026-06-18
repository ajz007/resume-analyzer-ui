import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ResumeForm, { AnalysisProgressCard, ResumeQuotaNotice } from './ResumeForm'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useUsageStore } from '../store/useUsageStore'

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
  const resetStorage = () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage
    globalThis.localStorage = storage
    return storage
  }

  it('hides JD textarea in ATS mode', () => {
    resetStorage()
    useUsageStore.setState({ usage: null, loading: false, error: undefined, errorStatus: undefined })
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
    resetStorage()
    useUsageStore.setState({ usage: null, loading: false, error: undefined, errorStatus: undefined })
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

  it('shows guest quota messaging with remaining analyses', () => {
    const html = renderToStaticMarkup(
      <ResumeQuotaNotice
        usage={{
          plan: 'Guest',
          used: 1,
          limit: 3,
          remaining: 2,
          authenticated: false,
          resetsAt: new Date().toISOString(),
        }}
        loggedIn={false}
        onSignIn={vi.fn()}
      />,
    )

    expect(html).toContain('2 of 3 guest analyses remaining. Sign in for 15/month.')
  })

  it('shows logged-in quota messaging with remaining analyses', () => {
    const html = renderToStaticMarkup(
      <ResumeQuotaNotice
        usage={{
          plan: 'Free account',
          used: 3,
          limit: 15,
          remaining: 12,
          authenticated: true,
          resetsAt: new Date().toISOString(),
        }}
        loggedIn
        onSignIn={vi.fn()}
      />,
    )

    expect(html).toContain('12 of 15 analyses remaining this month.')
  })

  it('shows guest limit reached conversion state', () => {
    const html = renderToStaticMarkup(
      <ResumeQuotaNotice
        usage={{
          plan: 'Guest',
          used: 3,
          limit: 3,
          remaining: 0,
          authenticated: false,
          resetsAt: new Date().toISOString(),
        }}
        loggedIn={false}
        onSignIn={vi.fn()}
      />,
    )

    expect(html).toContain('used your 3 free guest analyses this month.')
    expect(html).toContain('Sign in with Google')
  })

  it('shows logged-in limit reached state without sign-in upsell', () => {
    const html = renderToStaticMarkup(
      <ResumeQuotaNotice
        usage={{
          plan: 'Free account',
          used: 15,
          limit: 15,
          remaining: 0,
          authenticated: true,
          resetsAt: new Date().toISOString(),
        }}
        loggedIn
        onSignIn={vi.fn()}
      />,
    )

    expect(html).toContain('used your 15 free analyses this month.')
    expect(html).not.toContain('Sign in with Google')
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
