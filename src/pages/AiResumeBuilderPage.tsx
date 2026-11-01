import { Link } from 'react-router-dom'
import { SeoPageTemplate, SeoSection, SeoSteps, SeoTextBlock } from '../components/seo'
import { ui } from '../app/uiTokens'

export default function AiResumeBuilderPage() {
  return (
    <SeoPageTemplate
      metadata={{
        title: 'AI Resume Builder and Editable Draft Tools | Rethink Resume',
        description:
          'Organize real experience into a structured, editable resume draft. Optional drafting tools sit alongside the job-specific application review.',
        canonicalUrl: 'https://rethinkresume.com/ai-resume-builder',
      }}
      hero={{
        eyebrow: 'Optional drafting tools',
        title: 'Organize your real experience into an editable draft',
        description:
          'Start from your own notes or maintain a structured draft. These tools are separate from saved uploaded resumes and job-specific reviews. Sign in to create, edit and download a draft.',
        actions: [
          { label: 'Create an editable draft · sign-in required', to: '/app/resumes/new' },
          { label: 'Improve an existing resume for a job', to: '/app/analyzer?mode=job-match', variant: 'secondary' },
        ],
        aside: (
          <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">Already have a resume?</h2>
            <p className="leading-7 text-slate-600">
              A job review starts with your uploaded file. Compare ready edits, clarify relevant experience and keep the
              changes you choose. You do not have to rebuild the resume first.
            </p>
            <p className="text-sm text-slate-600">
              Draft creation is an alternative for people who want to organize their material manually or from factual
              notes.
            </p>
          </aside>
        ),
      }}
      cta={{
        title: 'Choose the starting point you need',
        description:
          'Use the resume you already have for a target-job review, or sign in to maintain an optional editable draft.',
        actions: [
          { label: 'Improve an existing resume for a job', to: '/app/analyzer?mode=job-match' },
          { label: 'Create an editable draft · sign-in required', to: '/app/resumes/new', variant: 'outlineDark' },
        ],
      }}
      faq={{
        title: 'Editable draft questions',
        items: [
          {
            question: 'Will AI invent my experience?',
            answer:
              'Your resume must reflect real experience. Supply your own responsibilities, projects and results, review the output, and remove unsupported wording. A job description describes what an employer wants; it is not evidence that you have done that work.',
          },
          {
            question: 'Is a draft the same as my primary resume?',
            answer:
              'No. Editable drafts and uploaded source files are separate. Choosing a primary source does not replace files attached to earlier reviews.',
          },
          {
            question: 'Can I review a job using an editable draft?',
            answer:
              'Export the draft to Word, check its facts and formatting, then upload that file for a job review. There is no direct draft-to-analysis connection yet.',
          },
        ],
      }}
    >
      <SeoSteps
        items={[
          {
            title: 'Bring your own facts',
            body: 'Use experience notes, projects, skills and education you can confirm. Blank drafts remain available.',
          },
          {
            title: 'Review the structure and wording',
            body: 'Check names, dates, scope and outcomes. A template or placeholder is not completed experience.',
          },
          {
            title: 'Export when ready',
            body: 'Download a draft, inspect it, and upload the checked file separately if you want a job-specific review.',
          },
        ]}
      />
      <SeoSection title="Useful structure starts with real experience">
        <SeoTextBlock>
          <p>
            Clear technical resumes explain what you built, the tools you actually used and your contribution. Include
            results and metrics only when you can substantiate them. Personal projects and learning can be useful when
            they are identified accurately.
          </p>
          <p>
            A structured draft can help organize that material. It cannot create missing qualifications, turn a personal
            project into employment or establish ownership that you have not confirmed.
          </p>
        </SeoTextBlock>
      </SeoSection>
      <SeoSection title="Choose a job review for application-specific improvements">
        <SeoTextBlock>
          <p>
            The guided review compares an existing uploaded resume with one target job. Its initial edits use supplied
            evidence. Optional answers may contribute a new passage, ask for more detail or leave the resume unchanged.
            Earlier keep-original choices remain available, and scores continue to describe the submitted resume.
          </p>
        </SeoTextBlock>
        <div className="mt-4 flex flex-wrap gap-5">
          <Link className={ui.results.link} to="/ats-resume-checker">
            Resume readability checks
          </Link>
          <Link className={ui.results.link} to="/pricing">
            Current access and pricing
          </Link>
        </div>
      </SeoSection>
    </SeoPageTemplate>
  )
}
