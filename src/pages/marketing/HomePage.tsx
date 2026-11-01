import { Link } from 'react-router-dom'
import NewJobLink from '../../components/NewJobLink'
import { SeoLandingPage } from '../../components/seo'
import { ui } from '../../app/uiTokens'

const description =
  'Improve your existing resume for one target job. Review evidence-based edits, clarify omitted experience, and return to your saved application with Rethink Resume.'
const steps = [
  ['Choose a resume and a job', 'Reuse a saved upload or add your current resume, then paste the job description.'],
  [
    'Review what you can improve',
    'Compare ready edits with your original. Optionally answer a focused question about experience the resume does not establish.',
  ],
  [
    'Use your choices and return later',
    'Download the selected edits where available. Sign in to find saved reviews by company and role.',
  ],
]
export default function HomePage() {
  return (
    <SeoLandingPage
      metadata={{
        title: 'Rethink Resume | Improve your resume for the job you want',
        description,
        canonicalUrl: 'https://rethinkresume.com/',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Rethink Resume',
          url: 'https://rethinkresume.com/',
          description,
        },
      }}
      className="max-w-6xl"
    >
      <section className="grid gap-10 py-8 lg:grid-cols-2 lg:items-center lg:py-14">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-800">
            Your experience. One target job.
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Don’t make recruiters guess how your experience fits.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-slate-600">
            Start with the resume you have. Understand the fit, review truthful edits and clarify relevant experience
            you may have left out.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <NewJobLink className={ui.button.primary}>Improve my resume for a job</NewJobLink>
            <Link className={ui.button.secondary} to="/app/home">
              Open my workspace
            </Link>
          </div>
          <p className="text-sm text-slate-600">
            Try 3 analyses as a guest, or sign in for 15 analyses/month.{' '}
            <Link className={ui.results.link} to="/pricing">
              See current access and pricing
            </Link>
            .
          </p>
        </div>
        <aside
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          aria-label="Fictional review example"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Illustrative example · not a generated result
          </p>
          <h2 className="text-xl font-semibold text-slate-950">Make the evidence easier to see</h2>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500">Original</p>
            <p>Worked on backend services.</p>
          </div>
          <div className="space-y-2 border-l-2 border-teal-700 pl-4">
            <p className="text-sm font-semibold text-teal-900">A supported edit</p>
            <p>Built Java APIs for the order service.</p>
            <p className="text-sm text-slate-600">
              Source evidence in this example: “Developed order-service APIs in Java.”
            </p>
          </div>
          <div className="space-y-2 rounded-lg bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Optional question</p>
            <p>What part of the work did you personally own?</p>
            <p className="text-sm text-slate-600">
              An answer may add an edit, need more detail or leave the resume unchanged.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Keep any original you prefer. Wording does not create missing qualifications.
          </p>
        </aside>
      </section>
      <section className="border-y border-slate-200 py-10">
        <h2 className="text-2xl font-semibold text-slate-950">One connected application review</h2>
        <ol className="mt-6 grid gap-8 md:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title}>
              <p className="text-sm font-semibold text-teal-800">0{i + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="grid gap-8 py-12 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">For the work engineers actually do</h2>
          <p className="mt-4 leading-7 text-slate-600">
            Surface technical scope, implementation, ownership and impact using facts you can support. Job requirements
            show where the submitted resume provides evidence and where something remains unclear.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Know what changed</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-600">
            <li>Compare proposed passages with their originals.</li>
            <li>See which additions came from your confirmed answers.</li>
            <li>Keep submitted-resume scores separate from proposed edits.</li>
            <li>Reuse saved uploads without replacing the sources of earlier reviews.</li>
          </ul>
        </div>
      </section>
      <section className="rounded-2xl bg-teal-950 p-6 text-white sm:p-8">
        <h2 className="text-2xl font-semibold">Bring your next job description</h2>
        <p className="mt-3 max-w-2xl leading-7 text-teal-50">
          Start with the experience you already have. Choose the improvements that represent it accurately.
        </p>
        <NewJobLink className="mt-6 inline-flex rounded-lg bg-white px-5 py-3 font-semibold text-teal-950 focus-visible:outline-2 focus-visible:outline-offset-2">
          Improve my resume for a job
        </NewJobLink>
      </section>
      <section className="py-12">
        <h2 className="text-2xl font-semibold">A few things to know</h2>
        <div className="mt-6 space-y-5">
          <details>
            <summary className="font-semibold">Can this fill a qualification gap?</summary>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              It can uncover omitted experience and make existing evidence clearer. It cannot create skills, employment,
              ownership or results you have not confirmed. “Not established” means the resume lacks evidence, not that
              you lack experience.
            </p>
          </details>
          <details>
            <summary className="font-semibold">Will my score change after the edits?</summary>
            <p className="mt-3 text-slate-600">
              The scores describe your submitted resume. Edits and answer updates are not automatically rescored.
            </p>
          </details>
          <details>
            <summary className="font-semibold">What does the Word download preserve?</summary>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              Where available, the download applies selected edits to extracted resume text and keeps unedited content.
              It rebuilds paragraphs and lists; it does not preserve the original PDF design. Check the document before
              sending it.
            </p>
          </details>
        </div>
      </section>
      <nav className="flex flex-wrap gap-5 border-t border-slate-200 py-6" aria-label="Resume resources">
        <Link className={ui.results.link} to="/ats-resume-checker">
          Resume readability
        </Link>
        <Link className={ui.results.link} to="/ai-resume-builder">
          Editable draft tools
        </Link>
        <Link className={ui.results.link} to="/privacy">
          How we handle your information
        </Link>
      </nav>
    </SeoLandingPage>
  )
}
