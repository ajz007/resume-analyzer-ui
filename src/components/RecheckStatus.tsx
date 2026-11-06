import { Link } from 'react-router-dom'
import type { Recheck } from '../api/rechecks'
import { ui } from '../app/uiTokens'

export function recheckPresentation(status?: string) {
  switch (status) {
    case 'queued':
    case 'processing':
      return { label: 'Recheck in progress', action: 'View status', tone: 'text-teal-800' }
    case 'completed':
      return { label: 'Recheck ready', action: 'View recheck', tone: 'text-teal-800' }
    case 'failed':
      return { label: 'Recheck needs attention', action: 'View issue', tone: 'text-red-800' }
    default:
      return undefined
  }
}

export default function RecheckStatus({ recheck, originalScore }: { recheck: Recheck; originalScore?: number }) {
  const presentation = recheckPresentation(recheck.status)
  if (!presentation) return null

  return (
    <section aria-label="Latest resume recheck" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div aria-live="polite">
        <p className={`font-semibold ${presentation.tone}`}>{presentation.label}</p>
        {recheck.status === 'completed' && typeof originalScore === 'number' && typeof recheck.score === 'number' ? (
          <p className="text-sm text-slate-700">Original {originalScore}/100 · Tailored {Math.round(recheck.score)}/100</p>
        ) : recheck.status === 'failed' && recheck.paidReviewCredit === 'returned' ? (
          <p className="text-sm text-slate-700">Your paid review credit was returned.</p>
        ) : null}
      </div>
      <Link className={ui.button.secondary} to={`/app/results/${encodeURIComponent(recheck.analysisId)}`}>
        {presentation.action}
      </Link>
    </section>
  )
}
