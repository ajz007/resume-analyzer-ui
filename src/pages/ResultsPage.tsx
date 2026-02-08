import { useNavigate, useParams } from 'react-router-dom'
import AtsReport from '../components/reports/AtsReport'
import JobMatchReport from '../components/reports/JobMatchReport'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { fetchAnalysisResult } from '../api/endpoints'
import { useEffect, useState } from 'react'
import type { AnalysisResponse } from '../api/types'
import { ui } from '../app/uiTokens'
import { normalizeAnalysisResponse } from '../analysis/normalizeAnalysisResponse'

const ResultsPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>()
  const navigate = useNavigate()
  const { result, analysisId: latestId, reset, resetJdOnly, analysisMode } = useAnalysisStore()
  const [cachedResult, setCachedResult] = useState<AnalysisResponse | null>(null)

  const normalizeCachedResult = (parsed: AnalysisResponse): AnalysisResponse => ({
    ...parsed,
    scoreExplanation: Array.isArray(parsed.scoreExplanation?.components)
      ? parsed.scoreExplanation
      : undefined,
    finalScore: parsed.finalScore ?? parsed.matchScore ?? 0,
  })

  useEffect(() => {
    if (!analysisId) return
    if (result && latestId === analysisId) {
      setCachedResult(null)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const stored = localStorage.getItem(`analysis:${analysisId}`)
        if (stored) {
          const parsed = JSON.parse(stored) as AnalysisResponse
          setCachedResult(normalizeCachedResult(parsed))
          return
        }

        const fetched = await fetchAnalysisResult(analysisId)
        if (cancelled) return
        setCachedResult(fetched ? normalizeCachedResult(fetched) : null)
      } catch {
        if (!cancelled) setCachedResult(null)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [analysisId, result, latestId])

  const hasMatchingResult = result && analysisId && latestId === analysisId
  const toRender = hasMatchingResult && result ? result : cachedResult
  const normalized = toRender ? normalizeAnalysisResponse(toRender) : null

  const resolveMode = (mode?: string) => {
    if (!mode) return analysisMode
    const token = mode.toLowerCase()
    if (token === 'ats' || token === 'resume_only' || token === 'resume-only') return 'ATS'
    if (token === 'job_match' || token === 'job-match' || token === 'jobmatch') return 'JOB_MATCH'
    return analysisMode
  }

  const modeFromResult = (toRender as { mode?: string } | null)?.mode
  const reportMode = resolveMode(modeFromResult)

  return (
    <div className="p-6 space-y-6 text-[16px] leading-relaxed">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={ui.text.h2}>Resume Analysis Report</h1>
          {reportMode === 'JOB_MATCH' ? (
            <p className="text-sm text-gray-600 mt-1">
              Jump to:{' '}
              <a href="#summary" className="underline text-blue-700">
                Summary
              </a>{' '}
              |{' '}
              <a href="#fix-first" className="underline text-blue-700">
                Fix First
              </a>{' '}
              |{' '}
              <a href="#top-gaps" className="underline text-blue-700">
                Top Gaps
              </a>{' '}
              |{' '}
              <a href="#rewrites" className="underline text-blue-700">
                Rewrites
              </a>{' '}
              |{' '}
              <a href="#ats" className="underline text-blue-700">
                ATS Readiness
              </a>{' '}
              |{' '}
              <a href="#findings" className="underline text-blue-700">
                Detailed Findings
              </a>
            </p>
          ) : (
            <p className="text-sm text-gray-600 mt-1">
              Jump to:{' '}
              <a href="#fix-first" className="underline text-blue-700">
                Fix First
              </a>{' '}
              |{' '}
              <a href="#ats" className="underline text-blue-700">
                ATS Checks
              </a>{' '}
              |{' '}
              <a href="#rewrites" className="underline text-blue-700">
                Rewrites
              </a>{' '}
              |{' '}
              <a href="#findings" className="underline text-blue-700">
                Detailed Findings
              </a>
            </p>
          )}
          {toRender?.createdAt && (
            <p className={ui.text.subtitle}>
              Analyzed at: {new Date(toRender.createdAt).toLocaleString()}
            </p>
          )}
        </div>
        {normalized && (
          <span className={`${ui.badge.score} bg-blue-100 text-blue-800 border-blue-200`}>
            {reportMode === 'ATS' ? 'ATS Score' : 'Match Score'}:{' '}
            {reportMode === 'ATS'
              ? normalized.normalized.atsScore ?? normalized.finalScore ?? normalized.matchScore
              : normalized.matchScore ?? normalized.finalScore}
            /100
          </span>
        )}
      </div>

      {normalized ? (
        <>
          {reportMode === 'JOB_MATCH' ? (
            <JobMatchReport result={normalized} />
          ) : (
            <AtsReport result={normalized} />
          )}
        </>
      ) : (
        <div className={`${ui.card.padded} space-y-3`}>
          <p className="text-gray-700 font-semibold">Result not found.</p>
          <p className={ui.text.subtitle}>Please run a new analysis to view a report.</p>
          <button
            onClick={() => navigate('/app/analyzer')}
            className={`mt-2 ${ui.button.primary}`}
          >
            Go to Analyzer
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div className={ui.text.subtitle}>
          <p className="font-semibold text-gray-700">Next (coming soon)</p>
          <ul className="list-disc list-inside text-gray-600">
            <li>Apply fixes directly to your resume</li>
            <li>Track score improvement</li>
            <li>Generate role-specific versions</li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              reset()
              navigate('/app/analyzer')
            }}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
          >
            Start new analysis
          </button>
          <button
            onClick={() => navigate('/app/history')}
            className={ui.button.secondary}
          >
            View history
          </button>
          <button
            onClick={() => {
              resetJdOnly()
              navigate('/app/analyzer')
            }}
            className="border border-blue-300 text-blue-700 px-4 py-2 rounded hover:bg-blue-50"
          >
            Analyze another JD
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultsPage

