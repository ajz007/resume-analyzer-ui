import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { startRecheck, type Recheck } from '../../api/rechecks'
import ReviewCreditAction from '../ReviewCreditAction'
import { reviewLink } from './reviewStyles'

export default function RecheckVersionAction({ analysisId, documentId, recheck }: {
  analysisId: string
  documentId: string
  recheck?: Recheck
}) {
  const [confirming, setConfirming] = useState(false)
  const navigate = useNavigate()
  const failed = recheck?.status === 'failed'

  if (recheck && !failed) {
    return (
      <Link className={reviewLink} to={`/app/results/${encodeURIComponent(recheck.analysisId)}`}>
        {recheck.status === 'completed'
          ? (typeof recheck.score === 'number' ? `View recheck · ${Math.round(recheck.score)}/100` : 'View recheck')
          : 'View recheck status'}
      </Link>
    )
  }

  return (
    <>
      <button type="button" className={reviewLink} aria-expanded={confirming} onClick={() => setConfirming(!confirming)}>
        {confirming ? 'Close recheck options' : failed ? 'Retry recheck' : 'Recheck this version'}
      </button>
      {confirming ? (
        <div className="basis-full space-y-2 pt-2">
          <p className="text-sm">
            Recheck this resume against the original job description using 1 paid review credit.
            If the recheck fails, the credit returns to your balance.
          </p>
          <ReviewCreditAction allowBuy onUse={async () => {
            try {
              const result = await startRecheck(analysisId, documentId, failed)
              navigate(`/app/results/${encodeURIComponent(result.analysisId)}`)
            } catch (error) {
              const message = (error as { message?: string }).message
              throw new Error(message || 'Could not start the recheck. Please try again.')
            }
          }} />
        </div>
      ) : null}
    </>
  )
}
