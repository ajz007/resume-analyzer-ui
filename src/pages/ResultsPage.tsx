import { useNavigate, useParams } from 'react-router-dom'
import ApplicationContext from '../components/ApplicationContext'
import AtsReport from '../components/reports/AtsReport'
import JobMatchReport from '../components/reports/JobMatchReport'
import UnlockCard from '../components/reports/UnlockCard'
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
        Your history, resume workspace, and tailored resumes stay available
        across devices.
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
  const {
    result,
    analysisId: latestId,
    reset,
    resetJdOnly,
    analysisMode,
  } = useAnalysisStore()
  const showToast = useToastStore((state) => state.showToast)
  const [cachedResult, setCachedResult] = useState<AnalysisResponse | null>(
    null,
  )
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isCreatingShare, setIsCreatingShare] = useState(false)
  const [isCopyingLink, setIsCopyingLink] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [shareError, setShareError] = useState<string | undefined>(undefined)
  const [unlockedResult, setUnlockedResult] = useState<AnalysisResponse | null>(
    null,
  )
  const [applicationStatus, setApplicationStatus] = useState('loading')
  const [refresh, setRefresh] = useState(0)
  const applicationSaveError = useAnalysisStore((s) =>
    s.analysisId === analysisId ? s.applicationSaveError : undefined,
  )
  const loggedIn = isLoggedIn()
  const authStartUrl = useMemo(() => {
    const base = (env.apiBaseUrl || '').replace(/\/$/, '')
    return base ? `${base}/auth/google/start` : '/auth/google/start'
  }, [])

  const normalizeCachedResult = (
    parsed: AnalysisResponse,
  ): AnalysisResponse => ({
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
        // Always verify the current owner with the server. Legacy browser caches are not account-scoped.
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
  }, [analysisId, result, latestId, refresh])

  const hasMatchingResult = result && analysisId && latestId === analysisId
  const toRender =
    unlockedResult ?? (hasMatchingResult && result ? result : cachedResult)
  const isLocked = toRender?.locked === true
  const signIn = () => window.open(authStartUrl, '_self')

  const handleUnlocked = async () => {
    if (!analysisId) return
    const storageKey = `analysis:${analysisId}`
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // Storage may be unavailable; the refetch below still shows the full report.
    }
    const fetched = await fetchAnalysisResult(analysisId)
    if (!fetched) return
    setUnlockedResult(normalizeCachedResult(fetched))
    try {
      localStorage.setItem(storageKey, JSON.stringify(fetched))
    } catch {
      // Ignore storage quota or privacy-mode errors.
    }
    showToast({
      type: 'success',
      title: 'Report unlocked',
      message: 'The full report is now available.',
    })
  }
  const normalized = toRender ? normalizeAnalysisResponse(toRender) : null

  useEffect(() => {
    if (!normalized && ['queued', 'processing'].includes(applicationStatus)) {
      const timer = window.setInterval(() => setRefresh((n) => n + 1), 5000)
      return () => window.clearInterval(timer)
    }
  }, [applicationStatus, !!normalized])

  const resolveMode = (mode?: string) => {
    if (!mode) return analysisMode
    const token = mode.toLowerCase()
    if (token === 'ats' || token === 'resume_only' || token === 'resume-only')
      return 'ATS'
    if (token === 'job_match' || token === 'job-match' || token === 'jobmatch')
      return 'JOB_MATCH'
    return analysisMode
  }

  const modeFromResult = (toRender as { mode?: string } | null)?.mode
  const reportMode = resolveMode(modeFromResult)
  const headerScore = normalized
    ? reportMode === 'ATS'
      ? getATSScore(normalized)
      : getJobMatchScore(normalized)
    : undefined
  const hasJobPriorities =
    normalized?.jobRequirementProfile?.isApplicable === true
  const hasTopGapActions = (normalized?.fixThisFirst?.length ?? 0) > 0
  const hasRewrites = (normalized?.normalized.bulletSuggestions.length ?? 0) > 0
  const hasKeyRisks = (normalized?.issues?.length ?? 0) > 0
  const hasAiShortlist = !!normalized?.aiScreening
  const hasRequirements =
    (normalized?.jobMatchScoring?.requirementScores?.length ?? 0) > 0
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
      {applicationSaveError && (
        <p role="alert" className="mb-4 text-amber-900">
          {applicationSaveError}
        </p>
      )}
      {analysisId && (
        <ApplicationContext
          analysisId={analysisId}
          onStatus={setApplicationStatus}
          refreshKey={refresh}
        />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          {!normalized?.report && (
            <h2 className={ui.results.page.headerTitle}>
              Resume readiness report
            </h2>
          )}
          {normalized?.report
            ? null
            : reportMode === 'JOB_MATCH'
              ? renderJumpLinks(
                  [
                    hasJobPriorities
                      ? { href: '#job-intent', label: 'Job Priorities' }
                      : null,
                    hasTopGapActions
                      ? { href: '#fix-first', label: 'Top Gaps' }
                      : null,
                    hasRewrites
                      ? { href: '#rewrites', label: 'Resume Updates' }
                      : null,
                    hasKeyRisks
                      ? { href: '#key-risks', label: 'Key Risks' }
                      : null,
                    hasAtsSection ? { href: '#ats', label: 'ATS' } : null,
                    hasAiShortlist
                      ? { href: '#ai-shortlist', label: 'AI Shortlist' }
                      : null,
                    hasRequirements
                      ? { href: '#requirements', label: 'Requirements' }
                      : null,
                  ].filter(Boolean) as { href: string; label: string }[],
                )
              : renderJumpLinks(
                  [
                    hasTopGapActions
                      ? { href: '#fix-first', label: 'Top Gaps' }
                      : null,
                    hasRewrites
                      ? { href: '#rewrites', label: 'Resume Updates' }
                      : null,
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
          {!normalized?.report && typeof headerScore === 'number' ? (
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
            <p className="max-w-60 text-right text-sm text-red-700">
              {shareError}
            </p>
          ) : null}
        </div>
      </div>

      {normalized ? (
        <>
          {isLocked && analysisId ? (
            <UnlockCard
              analysisId={analysisId}
              lockedSections={toRender?.lockedSections ?? []}
              loggedIn={loggedIn}
              onSignIn={signIn}
              onUnlocked={handleUnlocked}
            />
          ) : null}
          {reportMode === 'JOB_MATCH' ? (
            <JobMatchReport result={normalized} />
          ) : (
            <AtsReport result={normalized} />
          )}
          {!loggedIn && !isLocked ? (
            <GuestResultsCta onSignIn={signIn} />
          ) : null}
        </>
      ) : (
        <div className={`${ui.card.padded} space-y-3`}>
          <p className="text-gray-700 font-semibold">
            {applicationStatus === 'loading'
              ? 'Loading your review…'
              : applicationStatus === 'queued'
                ? 'Your review is in the queue.'
                : applicationStatus === 'processing'
                  ? 'Your review is still processing.'
                  : applicationStatus === 'failed'
                    ? 'This review could not be completed.'
                    : 'Result not found.'}
          </p>
          <p className={ui.text.subtitle}>
            {['queued', 'processing'].includes(applicationStatus)
              ? 'You can return later through Applications. You do not need to submit this request again.'
              : applicationStatus === 'failed'
                ? 'Review your saved source and job description before explicitly retrying.'
                : 'Open Applications to find a saved review, or check again.'}
          </p>
          <button
            onClick={() => navigate('/app/analyzer')}
            className={`mt-2 ${ui.button.primary}`}
          >
            Go to Analyzer
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              reset()
              navigate('/app/analyzer')
            }}
            className={ui.results.button.primary}
          >
            Start a new review
          </button>
          <button
            onClick={() => navigate('/app/history')}
            className={ui.button.secondary}
          >
            View applications
          </button>
          <button
            onClick={() => {
              resetJdOnly()
              navigate('/app/analyzer')
            }}
            className="border border-blue-300 text-blue-700 px-4 py-2 rounded hover:bg-blue-50"
          >
            Review another job
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
