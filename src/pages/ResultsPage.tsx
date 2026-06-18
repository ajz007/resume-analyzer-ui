import { useNavigate, useParams } from 'react-router-dom'
import AtsReport from '../components/reports/AtsReport'
import JobMatchReport from '../components/reports/JobMatchReport'
import ResultsLayout from '../components/results/ResultsLayout'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { createAnalysisShare, fetchAnalysisResult } from '../api/endpoints'
import { Fragment, useEffect, useMemo, useState } from 'react'
import type { AnalysisResponse } from '../api/types'
import { ui } from '../app/uiTokens'
import { normalizeAnalysisResponse } from '../analysis/normalizeAnalysisResponse'
import ShareModal from '../components/ShareModal'
import { useToastStore } from '../store/useToastStore'
import { getATSScore, getJobMatchScore } from '../analysis/reportScores'
import AppPageMetadata from '../components/seo/AppPageMetadata'
import { env } from '../app/env'
import { isLoggedIn } from '../auth/identity'

export const GuestResultsCta = ({ onSignIn }: { onSignIn: () => void }) => (
  <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-gray-950">
        Save this analysis and get 15 free analyses/month by signing in.
      </h2>
      <p className="text-sm text-gray-700">
        Your history, resume workspace, and tailored resumes stay available across devices.
      </p>
    </div>
    <div className="mt-4">
      <button type="button" onClick={onSignIn} className={ui.button.primary}>
        Sign in with Google
      </button>
    </div>
  </div>
)

const ResultsPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>()
  const navigate = useNavigate()
  const { result, analysisId: latestId, reset, resetJdOnly, analysisMode } = useAnalysisStore()
  const showToast = useToastStore((state) => state.showToast)
  const [cachedResult, setCachedResult] = useState<AnalysisResponse | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isCreatingShare, setIsCreatingShare] = useState(false)
  const [isCopyingLink, setIsCopyingLink] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [shareError, setShareError] = useState<string | undefined>(undefined)
  const loggedIn = isLoggedIn()
  const authStartUrl = useMemo(() => {
    const base = (env.apiBaseUrl || '').replace(/\/$/, '')
    return base ? `${base}/auth/google/start` : '/auth/google/start'
  }, [])

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
  const headerScore = normalized
    ? reportMode === 'ATS'
      ? getATSScore(normalized)
      : getJobMatchScore(normalized)
    : undefined
  const hasJobPriorities = normalized?.jobRequirementProfile?.isApplicable === true
  const hasTopGapActions = (normalized?.fixThisFirst?.length ?? 0) > 0
  const hasRewrites = (normalized?.normalized.bulletSuggestions.length ?? 0) > 0
  const hasKeyRisks = (normalized?.issues?.length ?? 0) > 0
  const hasAiShortlist = !!normalized?.aiScreening
  const hasRequirements = (normalized?.jobMatchScoring?.requirementScores?.length ?? 0) > 0
  const hasAtsSection =
    typeof (normalized ? getATSScore(normalized) : undefined) === 'number' ||
    !!normalized?.issues?.some((issue) => {
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

  const copyToClipboard = async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return
    }

    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  const handleShare = async () => {
    if (!analysisId) return
    setIsCreatingShare(true)
    setShareError(undefined)
    try {
      const response = await createAnalysisShare(analysisId)
      setShareUrl(response.shareUrl)
      setIsShareModalOpen(true)
    } catch (err) {
      const message =
        typeof (err as { message?: string })?.message === 'string'
          ? (err as { message: string }).message
          : 'Could not create a share link. Please try again.'
      setShareError(message)
      showToast({
        type: 'error',
        title: 'Share failed',
        message,
      })
    } finally {
      setIsCreatingShare(false)
    }
  }

  const handleCopyShareLink = async () => {
    if (!shareUrl) return
    setIsCopyingLink(true)
    setShareError(undefined)
    try {
      await copyToClipboard(shareUrl)
      showToast({
        type: 'success',
        title: 'Link copied',
        message: 'Share link copied to clipboard.',
      })
    } catch {
      const message = 'Could not copy the link. Please copy it manually.'
      setShareError(message)
      showToast({
        type: 'error',
        title: 'Copy failed',
        message,
      })
    } finally {
      setIsCopyingLink(false)
    }
  }

  return (
    <ResultsLayout>
      <AppPageMetadata
        title="Analysis Results | Rethink Resume"
        description="Review ATS and job match analysis results."
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={ui.results.page.headerTitle}>Resume readiness report</h1>
          {reportMode === 'JOB_MATCH'
            ? renderJumpLinks(
                [
                  hasJobPriorities ? { href: '#job-intent', label: 'Job Priorities' } : null,
                  hasTopGapActions ? { href: '#fix-first', label: 'Top Gaps' } : null,
                  hasRewrites ? { href: '#rewrites', label: 'Resume Updates' } : null,
                  hasKeyRisks ? { href: '#key-risks', label: 'Key Risks' } : null,
                  hasAtsSection ? { href: '#ats', label: 'ATS' } : null,
                  hasAiShortlist ? { href: '#ai-shortlist', label: 'AI Shortlist' } : null,
                  hasRequirements ? { href: '#requirements', label: 'Requirements' } : null,
                ].filter(Boolean) as { href: string; label: string }[],
              )
            : renderJumpLinks(
                [
                  hasTopGapActions ? { href: '#fix-first', label: 'Top Gaps' } : null,
                  hasRewrites ? { href: '#rewrites', label: 'Resume Updates' } : null,
                  hasAtsSection ? { href: '#ats', label: 'ATS' } : null,
                ].filter(Boolean) as { href: string; label: string }[],
              )}
          {toRender?.createdAt && (
            <p className={ui.results.page.headerMeta}>
              Analyzed at: {new Date(toRender.createdAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {typeof headerScore === 'number' ? (
            <span className={ui.results.score.pill}>
              {reportMode === 'ATS' ? 'ATS Readiness' : 'Job Match'}:{' '}
              {headerScore}/100
            </span>
          ) : null}
          {analysisId ? (
            <button
              type="button"
              onClick={handleShare}
              disabled={isCreatingShare}
              className={ui.button.secondary}
            >
              {isCreatingShare ? 'Creating link...' : 'Share'}
            </button>
          ) : null}
          {shareError && !isShareModalOpen ? (
            <p className="max-w-60 text-right text-sm text-red-700">{shareError}</p>
          ) : null}
        </div>
      </div>

      {normalized ? (
        <>
          {reportMode === 'JOB_MATCH' ? (
            <JobMatchReport result={normalized} />
          ) : (
            <AtsReport result={normalized} />
          )}
          {!loggedIn ? <GuestResultsCta onSignIn={() => window.open(authStartUrl, '_self')} /> : null}
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
            <li>Apply recommended updates to your resume</li>
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

      <ShareModal
        open={isShareModalOpen}
        shareUrl={shareUrl}
        isCopying={isCopyingLink}
        errorMessage={shareError}
        onCopy={handleCopyShareLink}
        onClose={() => setIsShareModalOpen(false)}
      />
    </ResultsLayout>
  )
}

export default ResultsPage

