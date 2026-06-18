import { Link } from 'react-router-dom'
import {
  SeoActionLink,
  SeoCardGrid,
  SeoPageTemplate,
  SeoSection,
  SeoSplitSection,
  SeoSteps,
  SeoTextBlock,
} from '../components/seo'

const canonicalUrl = 'https://rethinkresume.com/ats-resume-checker'
const title = 'Free ATS Resume Checker | Rethink Resume'
const description =
  'Use the free ATS resume checker from Rethink Resume to find keyword gaps, formatting issues, and job match problems before you apply.'

const commonMistakes = [
  {
    title: 'Using a resume that is too generic',
    body: 'A strong engineering resume is not a static biography. It should reflect the role in front of you. If the posting asks for distributed systems, Kubernetes, observability, and incident response, a resume that only says "backend development" leaves too much for the reader and the ATS to infer.',
  },
  {
    title: 'Hiding important work in dense paragraphs',
    body: 'Recruiters scan quickly and parsing systems extract structured signals. Long paragraphs make it harder to see technologies, scope, business outcomes, and seniority. Clear bullets with role-relevant nouns and measurable impact are easier for both humans and software to evaluate.',
  },
  {
    title: 'Relying on graphics, columns, and unusual layouts',
    body: 'Many ATS tools read resumes from top to bottom. Multi-column layouts, icons, text boxes, tables, headers, footers, and decorative skill bars can cause content to be read in the wrong order or skipped entirely. A clean one-column resume is usually the safer choice.',
  },
  {
    title: 'Listing tools without proving context',
    body: 'Keyword stuffing can create a shallow match, but it does not make the resume persuasive. Hiring teams want to know where the skill was used, what problem it solved, and what changed because of your work. Keywords work best when they sit inside credible accomplishment bullets.',
  },
]

const formattingIssues = [
  'Complex two-column templates that break the reading order.',
  'Important contact information placed only in a header or footer.',
  'Icons used as labels for email, phone, GitHub, or LinkedIn.',
  'Skill ratings, progress bars, and charts that have no searchable text.',
  'Section headings that are creative but unclear, such as "Where I shine" instead of "Experience" or "Skills".',
  'PDF exports that preserve visual design but produce messy selectable text.',
]

const faqs = [
  {
    question: 'Is an ATS resume checker useful for software engineers?',
    answer:
      'Yes. Engineering roles often include specific technologies, architecture patterns, domain experience, and seniority signals. An ATS resume checker helps identify whether those signals are visible in your resume and whether the language aligns with the job description.',
  },
  {
    question: 'Should I add every keyword from the job description?',
    answer:
      'No. Add keywords only when they honestly describe your experience. The goal is not to copy the posting. The goal is to make relevant experience easier to find by using clear, specific language that matches how the employer describes the work.',
  },
  {
    question: 'Can ATS software reject a resume because of formatting?',
    answer:
      'Formatting can affect parsing quality. A resume may not be automatically rejected only because it has columns or graphics, but poor parsing can hide important qualifications. A readable structure reduces that risk and makes the resume easier for recruiters to scan.',
  },
  {
    question: 'What file format should I use for an ATS-friendly resume?',
    answer:
      'PDF is usually acceptable when it contains selectable text and uses a simple structure. Some employers request DOCX. Always follow the application instructions. Before uploading, copy text from the exported file to confirm the content is readable in a logical order.',
  },
  {
    question: 'How is this different from a resume builder?',
    answer:
      'A resume builder helps create or format a resume. Rethink Resume focuses on analysis: it compares your resume with the job description, highlights gaps, and suggests practical improvements before you apply.',
  },
]

const AtsResumeCheckerPage = () => (
  <SeoPageTemplate
    metadata={{ title, description, canonicalUrl }}
    hero={{
      eyebrow: 'Free ATS Resume Checker',
      eyebrowTone: 'emerald',
      title: 'Free ATS Resume Checker for engineers and serious job seekers',
      description:
        'Upload your resume and compare it against a real job description before you apply. Rethink Resume helps you find missing keywords, weak bullets, formatting risks, and job-match gaps that can keep a qualified candidate from getting a closer look. Try 3 analyses as a guest, or sign in for 15 free analyses/month.',
      actions: [
        { label: 'Upload resume for analysis', to: '/app/analyzer' },
        { label: 'See how ATS analysis works', href: '#how-it-works', variant: 'secondary' },
      ],
      aside: (
        <aside className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">What the checker reviews</h2>
          <ul className="mt-5 space-y-4 text-base leading-7 text-gray-700">
            <li>
              <strong className="text-gray-950">Resume to job match:</strong> whether your
              experience reflects the responsibilities and requirements in the posting.
            </li>
            <li>
              <strong className="text-gray-950">Keyword coverage:</strong> missing technologies,
              methods, certifications, and domain terms that matter for the role.
            </li>
            <li>
              <strong className="text-gray-950">ATS readability:</strong> formatting choices that
              may make parsing less reliable.
            </li>
            <li>
              <strong className="text-gray-950">Actionable fixes:</strong> specific suggestions for
              improving bullets without turning the resume into keyword spam.
            </li>
          </ul>
        </aside>
      ),
    }}
    cta={{
      title: 'Run a free ATS resume check before your next application',
      description:
        'Paste the job description, upload your resume, and get a focused report you can act on before submitting. Use it when tailoring a resume for a competitive role, switching domains, or checking whether your engineering impact is visible enough. Try 3 analyses as a guest, or sign in for 15 free analyses/month.',
      actions: [{ label: 'Upload resume', to: '/app/analyzer' }],
    }}
    relatedLinks={[
      {
        title: 'AI Resume Builder',
        to: '/ai-resume-builder',
        body: 'Create a structured resume draft before you run ATS or job-match analysis.',
      },
      {
        title: 'Early Access',
        to: '/pricing',
        body: 'Review the current analysis and resume workspace access details.',
      },
    ]}
    faq={{
      title: 'Free ATS resume checker FAQ',
      description:
        'These answers cover practical ATS questions from engineers, analysts, product managers, and job seekers who want a resume that is readable, relevant, and honest.',
      items: faqs,
    }}
  >
    <SeoSteps
      items={[
        {
          title: 'Upload your resume',
          body: 'Start with the resume you plan to submit. The best check is done on the actual file recruiters will see, not on an old draft.',
        },
        {
          title: 'Paste the job description',
          body: 'ATS quality depends on context. A resume can be strong for one role and poorly matched for another, especially in engineering and technical product roles.',
        },
        {
          title: 'Review prioritized fixes',
          body: 'Use the report to improve keyword alignment, clarify impact, and reduce formatting problems before submitting an application.',
        },
      ]}
    />

    <SeoSection title="What is an ATS?">
      <SeoTextBlock>
        <p>
          An applicant tracking system, usually called an ATS, is software employers use to collect,
          organize, search, and manage job applications. When you apply online, your resume often
          enters an ATS before a recruiter opens it. The system may parse your file, extract contact
          details, identify sections like experience and education, and make your resume searchable
          by skills, job titles, employers, and keywords.
        </p>
        <p>
          The ATS is not a single universal algorithm. Different employers use different systems,
          workflows, scoring rules, recruiter searches, knockout questions, and integrations. That
          means there is no magic template that guarantees a pass. What does help is a resume that
          is easy to parse, directly relevant to the job, and written in language that matches how
          the employer describes the role.
        </p>
        <p>
          For engineers, ATS alignment is especially important because job descriptions often list
          precise tools and responsibilities: React, TypeScript, Go, Python, AWS, Kubernetes,
          Terraform, CI/CD, data pipelines, observability, security reviews, system design, API
          ownership, or production incident response.
        </p>
      </SeoTextBlock>
    </SeoSection>

    <SeoSplitSection
      title="Why resumes fail ATS scans"
      intro="Many resumes fail because they are written for a broad audience instead of a specific job. The resume may be honest and well designed, but still miss the language, evidence, and structure that a recruiting workflow expects."
    >
      <SeoCardGrid items={commonMistakes.map((item) => ({ title: item.title, body: item.body }))} />
    </SeoSplitSection>

    <SeoSection
      title="Common ATS mistakes to fix before applying"
      className="rounded-lg border border-amber-200 bg-amber-50 p-6"
      titleClassName="text-2xl font-bold text-gray-950"
    >
      <p className="text-base leading-8 text-gray-800">
        A good ATS-friendly resume is not plain because plain is boring. It is plain because the
        content should carry the application. Use visual restraint, conventional headings, clear
        dates, consistent job titles, and bullet points that show technical depth.
      </p>
      <ul className="grid gap-3 text-base leading-7 text-gray-800 sm:grid-cols-2">
        {formattingIssues.map((issue) => (
          <li key={issue} className="rounded-md bg-white px-4 py-3">
            {issue}
          </li>
        ))}
      </ul>
    </SeoSection>

    <SeoSection title="Keyword optimization without keyword stuffing">
      <SeoTextBlock>
        <p>
          Keyword optimization means using the employer's language where it accurately matches your
          experience. If a posting asks for "REST APIs" and your resume says "backend services,"
          you may want to include the more specific phrase.
        </p>
        <p>
          The best keywords are embedded in evidence. Instead of adding a skills line that says
          "Kubernetes, Docker, AWS, CI/CD," write a bullet that explains how you used those tools:
          migrating services to containerized deployments, improving release reliability, or
          reducing rollback time.
        </p>
        <p>
          Rethink Resume compares your resume with the job description to identify terms that are
          important, missing, or under-supported. It helps you decide which keywords belong in the
          skills section and which deserve a stronger bullet.
        </p>
      </SeoTextBlock>
    </SeoSection>

    <section className="grid gap-8 py-12 lg:grid-cols-2" id="how-it-works">
      <div className="space-y-5">
        <h2 className="text-3xl font-bold text-gray-950">How AI resume analysis works</h2>
        <p className="text-base leading-8 text-gray-700">
          AI resume analysis reads the resume and job description together. Instead of checking only
          for exact word matches, it looks for related concepts, missing evidence, vague bullets,
          weak prioritization, and differences between what the role asks for and what the resume
          proves.
        </p>
        <p className="text-base leading-8 text-gray-700">
          A traditional keyword scan might notice that a resume includes "AWS." A stronger analysis
          asks whether the resume explains what the candidate did with AWS: deployed services,
          designed infrastructure, optimized costs, handled IAM, managed queues, built event-driven
          systems, or improved reliability.
        </p>
      </div>
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-950">What your report can surface</h3>
        <ul className="mt-5 space-y-3 text-base leading-7 text-gray-700">
          <li>Missing hard skills that appear repeatedly in the job description.</li>
          <li>Important responsibilities that are present but not strongly evidenced.</li>
          <li>Bullets that describe tasks but do not show scope, ownership, or outcomes.</li>
          <li>Formatting risks that can make content harder to parse or scan.</li>
          <li>Next steps ranked by practical impact, so you know what to fix first.</li>
        </ul>
        <SeoActionLink
          action={{ label: 'Check my resume now', to: '/app/analyzer' }}
          className="mt-6 w-full"
        />
      </section>
    </section>

    <SeoSection title="Formatting issues that reduce resume readability">
      <SeoTextBlock>
        <p>
          Resume formatting should make the document easier to understand. If a design choice makes
          the resume look polished but hides important information, it is working against you. The
          safest structure is usually a single-column layout with predictable headings.
        </p>
        <p>
          Use standard text for company names, job titles, dates, and bullet points. Keep links
          readable by writing the destination text, such as GitHub or Portfolio, instead of using
          only an icon. Make sure exported PDFs contain selectable text.
        </p>
        <p>
          Good formatting also helps human reviewers. Recruiters and hiring managers need to find
          the same signals quickly: what role you held, what systems you worked on, what scale you
          handled, which tools you used, and what impact you delivered.
        </p>
      </SeoTextBlock>
      <p className="text-base leading-8 text-gray-700">
        For more structured generation support, see the{' '}
        <Link className="text-blue-700 underline underline-offset-2" to="/ai-resume-builder">
          AI Resume Builder
        </Link>
        .
      </p>
    </SeoSection>
  </SeoPageTemplate>
)

export default AtsResumeCheckerPage
