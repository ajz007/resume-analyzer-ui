import { useNavigate } from 'react-router-dom'

const includedFeatures = [
  '15 resume analyses/month',
  'Saved analysis history',
  'Resume Workspace',
  'Tailored resumes',
  'DOCX downloads',
]

const faqs = [
  {
    question: 'What counts as an analysis?',
    answer:
      'Each run where you upload a resume and compare it with a job description counts as one analysis. You can use the report to review match quality, ATS issues, missing skills, and improvement suggestions.',
  },
  {
    question: 'Do I need a credit card?',
    answer:
      'No. Rethink Resume is currently available during early access with no credit card required.',
  },
  {
    question: 'Do you store my resume?',
    answer:
      'The product is designed to keep resume analysis practical and transparent. Current storage behavior depends on your session and account state, and we will keep improving privacy controls as the platform matures.',
  },
  {
    question: 'Will pricing change later?',
    answer:
      'The product may introduce paid plans later as more features launch. For now, free accounts include 15 analyses per month, and guests can try 3 analyses per month while we continue improving the platform.',
  },
]

const PricingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <section className="space-y-4 text-center">
        <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
          Early access
        </div>
        <h1 className="text-4xl font-bold tracking-normal text-gray-950 sm:text-5xl">
          Resume analysis during early access
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-gray-700">
          Use Rethink Resume to compare your resume against real job descriptions, find ATS issues,
          and improve your application before you submit it.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-950">Free account - 15 analyses/month</h2>
              <p className="mt-2 text-base leading-7 text-gray-700">
                Sign in to get 15 free analyses/month plus saved history, Resume Workspace access,
                tailored resumes, and downloads where available.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
              <div className="text-sm font-semibold uppercase tracking-wide text-blue-800">
                Included usage
              </div>
              <div className="mt-2 text-4xl font-bold text-gray-950">15 analyses</div>
              <div className="mt-1 text-base text-gray-700">per month</div>
              <div className="mt-3 text-sm text-gray-700">
                Guests can try 3 analyses/month without signing in.
              </div>
            </div>

            <div className="grid gap-2 text-sm font-medium text-gray-700 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-md bg-gray-50 px-3 py-2">No credit card required</div>
              <div className="rounded-md bg-gray-50 px-3 py-2">
                Currently available during early access
              </div>
              <div className="rounded-md bg-gray-50 px-3 py-2">
                Built for engineers and focused job seekers
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/app/analyzer')}
              className="inline-flex w-full items-center justify-center rounded-md bg-blue-700 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
            >
              Analyze Your Resume
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-950">What&apos;s included</h2>
          <p className="mt-3 text-base leading-7 text-gray-700">
            Guests can try the analyzer without signing in. A free account expands the quota and
            unlocks saved workflow features across devices.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-lg font-semibold text-gray-950">Guest</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li>3 resume analyses/month</li>
                <li>ATS score</li>
                <li>Job match score</li>
                <li>Basic suggestions</li>
              </ul>
            </section>
            <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="text-lg font-semibold text-gray-950">Free account</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li>15 resume analyses/month</li>
                <li>Saved analysis history</li>
                <li>Resume Workspace</li>
                <li>Tailored resumes</li>
                <li>DOCX downloads, if available</li>
              </ul>
            </section>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {includedFeatures.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
              >
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg bg-gray-950 p-6 text-white sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-3xl font-bold">Try resume analysis before your next application</h2>
          <p className="mt-3 max-w-3xl text-base leading-8 text-gray-200">
            Guests can try 3 analyses/month without signing in. Free accounts get 15 analyses/month
            plus saved history and resume workspace access.
          </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/analyzer')}
            className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-base font-semibold text-gray-950 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            Try Resume Analysis
          </button>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-3xl font-bold text-gray-950">Early access FAQ</h2>
          <p className="mt-3 text-base leading-8 text-gray-700">
            Clear answers about current usage, access, and what to expect while the product is still
            evolving.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <section key={faq.question} className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-gray-950">{faq.question}</h3>
              <p className="mt-2 text-base leading-7 text-gray-700">{faq.answer}</p>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}

export default PricingPage
