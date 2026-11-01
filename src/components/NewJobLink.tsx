import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAnalysisStore } from '../store/useAnalysisStore'

export function startNewReview(mode: 'ATS' | 'JOB_MATCH' = 'JOB_MATCH') {
  const store = useAnalysisStore.getState()
  store.resetJdOnly()
  store.setAnalysisMode(mode)
}

export const startNewJobReview = () => startNewReview('JOB_MATCH')

export default function NewJobLink({
  children,
  className,
  mode = 'JOB_MATCH',
}: {
  children: ReactNode
  className?: string
  mode?: 'ATS' | 'JOB_MATCH'
}) {
  return (
    <Link
      to={`/app/analyzer?mode=${mode === 'ATS' ? 'ats' : 'job-match'}`}
      className={className}
      onClick={(event) => {
        if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey)
          startNewReview(mode)
      }}
    >
      {children}
    </Link>
  )
}
