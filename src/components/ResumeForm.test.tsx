import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ResumeForm from './ResumeForm'
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
})
