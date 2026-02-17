import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AtsReport from '../components/reports/AtsReport'
import JobMatchReport from '../components/reports/JobMatchReport'
import ResultsLayout from '../components/results/ResultsLayout'
import { fetchSharedAnalysis } from '../api/endpoints'
import type { AnalysisResponse, SharedAnalysisResponse } from '../api/types'
import type { ApiError } from '../api/client'
import { ui } from '../app/uiTokens'
import { normalizeAnalysisResponse } from '../analysis/normalizeAnalysisResponse'

type SharedPageState = 'loading' | 'ready' | 'invalid' | 'error'

const SharedReportPage = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<SharedPageState>('loading')
  const [sharedAnalysis, setSharedAnalysis] = useState<SharedAnalysisResponse | null>(null)

  useEffect(() => {
    if (!token) {
      setState('invalid')
      return
    }

    let cancelled = false
    const load = async () => {
      setState('loading')
      try {
        const response = await fetchSharedAnalysis(token)
        if (cancelled) return
        setSharedAnalysis(response)
        setState(response.result ? 'ready' : 'invalid')
      } catch (err) {
        if (cancelled) return
        const apiError = err as ApiError
        setState(apiError.status === 404 ? 'invalid' : 'error')
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [token])

  const toRender: AnalysisResponse | null = sharedAnalysis?.result ?? null
  const normalized = toRender ? normalizeAnalysisResponse(toRender) : null

  const resolveMode = (mode?: string) => {
    if (!mode) return 'JOB_MATCH'
    const tokenized = mode.toLowerCase()
    if (tokenized === 'ats' || tokenized === 'resume_only' || tokenized === 'resume-only') return 'ATS'
    if (tokenized === 'job_match' || tokenized === 'job-match' || tokenized === 'jobmatch') return 'JOB_MATCH'
    return 'JOB_MATCH'
  }

  const modeFromResult = (toRender as { mode?: string } | null)?.mode
  const reportMode = resolveMode(modeFromResult ?? sharedAnalysis?.mode)

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100">
        <main className={`${ui.layout.container} py-10`}>
          <div className={`${ui.card.paddedLg} max-w-3xl mx-auto`}>
            <h1 className={ui.results.page.headerTitle}>Loading shared report...</h1>
            <p className={ui.results.text.meta}>Please wait while we fetch this report.</p>
          </div>
        </main>
      </div>
    )
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-100">
        <main className={`${ui.layout.container} py-10`}>
          <div className={`${ui.card.paddedLg} max-w-3xl mx-auto space-y-3`}>
            <h1 className={ui.results.page.headerTitle}>Shared report unavailable</h1>
            <p className={ui.text.subtitle}>
              This shared report link is invalid or has been revoked.
            </p>
            <Link to="/app/analyzer" className={ui.button.primary}>
              Analyze your resume
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gray-100">
        <main className={`${ui.layout.container} py-10`}>
          <div className={`${ui.card.paddedLg} max-w-3xl mx-auto space-y-3`}>
            <h1 className={ui.results.page.headerTitle}>Could not load shared report</h1>
            <p className={ui.text.subtitle}>Please try again in a moment.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => window.location.reload()} className={ui.button.secondary}>
                Retry
              </button>
              <button type="button" onClick={() => navigate('/app/analyzer')} className={ui.button.primary}>
                Analyze your resume
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className={`${ui.layout.container} py-6`}>
        <ResultsLayout>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className={ui.results.page.headerTitle}>Resume Analysis Report</h1>
              {toRender?.createdAt && (
                <p className={ui.results.page.headerMeta}>
                  Analyzed at: {new Date(toRender.createdAt).toLocaleString()}
                </p>
              )}
              <p className={ui.results.page.headerMeta}>Shared report view</p>
            </div>
            {normalized ? (
              <span className={ui.results.score.pill}>
                {reportMode === 'ATS' ? 'ATS Score' : 'Match Score'}:{' '}
                {reportMode === 'ATS'
                  ? normalized.normalized.atsScore ?? normalized.finalScore ?? normalized.matchScore
                  : normalized.matchScore ?? normalized.finalScore}
                /100
              </span>
            ) : null}
          </div>

          {normalized ? (
            reportMode === 'JOB_MATCH' ? (
              <JobMatchReport result={normalized} />
            ) : (
              <AtsReport result={normalized} />
            )
          ) : (
            <div className={`${ui.card.padded} space-y-3`}>
              <p className="text-gray-700 font-semibold">Result not found.</p>
              <p className={ui.text.subtitle}>This shared report has no visible data.</p>
            </div>
          )}

          <div className="pt-2">
            <Link to="/app/analyzer" className={ui.button.primary}>
              Analyze your resume
            </Link>
          </div>
        </ResultsLayout>
      </main>
    </div>
  )
}

export default SharedReportPage
