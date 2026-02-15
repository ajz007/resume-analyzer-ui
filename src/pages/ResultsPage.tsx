import { useNavigate, useParams } from 'react-router-dom'
import AtsReport from '../components/reports/AtsReport'
import JobMatchReport from '../components/reports/JobMatchReport'
import ResultsLayout from '../components/results/ResultsLayout'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { fetchAnalysisResult } from '../api/endpoints'
import { Fragment, useEffect, useState } from 'react'
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
  const summaryPayload =
    normalized && typeof normalized.summary === 'object' ? (normalized.summary as Record<string, unknown>) : null
  const hasSummary =
    !!summaryPayload &&
    (!!summaryPayload.strengths || !!summaryPayload.weaknesses || !!summaryPayload.overallAssessment)
  const hasNextSteps =
    (normalized?.actionPlan?.quickWins?.length ?? 0) > 0 ||
    (normalized?.actionPlan?.mediumEffort?.length ?? 0) > 0 ||
    (normalized?.actionPlan?.deepFixes?.length ?? 0) > 0 ||
    (normalized?.recommendations?.length ?? 0) > 0
  const hasRewrites = (normalized?.normalized.bulletSuggestions.length ?? 0) > 0
  const hasFindings = (normalized?.recommendations?.length ?? 0) > 0
  const hasTopGaps =
    (normalized?.issues?.length ?? 0) > 0 ||
    (normalized?.normalized.missingKeywordsFromJD.length ?? 0) >= 5
  const hasAtsChecks = !!normalized?.issues?.some((issue) => {
    const token = issue.section.toLowerCase()
    return (
      token.includes('ats') ||
      token.includes('format') ||
      token.includes('contact') ||
      token.includes('skills') ||
      token.includes('tools') ||
      token.includes('layout')
    )
  })

  const renderJumpLinks = (links: { href: string; label: string }[]) => {
    if (!links.length) return null
    return (
      <p className={ui.results.page.headerMeta}>
        Jump to:{' '}
        {links.map((link, idx) => (
          <Fragment key={link.href}>
            <a href={link.href} className={ui.results.page.jumpLinks}>
              {link.label}
            </a>
            {idx < links.length - 1 ? ' | ' : null}
          </Fragment>
        ))}
      </p>
    )
  }

  return (
    <ResultsLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={ui.results.page.headerTitle}>Resume Analysis Report</h1>
          {reportMode === 'JOB_MATCH'
            ? renderJumpLinks(
                [
                  hasSummary ? { href: '#summary', label: 'Summary' } : null,
                  hasNextSteps ? { href: '#fix-first', label: 'Fix First' } : null,
                  hasTopGaps ? { href: '#top-gaps', label: 'Top Gaps' } : null,
                  hasRewrites ? { href: '#rewrites', label: 'Rewrites' } : null,
                  hasAtsChecks ? { href: '#ats', label: 'ATS Readiness' } : null,
                  hasFindings ? { href: '#findings', label: 'Detailed Findings' } : null,
                ].filter(Boolean) as { href: string; label: string }[],
              )
            : renderJumpLinks(
                [
                  hasNextSteps ? { href: '#fix-first', label: 'Fix First' } : null,
                  hasAtsChecks ? { href: '#ats', label: 'ATS Checks' } : null,
                  hasRewrites ? { href: '#rewrites', label: 'Rewrites' } : null,
                  hasFindings ? { href: '#findings', label: 'Detailed Findings' } : null,
                ].filter(Boolean) as { href: string; label: string }[],
              )}
          {toRender?.createdAt && (
            <p className={ui.results.page.headerMeta}>
              Analyzed at: {new Date(toRender.createdAt).toLocaleString()}
            </p>
          )}
        </div>
        {normalized && (
          <span className={ui.results.score.pill}>
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
        <div className={ui.results.text.meta}>
          <p className="font-semibold text-gray-700">Next (coming soon)</p>
          <ul className={ui.results.list.bulletsSecondary}>
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
            className={ui.results.button.primary}
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
    </ResultsLayout>
  )
}

export default ResultsPage

