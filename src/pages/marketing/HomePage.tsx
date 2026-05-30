import { Link } from 'react-router-dom'
import {
  SeoCardGrid,
  SeoLandingPage,
  SeoSection,
  SeoTextBlock,
} from '../../components/seo'

const title = 'Rethink Resume | AI Resume Analyzer & ATS Checker for Engineers'
const description =
  'Rethink Resume helps engineers and technical professionals analyze resumes, check ATS readiness, match job descriptions, and improve applications with AI.'
const canonicalUrl = 'https://rethinkresume.com/'

const homepageStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Rethink Resume',
  url: canonicalUrl,
  description,
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://rethinkresume.com/ats-resume-checker?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

const featureCards = [
  {
    title: 'ATS Analysis',
    body: 'Check whether your resume uses a structure and language that applicant tracking systems can parse reliably. Find formatting risks, missing sections, and signals that may be harder for recruiters to search.',
  },
  {
    title: 'AI Resume Builder',
    body: 'Use AI guidance to organize your experience into a stronger resume draft. Build around truthful accomplishments, clear technical scope, and role-specific language instead of generic templates.',
  },
  {
    title: 'Resume Match Analysis',
    body: 'Compare your resume against a real job description to understand where your experience aligns, where evidence is weak, and which qualifications should be easier to find.',
  },
  {
    title: 'Skill Gap Detection',
    body: 'Identify missing or under-supported skills from the posting, including tools, frameworks, architecture patterns, cloud platforms, and seniority signals that matter for technical roles.',
  },
  {
    title: 'Resume Suggestions',
    body: 'Get practical suggestions for improving bullets, clarifying ownership, adding measurable outcomes, and connecting technical work to the job you want next.',
  },
]

const futureLinks = [
  { label: 'Java Developer Resume Guide', to: '/java-developer-resume-guide' },
  { label: 'Backend Engineer Resume Template', to: '/backend-engineer-resume-template' },
  { label: 'Resume Keyword Scanner', to: '/resume-keyword-scanner' },
  { label: 'AI LinkedIn Summary Generator', to: '/ai-linkedin-summary-generator' },
]

const HomePage = () => (
  <SeoLandingPage
    metadata={{
      title,
      description,
      canonicalUrl,
      structuredData: homepageStructuredData,
      twitterCard: 'summary_large_image',
    }}
    className="max-w-6xl"
  >
    <section className="grid gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
      <div className="space-y-6">
        <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
          AI Resume Intelligence
        </div>
        <div className="space-y-4">
          <h1 className="max-w-4xl text-4xl font-bold tracking-normal text-gray-950 sm:text-5xl">
            AI Resume Analyzer & ATS Checker for Engineers
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-gray-700">
            Rethink Resume helps technical professionals improve resumes before applying. Analyze
            ATS readiness, compare your resume with job descriptions, find missing skills, and use
            AI guidance to make your experience clearer, stronger, and easier to evaluate.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/ai-resume-builder"
            className="inline-flex items-center justify-center rounded-md bg-blue-700 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
          >
            Build Resume with AI
          </Link>
          <Link
            to="/app/analyzer"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
          >
            Analyze Existing Resume
          </Link>
        </div>
      </div>

      <aside className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-950">A practical resume workflow</h2>
        <ol className="mt-5 space-y-4 text-base leading-7 text-gray-700">
          <li>
            <strong className="text-gray-950">1. Start with your current resume.</strong> Use the
            document you plan to submit, not a polished sample that will not be uploaded.
          </li>
          <li>
            <strong className="text-gray-950">2. Add the target job description.</strong> Resume
            quality depends on the role, tech stack, and level you are applying for.
          </li>
          <li>
            <strong className="text-gray-950">3. Improve the strongest signals.</strong> Focus on
            ATS structure, match quality, skill gaps, and accomplishment bullets.
          </li>
        </ol>
      </aside>
    </section>

    <section className="border-y border-gray-200 py-10">
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-950">Public website</h2>
          <p className="mt-2 text-base leading-7 text-gray-700">
            Learn what the product does, read SEO guides, compare tools, and understand resume
            strategy before entering the app.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-950">Resume app</h2>
          <p className="mt-2 text-base leading-7 text-gray-700">
            Use `/app/analyzer` for upload, job matching, analysis history, and future authenticated
            workflows.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-950">Early access</h2>
          <p className="mt-2 text-base leading-7 text-gray-700">
            Start with up to 10 analyses per month while the platform is actively improving. No
            credit card required during early access.
          </p>
        </div>
      </div>
    </section>

    <SeoSection title="Resume tools for technical applications">
      <SeoCardGrid items={featureCards.map((feature) => ({ title: feature.title, body: feature.body }))} />
    </SeoSection>

    <SeoSection title="Built for engineers, not generic resume rewrites">
      <SeoTextBlock>
        <p>
          Engineering resumes need to communicate more than employment history. A strong technical
          resume shows systems owned, technologies used, tradeoffs made, production impact, and the
          level of responsibility behind the work. Rethink Resume is built around that reality. It
          helps turn vague statements into clearer evidence without pushing candidates toward
          inflated or generic language.
        </p>
        <p>
          The product combines ATS-aware structure with job-specific analysis. That means it looks
          at the resume and job description together. A frontend engineer applying to a React
          performance role needs different emphasis than a backend engineer applying to a platform
          team. A staff-level candidate needs to show scope, decision-making, mentoring, and
          cross-team influence. A new graduate may need to make projects and internships easier to
          evaluate.
        </p>
        <p>
          Public pages such as the{' '}
          <Link className="text-blue-700 underline underline-offset-2" to="/ats-resume-checker">
            ATS Resume Checker
          </Link>{' '}
          and{' '}
          <Link className="text-blue-700 underline underline-offset-2" to="/ai-resume-builder">
            AI Resume Builder
          </Link>{' '}
          explain how the workflow works. The application under `/app/*` is where users upload a
          resume, paste a job description, and generate the analysis report.
        </p>
      </SeoTextBlock>
    </SeoSection>

    <section className="grid gap-6 py-12 lg:grid-cols-3">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-gray-950">ATS-safe resumes</h2>
        <p className="mt-3 text-base leading-7 text-gray-700">
          ATS-safe does not mean plain for the sake of being plain. It means the resume uses clear
          headings, searchable text, logical ordering, and role-relevant keywords so important
          details are easy for both software and recruiters to find.
        </p>
      </section>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-gray-950">Structured analysis</h2>
        <p className="mt-3 text-base leading-7 text-gray-700">
          A useful resume report should separate match quality, skill gaps, ATS formatting, and
          suggested improvements. Structure helps users decide what to fix first instead of reading
          vague advice.
        </p>
      </section>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-gray-950">Practical feedback</h2>
        <p className="mt-3 text-base leading-7 text-gray-700">
          Engineers need feedback that respects technical context: APIs, infrastructure, testing,
          reliability, product impact, collaboration, and measurable improvements.
        </p>
      </section>
    </section>

    <section className="rounded-lg bg-gray-950 p-6 text-white sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="text-3xl font-bold">Improve your resume before the next application</h2>
          <p className="mt-3 max-w-3xl text-base leading-8 text-gray-200">
            Build a stronger resume with AI or analyze your existing resume against the job you want.
            Keep the workflow practical, role-specific, and focused on evidence.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            to="/ai-resume-builder"
            className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-base font-semibold text-gray-950 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            Build Resume with AI
          </Link>
          <Link
            to="/app/analyzer"
            className="inline-flex items-center justify-center rounded-md border border-gray-500 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            Analyze Existing Resume
          </Link>
        </div>
      </div>
    </section>

    <SeoSection title="Explore resume intelligence resources">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {futureLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-lg border border-gray-200 bg-white p-5 hover:border-blue-300 hover:bg-blue-50"
          >
            <h3 className="text-lg font-semibold text-gray-950">{link.label}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              Future guide placeholder for expanded resume education and SEO content.
            </p>
          </Link>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-base">
        <Link className="text-blue-700 underline underline-offset-2" to="/ats-resume-checker">
          ATS Resume Checker
        </Link>
        <Link className="text-blue-700 underline underline-offset-2" to="/ai-resume-builder">
          AI Resume Builder
        </Link>
        <Link className="text-blue-700 underline underline-offset-2" to="/pricing">
          Early Access
        </Link>
      </div>
    </SeoSection>
  </SeoLandingPage>
)

export default HomePage
