import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import {
  NewResumeFormView,
  ResumeGenerationStatusCard,
  getDefaultTailorResumeId,
  getResumeGenerationPrimaryMessage,
  resumeWorkspacePath,
} from './NewResumePage'

const notes = {
  title: 'Platform Engineer Resume',
  targetRole: 'Platform Engineer',
  seniority: 'Senior',
  jobDescription: 'Build backend systems with Go and AWS.',
  experienceText: 'Built platform tooling',
  skillsText: 'Go, AWS',
  educationText: '',
  additionalInstructions: '',
}

const withRouter = (node: React.ReactElement) => <MemoryRouter>{node}</MemoryRouter>

describe('NewResumePage helpers', () => {
  it('uses queued copy while generation is waiting to start', () => {
    expect(getResumeGenerationPrimaryMessage('experience', 'queued')).toBe('Queued for generation...')
  })

  it('uses sample generation copy for inspiration-only output', () => {
    expect(getResumeGenerationPrimaryMessage('sample', 'processing')).toBe(
      'Creating a sample resume/template. Replace all examples with your real experience before applying.',
    )
  })

  it('selects the only saved resume by default', () => {
    expect(
      getDefaultTailorResumeId([
        {
          id: 'resume-123',
          title: 'Platform Engineer Resume',
          status: 'draft',
          createdAt: '2026-06-28T00:00:00.000Z',
          updatedAt: '2026-06-28T00:00:00.000Z',
        },
      ]),
    ).toBe('resume-123')
  })

  it('builds the completed resume navigation path from response.resumeId', () => {
    expect(resumeWorkspacePath('resume-123')).toBe('/app/resumes/resume-123')
  })
})

describe('NewResumePage generation UI', () => {
  it('renders queued state guidance after generation starts', () => {
    const html = renderToStaticMarkup(
      withRouter(
        <ResumeGenerationStatusCard
          mode="experience"
          generation={{ generationId: 'gen-123', status: 'queued', startedAtMs: Date.now() }}
          onRetry={() => undefined}
        />,
      ),
    )

    expect(html).toContain('Queued for generation...')
    expect(html).toContain('Generating your resume. This can take up to a minute.')
    expect(html).toContain('gen-123')
  })

  it('renders processing state guidance for a sample resume flow', () => {
    const html = renderToStaticMarkup(
      withRouter(
        <NewResumeFormView
          mode="sample"
          notes={{ ...notes, experienceText: '' }}
          generation={{ generationId: 'gen-123', status: 'processing', startedAtMs: Date.now() }}
          savedResumes={[]}
          onModeChange={() => undefined}
          onBaseResumeChange={() => undefined}
          onNoteChange={() => undefined}
          onSubmit={() => undefined}
          onCancel={() => undefined}
          onRetryGeneration={() => undefined}
          onUploadResume={() => undefined}
        />,
      ),
    )

    expect(html).toContain('Creating a sample resume/template. Replace all examples with your real experience before applying.')
  })

  it('renders failed state with the backend error message and retry action', () => {
    const html = renderToStaticMarkup(
      withRouter(
        <ResumeGenerationStatusCard
          mode="experience"
          generation={{
            generationId: 'gen-123',
            status: 'failed',
            errorMessage: 'Generation request was invalid.',
            startedAtMs: Date.now(),
          }}
          onRetry={() => undefined}
        />,
      ),
    )

    expect(html).toContain('Generation request was invalid.')
    expect(html).toContain('Retry generation')
  })
})
