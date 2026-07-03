import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import NewResumePage, {
  NewResumeFormView,
  buildGenerateResumeRequest,
  getDefaultTailorResumeId,
} from './NewResumePage'
import { ResumeListView } from './ResumeListPage'
import { TailorResultPanel } from './TailorResumePage'
import { ResumeWorkspaceAlerts } from './ResumeWorkspacePage'
import RequireLogin from '../../components/auth/RequireLogin'
import { getPrimaryNavItems, guestNavItems, primaryNavItems } from '../../components/layout/AppShell'
import PricingPage from '../PricingPage'
import {
  addSkill,
  replaceExperienceBullet,
  replaceSkill,
  removeSkill,
} from '../../components/resume/ResumeWorkspaceView'
import ResumeWorkspaceView from '../../components/resume/ResumeWorkspaceView'
import {
  createLocalResumeRecord,
  normalizeResumeRecord,
  resumeDocxPath,
  serializeCreateResumeRequest,
  serializeResumeForApi,
  serializeSaveResumeRequest,
  validateResumeModel,
  type ResumeModel,
  type ResumeRecord,
} from '../../api/resumes'

const sampleModel = (): ResumeModel => ({
  schemaVersion: 'resume.v1',
  basics: {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: {
      city: '',
      state: '',
      country: '',
    },
    links: [],
  },
  target: {
    roleTitle: '',
    seniority: '',
    persona: '',
    industry: '',
  },
  summary: { text: 'Platform engineer with Kubernetes and developer experience.' },
  skills: ['Kubernetes', 'Go'],
  experience: [
    {
      id: 'exp-1',
      company: 'Acme',
      title: 'Platform Engineer',
      bullets: [{ id: 'bullet-1', text: 'Improved deploy reliability by 25%.' }],
    },
  ],
  projects: [],
  education: [],
  certifications: [],
  achievements: [],
  customSections: [],
  sectionOrder: [],
})

const sampleResume = (): ResumeRecord => ({
  ...createLocalResumeRecord('Platform Engineer Resume'),
  id: 'resume-123',
  status: 'draft',
  currentVersionId: 'version-123',
  updatedAt: '2026-06-17T01:00:00.000Z',
  resume: sampleModel(),
  readinessWarnings: ['Add contact details.', 'Several bullets lack measurable impact.'],
})

const formNotes = {
  title: 'Platform Engineer Resume',
  targetRole: 'Platform Engineer',
  seniority: 'Senior',
  jobDescription: 'Platform role needing Kubernetes and Terraform.',
  experienceText: 'Led platform reliability work',
  skillsText: 'Go, Kubernetes',
  educationText: 'BS Computer Science',
  additionalInstructions: 'Keep claims conservative.',
}

const withRouter = (node: React.ReactElement) => <MemoryRouter>{node}</MemoryRouter>

describe('Resume Workspace UI', () => {
  it('renders resume list items with actions', () => {
    const html = renderToStaticMarkup(
      <ResumeListView
        resumes={[
          {
            id: 'resume-123',
            title: 'Platform Engineer Resume',
            status: 'draft',
            originType: 'manual',
            updatedAt: '2026-06-17T01:00:00.000Z',
            createdAt: '2026-06-16T01:00:00.000Z',
          },
        ]}
        loading={false}
        onNew={vi.fn()}
        onOpen={vi.fn()}
        onDownload={vi.fn()}
      />,
    )

    expect(html).toContain('Resume Workspace')
    expect(html).toContain('Platform Engineer Resume')
    expect(html).toContain('manual')
    expect(html).toContain('Open')
    expect(html).toContain('Download DOCX')
  })

  it('renders the create from notes form', () => {
    const html = renderToStaticMarkup(withRouter(<NewResumePage />))

    expect(html).toContain('Create or tailor your resume')
    expect(html).toContain('Tailor my resume for a job')
    expect(html).toContain('Build from my experience')
    expect(html).toContain('See sample resume for a job')
    expect(html).toContain('Start blank')
    expect(html).toContain('Recommended')
    expect(html).toContain('Upload resume for analysis')
    expect(html).toContain('Tailor resume')
  })

  it('renders sample creation mode with truthful template guidance', () => {
    const notes = {
      title: 'Backend Engineer Resume',
      targetRole: 'Backend Engineer',
      seniority: 'Senior',
      jobDescription: 'We need Go, AWS, and distributed systems experience.',
      experienceText: '',
      skillsText: '',
      educationText: '',
      additionalInstructions: '',
    }
    const html = renderToStaticMarkup(
      withRouter(
        <NewResumeFormView
          mode="sample"
          notes={notes}
          savedResumes={[]}
          onModeChange={vi.fn()}
          onBaseResumeChange={vi.fn()}
          onNoteChange={vi.fn()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          onUploadResume={vi.fn()}
        />,
      ),
    )

    expect(html).toContain('Job description')
    expect(html).toContain('This creates a sample resume/template for inspiration.')
    expect(html).toContain('Replace all examples with your real experience before applying.')
  })

  it('builds the sample generation request shape', () => {
    const request = buildGenerateResumeRequest('sample', {
      title: 'Backend Engineer Resume',
      targetRole: 'Backend Engineer',
      seniority: 'Senior',
      jobDescription: 'Go and AWS role',
      experienceText: 'Built APIs',
      skillsText: '',
      educationText: '',
      additionalInstructions: 'Keep concise',
    })

    expect(request).toMatchObject({
      generationMode: 'sample_from_job_description',
      jobDescription: 'Go and AWS role',
      experienceText: 'Built APIs',
    })
  })

  it('keeps the build-from-experience request shape wired', () => {
    const request = buildGenerateResumeRequest('experience', {
      title: 'Platform Engineer Resume',
      targetRole: 'Platform Engineer',
      seniority: 'Senior',
      jobDescription: 'Ignored for notes mode',
      experienceText: 'Led platform reliability work',
      skillsText: 'Go, Kubernetes',
      educationText: 'BS Computer Science',
      additionalInstructions: 'Use concise bullets',
    })

    expect(request).toMatchObject({
      generationMode: 'from_experience',
      jobDescription: 'Ignored for notes mode',
      experienceText: 'Led platform reliability work',
      skillsText: 'Go, Kubernetes',
      educationText: 'BS Computer Science',
    })
  })

  it('renders blank mode without generation fields', () => {
    const notes = {
      title: '',
      targetRole: '',
      seniority: '',
      jobDescription: '',
      experienceText: '',
      skillsText: '',
      educationText: '',
      additionalInstructions: '',
    }
    const html = renderToStaticMarkup(
      withRouter(
        <NewResumeFormView
          mode="blank"
          notes={notes}
          savedResumes={[]}
          onModeChange={vi.fn()}
          onBaseResumeChange={vi.fn()}
          onNoteChange={vi.fn()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          onUploadResume={vi.fn()}
        />,
      ),
    )

    expect(html).toContain('Start blank')
    expect(html).toContain('minimal structured ResumeModel')
    expect(html).not.toContain('Job description</span>')
  })

  it('marks tailor as the recommended flow card', () => {
    const html = renderToStaticMarkup(
      withRouter(
        <NewResumeFormView
          mode="tailor"
          notes={formNotes}
          savedResumes={[]}
          onModeChange={vi.fn()}
          onBaseResumeChange={vi.fn()}
          onNoteChange={vi.fn()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          onUploadResume={vi.fn()}
        />,
      ),
    )

    expect(html).toContain('Tailor my resume for a job')
    expect(html).toContain('Recommended')
  })

  it('selects the only saved resume by default for tailoring', () => {
    expect(
      getDefaultTailorResumeId([
        {
          id: 'resume-123',
          title: 'Platform Engineer Resume',
          status: 'draft',
          createdAt: '2026-06-16T01:00:00.000Z',
          updatedAt: '2026-06-17T01:00:00.000Z',
        },
      ]),
    ).toBe('resume-123')
  })

  it('shows upload, build, and blank options when no saved resumes exist for tailoring', () => {
    const html = renderToStaticMarkup(
      withRouter(
        <NewResumeFormView
          mode="tailor"
          notes={formNotes}
          savedResumes={[]}
          onModeChange={vi.fn()}
          onBaseResumeChange={vi.fn()}
          onNoteChange={vi.fn()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          onUploadResume={vi.fn()}
        />,
      ),
    )

    expect(html).toContain('Upload resume for analysis')
    expect(html).toContain('Build from experience')
    expect(html).toContain('Start blank')
  })

  it('uses clear top navigation labels without duplicate resume builder labels', () => {
    const labels = primaryNavItems.map((item) => item.label)

    expect(labels).toEqual(['Build Resume', 'My Resumes', 'ATS Checker', 'Job Match', 'History'])
    expect(labels).not.toContain('AI Resume Builder')
    expect(labels).not.toContain('Resume Workspace')
    expect(labels).not.toContain('Resume Analysis')
    expect(labels).toContain('History')
  })

  it('shows public marketing navigation for guests and app navigation for signed-in users', () => {
    expect(guestNavItems.map((item) => item.label)).toEqual([
      'AI Resume Builder',
      'ATS Checker',
      'Resume Analysis',
      'Early Access',
    ])
    expect(getPrimaryNavItems(true).map((item) => item.label)).toEqual([
      'Build Resume',
      'My Resumes',
      'ATS Checker',
      'Job Match',
      'History',
    ])
  })

  it('renders a sign-in gate for protected resume routes', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/app/resumes']}>
        <RequireLogin />
      </MemoryRouter>,
    )

    expect(html).toContain('Sign in to access your resume workspace')
    expect(html).toContain('Sign in with Google')
  })

  it('renders the workspace with a loaded resume', () => {
    const html = renderToStaticMarkup(
      withRouter(
        <ResumeWorkspaceView
          resume={sampleResume()}
          selectedSection="summary"
          onChange={vi.fn()}
          onSave={vi.fn()}
          onDownloadDocx={vi.fn()}
        />,
      ),
    )

    expect(html).toContain('Platform Engineer Resume')
    expect(html).toContain('Professional summary')
    expect(html).toContain('Tailor for Job')
    expect(html).toContain('Run ATS Analysis')
  })

  it('renders sample templates with persistent warning-oriented workspace actions', () => {
    const html = renderToStaticMarkup(
      withRouter(
        <ResumeWorkspaceView
          resume={{ ...sampleResume(), title: 'Sample template - Platform Engineer' }}
          isSampleTemplate
          onChange={vi.fn()}
          onSave={vi.fn()}
          onDownloadDocx={vi.fn()}
        />,
      ),
    )

    expect(html).toContain('sample template')
    expect(html).toContain('Download sample DOCX')
    expect(html).toContain('replace every example with your real experience')
  })

  it('edits skills and experience bullets immutably before save', () => {
    const resume = sampleModel()
    const withAddedSkill = addSkill(resume)
    const withRenamedSkill = replaceSkill(withAddedSkill, 2, 'AWS')
    const withoutOriginalSkill = removeSkill(withRenamedSkill, 0)
    const withEditedBullet = replaceExperienceBullet(
      withoutOriginalSkill,
      'exp-1',
      'bullet-1',
      'Improved deploy reliability by 40%.',
    )

    expect(resume.skills).toEqual(['Kubernetes', 'Go'])
    expect(withoutOriginalSkill.skills).toEqual(['Go', 'AWS'])
    expect(withEditedBullet.experience[0].bullets[0].text).toBe('Improved deploy reliability by 40%.')
  })

  it('displays readiness warnings as guidance', () => {
    const html = renderToStaticMarkup(
      withRouter(
        <ResumeWorkspaceView
          resume={sampleResume()}
          onChange={vi.fn()}
          onSave={vi.fn()}
          onDownloadDocx={vi.fn()}
        />,
      ),
    )

    expect(html).toContain('Readiness warnings')
    expect(html).toContain('Add contact details.')
    expect(html).toContain('Several bullets lack measurable impact.')
  })

  it('displays tailor changes, missing requirements, and warnings', () => {
    const resume = sampleResume()
    const html = renderToStaticMarkup(
      <TailorResultPanel
        onOpen={vi.fn()}
        result={{
          ...resume,
          id: 'tailored-123',
          title: 'Tailored Platform Engineer Resume',
          sourceResumeId: 'resume-123',
          sourceVersionId: 'version-123',
          resume: resume.resume,
          changes: [
            {
              section: 'Summary',
              before: 'Platform engineer',
              after: 'Platform engineer focused on Kubernetes',
              reason: 'Matches the target role language.',
              risk: 'Verify the Kubernetes claim.',
              requiresUserInput: ['Confirm Kubernetes experience.'],
              assumptions: ['JD emphasis is based on pasted text.'],
              warnings: ['Do not add unsupported metrics.'],
            },
          ],
          missingRequirements: ['Terraform'],
          warnings: ['Confirm generated claims are accurate.'],
          requiresUserInput: ['Confirm tailored claims.'],
          assumptions: ['No external profile data was used.'],
          sampleExamples: ['Use this only if true for your experience: Led Terraform rollout.'],
        }}
      />,
    )

    expect(html).toContain('Generated tailored resume')
    expect(html).toContain('Safe rewrites')
    expect(html).toContain('Needs your confirmation')
    expect(html).toContain('Terraform')
    expect(html).toContain('Examples to adapt')
    expect(html).toContain('Use this only if true for your experience.')
    expect(html).toContain('Confirm generated claims are accurate.')
    expect(html).toContain('Confirm tailored claims.')
    expect(html).toContain('No external profile data was used.')
  })

  it('shows the sample disclaimer before and after generation', () => {
    const formHtml = renderToStaticMarkup(
      withRouter(
        <NewResumeFormView
          mode="sample"
          notes={formNotes}
          savedResumes={[]}
          onModeChange={vi.fn()}
          onBaseResumeChange={vi.fn()}
          onNoteChange={vi.fn()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          onUploadResume={vi.fn()}
        />,
      ),
    )
    const alertHtml = renderToStaticMarkup(
      <ResumeWorkspaceAlerts
        generationMode="sample"
        generationResult={{
          generationId: 'gen-123',
          status: 'completed',
          resumeId: 'resume-123',
          currentVersionId: 'version-123',
          resume: sampleModel(),
          readinessWarnings: ['Sample resume only - not ready to apply.'],
          requiresUserInput: ['Replace every example with your real experience before applying.'],
          assumptions: [],
          warnings: ['This is a sample/template for inspiration, not a verified resume.'],
          createdAt: '2026-06-17T01:00:00.000Z',
          startedAt: '2026-06-17T01:00:02.000Z',
          completedAt: '2026-06-17T01:00:20.000Z',
        }}
      />,
    )

    expect(formHtml).toContain('This creates a sample resume/template for inspiration.')
    expect(alertHtml).toContain('Sample resume only - not ready to apply.')
  })

  it('shows the sample disclaimer again when the sample is reopened later', () => {
    const alertHtml = renderToStaticMarkup(
      <ResumeWorkspaceAlerts
        generationMode="sample"
        sampleTemplateWarnings={[
          'Replace every example with your real experience before applying.',
          'This is a sample/template for inspiration, not a verified resume.',
        ]}
      />,
    )

    expect(alertHtml).toContain('Sample resume only - not ready to apply.')
    expect(alertHtml).toContain('Replace every example with your real experience before applying.')
  })

  it('uses the resume DOCX export endpoint', () => {
    expect(resumeDocxPath('resume-123')).toBe('/api/v1/resumes/resume-123/export/docx')
  })

  it('marks app pages as noindex', () => {
    const appMetadataSource = readFileSync(
      join(process.cwd(), 'src/components/seo/AppPageMetadata.tsx'),
      'utf8',
    )

    expect(appMetadataSource).toContain('robots="noindex, nofollow"')
  })

  it('normalizes standardized detail and generate response envelopes', () => {
    const normalized = normalizeResumeRecord({
      id: 'resume-123',
      title: 'Platform Engineer Resume',
      status: 'generated',
      currentVersionId: 'version-123',
      resume: sampleModel(),
      readinessWarnings: ['Add contact details.'],
      requiresUserInput: ['Confirm metrics.'],
      assumptions: ['Assumes backend role focus.'],
      warnings: ['Review claims.'],
      createdAt: '2026-06-17T01:00:00.000Z',
      updatedAt: '2026-06-18T01:00:00.000Z',
    })

    expect(normalized.id).toBe('resume-123')
    expect(normalized.currentVersionId).toBe('version-123')
    expect(normalized.resume.summary.text).toContain('Platform engineer')
    expect(normalized.readinessWarnings).toEqual(['Add contact details.'])
  })

  it('serializes create and save resume content to the backend contract', () => {
    const resume = {
      ...sampleModel(),
      basics: {
        fullName: 'Alex Morgan',
        headline: 'Platform Engineer',
        email: 'alex@example.com',
        phone: '555-0100',
        location: {
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
        },
        links: [
          { label: 'linkedin', url: 'https://linkedin.com/in/alexmorgan' },
          { label: 'website', url: 'https://alex.dev' },
        ],
      },
      target: {
        roleTitle: 'Senior Platform Engineer',
        seniority: 'Senior',
        persona: 'builder',
        industry: 'Cloud',
      },
    }
    const payload = serializeResumeForApi(resume)

    expect(payload).toEqual({
      schemaVersion: 'resume.v1',
      basics: {
        fullName: 'Alex Morgan',
        headline: 'Platform Engineer',
        email: 'alex@example.com',
        phone: '555-0100',
        location: {
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
        },
        links: [
          { label: 'linkedin', url: 'https://linkedin.com/in/alexmorgan' },
          { label: 'website', url: 'https://alex.dev' },
        ],
      },
      target: {
        roleTitle: 'Senior Platform Engineer',
        seniority: 'Senior',
        persona: 'builder',
        industry: 'Cloud',
      },
      summary: { text: 'Platform engineer with Kubernetes and developer experience.' },
      skills: ['Kubernetes', 'Go'],
      experience: [
        {
          id: 'exp-1',
          company: 'Acme',
          title: 'Platform Engineer',
          bullets: [{ id: 'bullet-1', text: 'Improved deploy reliability by 25%.' }],
        },
      ],
      projects: [],
      education: [],
      certifications: [],
      achievements: [],
      customSections: [],
      sectionOrder: [],
    })
  })

  it('serializes create requests with title and backend-compatible resume only', () => {
    const request = serializeCreateResumeRequest('Senior Software Engineer', {
      ...sampleModel(),
      basics: {
        fullName: 'Ajit Shukla',
        headline: '',
        email: 'official.aj.shukla@gmail.com',
        phone: '',
        location: {
          city: 'Navi Mumbai',
          state: 'Maharashtra',
          country: 'India',
        },
        links: [],
      },
    })

    expect(request).toEqual({
      title: 'Senior Software Engineer',
      resume: {
        schemaVersion: 'resume.v1',
        basics: {
          fullName: 'Ajit Shukla',
          headline: '',
          email: 'official.aj.shukla@gmail.com',
          phone: '',
          location: {
            city: 'Navi Mumbai',
            state: 'Maharashtra',
            country: 'India',
          },
          links: [],
        },
        target: {
          roleTitle: '',
          seniority: '',
          persona: '',
          industry: '',
        },
        summary: {
          text: 'Platform engineer with Kubernetes and developer experience.',
        },
        skills: ['Kubernetes', 'Go'],
        experience: [
          {
            id: 'exp-1',
            company: 'Acme',
            title: 'Platform Engineer',
            bullets: [{ id: 'bullet-1', text: 'Improved deploy reliability by 25%.' }],
          },
        ],
        projects: [],
        education: [],
        certifications: [],
        achievements: [],
        customSections: [],
        sectionOrder: [],
      },
    })
  })

  it('serializes update requests with title and without currentVersionId', () => {
    const request = serializeSaveResumeRequest({
      ...sampleResume(),
      title: 'Senior Software Engineer',
      currentVersionId: 'version-123',
      resume: {
        ...sampleModel(),
        basics: {
          fullName: 'Ajit Shukla',
          headline: '',
          email: 'official.aj.shukla@gmail.com',
          phone: '',
          location: {
            city: 'Navi Mumbai',
            state: 'Maharashtra',
            country: 'India',
          },
          links: [],
        },
      },
    })

    expect(request).toEqual({
      title: 'Senior Software Engineer',
      resume: {
        schemaVersion: 'resume.v1',
        basics: {
          fullName: 'Ajit Shukla',
          headline: '',
          email: 'official.aj.shukla@gmail.com',
          phone: '',
          location: {
            city: 'Navi Mumbai',
            state: 'Maharashtra',
            country: 'India',
          },
          links: [],
        },
        target: {
          roleTitle: '',
          seniority: '',
          persona: '',
          industry: '',
        },
        summary: {
          text: 'Platform engineer with Kubernetes and developer experience.',
        },
        skills: ['Kubernetes', 'Go'],
        experience: [
          {
            id: 'exp-1',
            company: 'Acme',
            title: 'Platform Engineer',
            bullets: [{ id: 'bullet-1', text: 'Improved deploy reliability by 25%.' }],
          },
        ],
        projects: [],
        education: [],
        certifications: [],
        achievements: [],
        customSections: [],
        sectionOrder: [],
      },
    })
    expect(request).not.toHaveProperty('currentVersionId')
  })

  it('separates structural validation errors from readiness warnings', () => {
    const resume = sampleModel()
    const validation = validateResumeModel({
      ...resume,
      experience: [
        {
          ...resume.experience[0],
          startDate: '2026',
          bullets: [
            { id: 'duplicate', text: '' },
            { id: 'duplicate', text: 'Second bullet' },
          ],
        },
      ],
    })

    expect(validation.structuralErrors).toContain('Experience 1 start date must use YYYY-MM format.')
    expect(validation.structuralErrors).toContain('Experience 1 bullets contains duplicate id "duplicate".')
  })

  it('does not reference retired synchronous response aliases in resume workspace source', () => {
    const files = [
      'src/api/resumes.ts',
      'src/pages/resumes/ResumeWorkspacePage.tsx',
      'src/pages/resumes/NewResumePage.tsx',
      'src/pages/resumes/TailorResumePage.tsx',
    ]
    const combined = files.map((file) => readFileSync(join(process.cwd(), file), 'utf8')).join('\n')

    expect(combined).not.toMatch(/\bversionId\b/)
    expect(combined).not.toContain('tailoredResume')
    expect(combined).not.toContain('resumeModel')
    expect(combined).not.toContain('record.model')
    expect(combined).not.toContain('record.data')
  })

  it('removes retired start-from-job-description copy from the workspace sources', () => {
    const files = [
      'src/pages/resumes/NewResumePage.tsx',
      'src/pages/resumes/ResumeListPage.tsx',
      'src/pages/resumes/TailorResumePage.tsx',
    ]
    const combined = files.map((file) => readFileSync(join(process.cwd(), file), 'utf8')).join('\n')

    expect(combined).not.toContain('Start from job description')
    expect(combined).not.toContain('Generate resume from job description')
  })

  it('keeps public SEO pages on real routes without placeholder links', () => {
    const files = [
      'src/pages/AiResumeBuilderPage.tsx',
      'src/pages/AtsResumeCheckerPage.tsx',
      'src/pages/marketing/HomePage.tsx',
    ]
    const combined = files.map((file) => readFileSync(join(process.cwd(), file), 'utf8')).join('\n')

    expect(combined).not.toContain('/resume-score-checker')
    expect(combined).not.toContain('/java-developer-resume-guide')
    expect(combined).not.toContain('/backend-engineer-resume-template')
    expect(combined).not.toContain('/resume-keyword-scanner')
    expect(combined).not.toContain('/ai-linkedin-summary-generator')
    expect(combined).not.toContain('Use `/app/analyzer`')
  })

  it('updates pricing and public pages to the 3 guest / 15 account quota copy', () => {
    const pricingHtml = renderToStaticMarkup(withRouter(<PricingPage />))
    const publicFiles = [
      'src/pages/marketing/HomePage.tsx',
      'src/pages/AiResumeBuilderPage.tsx',
      'src/pages/AtsResumeCheckerPage.tsx',
      'src/pages/ResultsPage.tsx',
    ]
    const combined = publicFiles.map((file) => readFileSync(join(process.cwd(), file), 'utf8')).join('\n')

    expect(pricingHtml).toContain('Free account - 15 analyses/month')
    expect(pricingHtml).toContain('Guests can try 3 analyses/month without signing in.')
    expect(pricingHtml).not.toContain('10 analyses')
    expect(combined).toContain('Try 3 analyses as a guest, or sign in for 15 free analyses/month.')
    expect(combined).toContain('Save this analysis and get 15 free analyses/month by signing in.')
    expect(combined).toContain('!loggedIn ? <GuestResultsCta')
    expect(combined).not.toContain('10 free analyses')
    expect(combined).not.toContain('10 analyses per month')
  })

  it('protects the resume workspace routes in the router', () => {
    const routerSource = readFileSync(join(process.cwd(), 'src/app/router.tsx'), 'utf8')

    expect(routerSource).toContain('element: <RequireLogin />')
    expect(routerSource).toContain("path: 'resumes'")
    expect(routerSource).toContain("path: 'resumes/new'")
    expect(routerSource).toContain("path: 'resumes/:id'")
    expect(routerSource).toContain("path: 'resumes/:id/tailor'")
  })
})
