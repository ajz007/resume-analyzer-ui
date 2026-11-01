import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NewJobLink from '../components/NewJobLink'
import { fetchPaymentConfig } from '../api/endpoints'
import type { PaymentConfig } from '../api/types'
import { formatPrice } from '../payments/razorpay'
import { ui } from '../app/uiTokens'

export const buildFaqs = (paywallEnabled: boolean | null) => [
  {
    question: 'What counts as an analysis?',
    answer:
      'Starting a new job review or readability check uses one analysis. Reopening a saved review does not start another analysis. A saved resume can be reused for a different target job.',
  },
  {
    question: 'Do I need a credit card?',
    answer:
      paywallEnabled === null
        ? 'Current payment availability could not yet be confirmed. Check the access status above before starting.'
        : paywallEnabled
          ? 'Not for free analyses. You only pay, through Razorpay, if you choose to unlock the full report for an analysis.'
          : 'No. Rethink Resume is currently available during early access with no credit card required.',
  },
  {
    question: 'Do you store my resume?',
    answer:
      'Yes. Saved uploads let you reuse a source file. Signed-in reviews keep company and role labels, confirmed answers and edit choices so you can return later. Editable drafts are separate from uploaded sources. See Privacy or contact us about stored information and removal.',
  },
  {
    question: 'Will pricing change later?',
    answer:
      paywallEnabled === null
        ? 'Current pricing is unavailable. Reload the access information above; an unavailable configuration does not mean paid features are free.'
        : paywallEnabled
          ? 'Free accounts include 15 analyses per month and guests can try 3. Full report unlocks are a one-time payment per report, with no subscription. We will announce any pricing changes before they apply.'
          : 'The product may introduce paid plans later as more features launch. For now, free accounts include 15 analyses per month, and guests can try 3 analyses per month while we continue improving the platform.',
  },
]

export default function PricingPage() {
  const [config, setConfig] = useState<PaymentConfig | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setStatus('loading')
    setConfig(null)
    fetchPaymentConfig()
      .then((value) => {
        if (typeof value.paywallEnabled !== 'boolean') throw Error('Invalid access configuration')
        if (active) {
          setConfig(value)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [retry])
  const enabled = status === 'ready' ? config!.paywallEnabled : null
  const prices = config?.prices ?? []
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-800">Access and pricing</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Prepare one application at a time</h1>
        <p className="text-lg leading-8 text-slate-600">
          Understand the fit, review supported edits and decide what represents your experience accurately.
        </p>
      </header>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6" aria-label="Current access">
        {status === 'loading' ? (
          <p role="status">Loading current access and pricing…</p>
        ) : status === 'error' ? (
          <div role="alert" className="space-y-3">
            <h2 className="text-xl font-semibold">Current pricing could not be loaded</h2>
            <p>Paid access has not been confirmed. Try again before deciding what is included.</p>
            <button type="button" className={ui.button.secondary} onClick={() => setRetry((n) => n + 1)}>
              Reload pricing
            </button>
          </div>
        ) : enabled ? (
          <>
            <h2 className="text-2xl font-semibold">Full review unlock</h2>
            <p>
              Scores and top fixes are available in the free preview. A one-time payment unlocks the full review for
              that analysis. There is no subscription.
            </p>
            {prices.length ? (
              <p className="text-3xl font-semibold">
                {prices.map((price) => formatPrice(price)).join(' / ')}{' '}
                <span className="text-base font-normal">per review</span>
              </p>
            ) : (
              <div role="alert">
                <p>Paid unlocks are enabled, but prices are unavailable. Check again before purchasing.</p>
                <button type="button" className={ui.button.secondary} onClick={() => setRetry((n) => n + 1)}>
                  Reload pricing
                </button>
              </div>
            )}
            <p className="text-sm text-slate-600">
              Payments use Razorpay.{' '}
              <Link className={ui.results.link} to="/refund">
                Refund policy
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold">Early access · no report-unlock payment required</h2>
            <p>No credit card required. Current analysis allowances still apply.</p>
          </>
        )}
      </section>
      <section className="grid gap-6 md:grid-cols-2" aria-label="Analysis allowances">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Try as a guest</h2>
          <p className="mt-3 text-3xl font-semibold text-teal-900">
            3 analyses<span className="text-base font-normal text-slate-600"> / month</span>
          </p>
          <p className="mt-4 leading-7 text-slate-600">
            Explore a job-specific review or a resume readability check without signing in. Sign in to keep reviews
            available across devices.
          </p>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-6">
          <h2 className="text-xl font-semibold">Free signed-in account</h2>
          <p className="mt-3 text-3xl font-semibold text-teal-900">
            15 analyses<span className="text-base font-normal text-slate-600"> / month</span>
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
            <li>Reuse saved uploads and choose a primary source.</li>
            <li>Find application reviews by company and role.</li>
            <li>Return to saved review choices and confirmed answers.</li>
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            Account access and report unlocks are separate. Full-review availability follows the current access status
            above.
          </p>
        </div>
      </section>
      <section className="space-y-5">
        <h2 className="text-2xl font-semibold">What a full review helps you do</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {[
            'Compare ready edits with the original passages.',
            'Optionally clarify omitted experience with a confirmed answer.',
            'Keep earlier choices while reviewing answer updates.',
            'Download selected edits in Word when available.',
          ].map((text) => (
            <li key={text} className="border-l-2 border-teal-700 pl-4 leading-7">
              {text}
            </li>
          ))}
        </ul>
        <p className="text-sm leading-7 text-slate-600">
          An answer may add a passage, ask for detail or make no change. Scores remain for the submitted resume. Word
          downloads rebuild extracted text rather than preserving the original PDF design.
        </p>
      </section>
      <div>
        <NewJobLink className={`${ui.button.primary} inline-flex`}>Start a job review</NewJobLink>
      </div>
      <section className="space-y-5">
        <h2 className="text-2xl font-semibold">Access questions</h2>
        {buildFaqs(enabled).map((faq) => (
          <details key={faq.question} className="border-b border-slate-200 pb-4">
            <summary className="font-semibold">{faq.question}</summary>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">{faq.answer}</p>
          </details>
        ))}
      </section>
    </div>
  )
}
