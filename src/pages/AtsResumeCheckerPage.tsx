import { Link } from 'react-router-dom'
import { SeoPageTemplate, SeoSection, SeoSteps, SeoTextBlock } from '../components/seo'
import { ui } from '../app/uiTokens'

export default function AtsResumeCheckerPage() {
  return (
    <SeoPageTemplate
      metadata={{
        title: 'ATS Resume Readability Checker | Rethink Resume',
        description:
          'Review resume structure, formatting and common parsing risks. Check readability without a job description or start a separate job-specific review.',
        canonicalUrl: 'https://rethinkresume.com/ats-resume-checker',
      }}
      hero={{
        eyebrow: 'Resume readability',
        title: 'Check how clearly your resume can be read',
        description:
          'Check structure, formatting and common parsing risks without a job description. For role-specific evidence and supported edits, choose a job review instead. Scores are estimates, not a guarantee of passing an employer’s ATS.',
        actions: [
          { label: 'Check resume readability', to: '/app/analyzer?mode=ats' },
          { label: 'Review a target job instead', to: '/app/analyzer?mode=job-match', variant: 'secondary' },
        ],
        aside: (
          <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">What this check is for</h2>
            <ul className="list-disc space-y-3 pl-5 text-slate-600">
              <li>Readable headings and section structure.</li>
              <li>Searchable text and common extraction risks.</li>
              <li>Formatting issues to inspect before sending.</li>
            </ul>
            <p className="text-sm text-slate-600">
              This is separate from matching your experience to a particular job.
            </p>
          </aside>
        ),
      }}
      cta={{
        title: 'Check the resume you plan to send',
        description:
          'Reuse a saved upload or add a PDF or Word file. You can start a job-specific review separately when you have a target posting.',
        actions: [{ label: 'Check resume readability', to: '/app/analyzer?mode=ats' }],
      }}
      faq={{
        title: 'Resume readability questions',
        items: [
          {
            question: 'Do I need a job description?',
            answer:
              'No. The readability check works without one. A job-specific review needs a posting to compare requirements and evidence.',
          },
          {
            question: 'Does a high score guarantee ATS acceptance?',
            answer:
              'No. Employers use different systems, searches and screening rules. A readability estimate cannot guarantee an interview or application outcome.',
          },
          {
            question: 'Which file should I use?',
            answer:
              'Use the file you intend to send and follow the employer’s requested format. Check that copied text reads in a logical order.',
          },
        ],
      }}
    >
      <SeoSteps
        items={[
          { title: 'Choose your resume', body: 'Reuse a saved upload or add the current file you plan to send.' },
          {
            title: 'Check without a target job',
            body: 'Review structure and readability without inventing a job-match score.',
          },
          {
            title: 'Inspect the findings',
            body: 'Check formatting concerns in the actual document. Scores describe the submitted source, not a revised version.',
          },
        ]}
      />
      <SeoSection title="What is an applicant tracking system?">
        <SeoTextBlock>
          <p>
            An applicant tracking system helps employers collect, organize and search applications. It may extract text
            and identify sections such as experience, education and skills. Systems and employer workflows vary; there
            is no universal pass score.
          </p>
          <p>
            Use clear headings, readable links, consistent dates and text that can be selected and copied. Complex
            columns, decorative charts and text embedded in images can make extraction harder. Inspect the actual file
            as well as the extracted text.
          </p>
        </SeoTextBlock>
      </SeoSection>
      <SeoSection title="Readability and job fit answer different questions">
        <SeoTextBlock>
          <p>
            A readable resume can still be missing evidence for a particular role. A job review compares your submitted
            experience with the posting, proposes supported edits and lets you clarify omitted experience. “Not
            established” describes missing evidence in the resume; it does not prove you lack that experience.
          </p>
          <p>
            Add job-related terms only when your experience supports them. Wording alone cannot supply qualifications,
            duration or results.
          </p>
        </SeoTextBlock>
        <div className="mt-4 flex flex-wrap gap-5">
          <Link className={ui.results.link} to="/pricing">
            Current access and pricing
          </Link>
          <Link className={ui.results.link} to="/ai-resume-builder">
            Optional editable drafts
          </Link>
        </div>
      </SeoSection>
    </SeoPageTemplate>
  )
}
