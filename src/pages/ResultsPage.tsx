import { useNavigate, useParams } from 'react-router-dom'
import ResultBox from '../components/ResultBox'
import RecommendationsPanel from '../components/RecommendationsPanel'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { fetchAnalysisResult } from '../api/endpoints'
import { useEffect, useState } from 'react'
import type { AnalysisResponse } from '../api/types'
import { ui } from '../app/uiTokens'

const ResultsPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>()
  const navigate = useNavigate()
  const { result, analysisId: latestId, reset, resetJdOnly } = useAnalysisStore()
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

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={ui.text.h2}>Resume Analysis Report</h1>
          <p className="text-sm text-gray-600 mt-1">
            Jump to:{' '}
            <a href="#score-breakdown" className="underline text-blue-700">
              Score Breakdown
            </a>{' '}
            ·{' '}
            <a href="#skill-gaps" className="underline text-blue-700">
              Skill Gaps
            </a>{' '}
            ·{' '}
            <a href="#ats-checks" className="underline text-blue-700">
              ATS Checks
            </a>{' '}
            ·{' '}
            <a href="#rewrites" className="underline text-blue-700">
              Rewrites
            </a>{' '}
            ·{' '}
            <a href="#next-steps" className="underline text-blue-700">
              Next Steps
            </a>{' '}
            ·{' '}
            <a href="#findings" className="underline text-blue-700">
              Findings
            </a>
          </p>
          {toRender?.createdAt && (
            <p className={ui.text.subtitle}>
              Analyzed at: {new Date(toRender.createdAt).toLocaleString()}
            </p>
          )}
        </div>
        {toRender && (
          <span className={`${ui.badge.score} bg-blue-100 text-blue-800 border-blue-200`}>
            Score: {(toRender.finalScore ?? toRender.matchScore)}/100
          </span>
        )}
      </div>

      {toRender ? (
        <>
          <ResultBox result={toRender} />
          <div id="findings">
            <RecommendationsPanel recommendations={toRender.recommendations} />
          </div>
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
  )
}

export default ResultsPage
