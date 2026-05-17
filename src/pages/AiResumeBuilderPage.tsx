import {
  SeoCardGrid,
  SeoPageTemplate,
  SeoSection,
  SeoSplitSection,
  SeoTextBlock,
} from '../components/seo'

const canonicalUrl = 'https://rethinkresume.com/ai-resume-builder'
const title = 'AI Resume Builder for Software Engineers | Rethink Resume'
const description =
  'Build ATS-safe, job-tailored resumes with AI guidance for software engineers, technical roles, and serious job seekers.'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: canonicalUrl,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Rethink Resume',
    url: 'https://rethinkresume.com',
  },
  about: [
    {
      '@type': 'Thing',
      name: 'AI Resume Builder',
    },
    {
      '@type': 'Thing',
      name: 'ATS-friendly resume',
    },
    {
      '@type': 'Thing',
      name: 'Resume optimization for software engineers',
    },
  ],
}

const features = [
  {
    title: 'Job-specific resume structure',
    body: 'Use the job description as context so the resume emphasizes the experience, tools, scope, and outcomes that matter for that role.',
  },
  {
    title: 'ATS-safe formatting guidance',
    body: 'Keep the resume readable with clear headings, simple section order, searchable text, and fewer layout choices that can confuse parsing systems.',
  },
  {
    title: 'Engineer-focused bullet improvements',
    body: 'Turn vague task descriptions into stronger bullets that show ownership, technical depth, production impact, and measurable results.',
  },
  {
    title: 'Keyword alignment without stuffing',
    body: 'Identify relevant keywords from the posting and use them naturally in skills, projects, and experience sections where they are supported by real work.',
  },
]

const faqs = [
  {
    question: 'Can AI write my entire resume?',
    answer:
      'AI can draft structure, rewrite bullets, and suggest role-specific language, but the strongest resume still depends on accurate source material from you. Treat AI output as a structured draft that you review for truth, specificity, and tone.',
  },
  {
    question: 'Is an AI-generated resume ATS-friendly?',
    answer:
      'It can be when the resume uses standard headings, simple formatting, searchable text, and role-relevant keywords. The generation process should prioritize clarity and parsing quality instead of decorative templates.',
  },
  {
    question: 'How should software engineers tailor resumes?',
    answer:
      'Software engineers should align projects, technologies, architecture decisions, performance work, reliability improvements, and collaboration examples with the job description. The resume should show both the tools used and the impact delivered.',
  },
  {
    question: 'Should I create a different resume for every application?',
    answer:
      'You do not need to rewrite everything, but competitive applications benefit from tailoring. Adjust the summary, skills order, and strongest bullets so the most relevant evidence appears early.',
  },
]

const AiResumeBuilderPage = () => (
  <SeoPageTemplate
    metadata={{ title, description, canonicalUrl, structuredData }}
    hero={{
      eyebrow: 'AI Resume Builder',
      title: 'Build a tailored, ATS-safe resume with AI',
      description:
        'Rethink Resume helps software engineers and technical job seekers create clearer, stronger resumes by using AI to organize experience, align language with job descriptions, and improve the evidence behind each bullet. The goal is not a generic template. The goal is a structured resume that shows the right skills for the right role.',
      actions: [
        { label: 'Upload Resume', to: '/app/analyzer' },
        { label: 'Generate Resume', to: '/app/analyzer', variant: 'secondary' },
      ],
      aside: (
        <aside className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">Built for practical resume work</h2>
          <p className="mt-3 text-base leading-7 text-gray-700">
            A useful AI resume builder should help you make better decisions: what to keep, what to
            remove, which achievements to highlight, and how to describe technical work in language
            recruiters and hiring managers can understand.
          </p>
          <ul className="mt-5 space-y-3 text-base leading-7 text-gray-700">
            <li>Role-specific summaries and skill emphasis.</li>
            <li>Cleaner bullets with stronger technical context.</li>
            <li>ATS-safe structure for online applications.</li>
            <li>Internal checks against keyword gaps and weak evidence.</li>
          </ul>
        </aside>
      ),
    }}
    cta={{
      title: 'Create a stronger resume draft before you apply',
      description:
        'Use AI to organize your experience, tailor your language to the job description, and prepare a resume that is easier for ATS tools and hiring teams to read.',
      actions: [
        { label: 'Upload Resume', to: '/app/analyzer' },
        { label: 'Generate Resume', to: '/app/analyzer', variant: 'outlineDark' },
      ],
    }}
    relatedLinks={[
      {
        title: 'ATS Resume Checker',
        to: '/ats-resume-checker',
        body: 'Check keyword gaps, formatting risks, and job match quality before submitting an application.',
      },
      {
        title: 'Resume Score Checker',
        to: '/resume-score-checker',
        body: 'Future page placeholder for scoring resume clarity, relevance, structure, and impact.',
      },
    ]}
    faq={{
      title: 'AI Resume Builder FAQ',
      description:
        'Practical answers for job seekers who want to use AI responsibly while keeping their resume accurate, readable, and relevant.',
      items: faqs,
    }}
  >
    <SeoSection title="What are AI-generated resumes?">
      <SeoTextBlock>
        <p>
          AI-generated resumes are resumes drafted or improved with the help of a language model.
          The AI can turn raw notes into bullet points, rewrite unclear experience, suggest a
          cleaner structure, and adapt a resume to a job description. For a software engineer, that
          might mean turning "worked on backend APIs" into a clearer explanation of service
          ownership, API design, latency improvements, deployment work, and production support.
        </p>
        <p>
          The best AI resume output is grounded in truthful input. A strong resume should not invent
          experience, inflate seniority, or add technologies you cannot discuss in an interview.
          Instead, AI should help uncover the value already present in your work and make it easier
          for recruiters, hiring managers, and applicant tracking systems to find.
        </p>
        <p>
          This matters because many qualified candidates undersell themselves. They list tools but
          omit outcomes. They describe responsibilities but not ownership. They include impressive
          projects but fail to connect those projects to the job they want next.
        </p>
      </SeoTextBlock>
    </SeoSection>

    <SeoSection title="How it works" id="how-it-works">
      <SeoCardGrid
        columns={3}
        items={[
          {
            title: '1. Start with your current resume',
            body: 'Upload your existing resume or use your current experience as source material. The builder works best when it has real projects, responsibilities, metrics, and tools to organize.',
          },
          {
            title: '2. Add the job description',
            body: 'The job description gives the AI context. It shows which skills, technologies, responsibilities, and business problems should be emphasized in the resume draft.',
          },
          {
            title: '3. Review and refine',
            body: 'Use the generated structure as a strong draft. Keep what is accurate, improve what needs more detail, and remove anything that does not reflect your actual experience.',
          },
        ]}
      />
    </SeoSection>

    <SeoSection title="Features for better resume generation">
      <SeoCardGrid items={features.map((feature) => ({ title: feature.title, body: feature.body }))} />
    </SeoSection>

    <SeoSection title="Why ATS matters" className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
      <SeoTextBlock>
        <p className="text-gray-800">
          Applicant tracking systems help employers collect and search resumes. They are part of the
          workflow for many online applications, especially at companies receiving large volumes of
          candidates. An ATS may parse your resume into fields, make your experience searchable, and
          help recruiters filter by job title, technology, location, or keywords.
        </p>
        <p className="text-gray-800">
          An ATS-safe resume is not a resume that tricks software. It is a resume that is easy for
          software and people to understand. Standard headings, simple formatting, clear dates,
          readable links, and direct language reduce the chance that important information is
          missed.
        </p>
        <p className="text-gray-800">
          A visual template may look impressive, but if it uses columns, icons, text boxes, or
          unusual section labels, it can make parsing less reliable. A structured resume puts the
          substance first: what you built, what you improved, what scale you handled, and how your
          work connects to the target role.
        </p>
      </SeoTextBlock>
    </SeoSection>

    <SeoSection title="Resume tailoring for software engineers">
      <SeoTextBlock>
        <p>
          Software engineering resumes need more than a list of programming languages. Hiring teams
          want evidence of scope, judgment, collaboration, and impact. A backend engineer might
          highlight API design, data modeling, reliability, observability, and cloud infrastructure.
          A frontend engineer might emphasize React architecture, accessibility, performance, design
          systems, testing, and product collaboration.
        </p>
        <p>
          Tailoring starts by reading the job description for repeated themes. If the role focuses
          on platform engineering, the resume should surface automation, deployment pipelines,
          infrastructure as code, developer experience, and operational reliability. If the role is
          product engineering, the resume should show customer-facing features and product judgment.
        </p>
        <p>
          AI can help map your existing experience to those themes. It can suggest which bullets
          should move higher, where a missing keyword is supported by real work, and where a bullet
          needs more detail. The result should feel specific, not generic.
        </p>
      </SeoTextBlock>
    </SeoSection>

    <SeoSplitSection
      title="Benefits of structured resumes"
      intro="Structure improves both readability and searchability. A structured resume makes it obvious where each piece of information belongs and helps reviewers compare your background against the role quickly."
    >
      <SeoCardGrid
        items={[
          {
            title: 'Clearer first impression',
            body: 'Recruiters can quickly identify your current level, strongest skills, relevant domains, and recent impact.',
          },
          {
            title: 'Better keyword context',
            body: 'Keywords are easier to trust when they appear in real experience bullets rather than only in a detached skills list.',
          },
          {
            title: 'More useful editing workflow',
            body: 'When sections are organized, AI suggestions become easier to review, accept, reject, and refine.',
          },
        ]}
      />
    </SeoSplitSection>
  </SeoPageTemplate>
)

export default AiResumeBuilderPage
