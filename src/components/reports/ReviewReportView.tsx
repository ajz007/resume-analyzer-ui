import { useEffect, useMemo, useRef, useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import { getAIScreeningScore, getATSScore, getJobMatchScore } from '../../analysis/reportScores'
import {
  addedWords,
  chosenEditText,
  revisedPassages,
  sectionPassages,
  unresolvedOutcomes,
} from '../../analysis/reviewEdits'
import { Link } from 'react-router-dom'
import { useWorkspaceIdentity } from '../../auth/useWorkspaceIdentity'
import type { UploadedDoc } from '../../api/documents'
import { downloadTailoredResume, listTailoredResumes, previewTailoredResume, saveTailoredResume, type ResumePreview } from '../../api/tailoredResumes'
import { fetchRechecks, type ApplicationRechecks } from '../../api/rechecks'
import RecheckVersionAction from './RecheckVersionAction'
import TailoredResumePreview from './TailoredResumePreview'
import { apiDownload } from '../../api/client'
import { triggerBrowserDownload } from '../../api/resumes'
import { ui } from '../../app/uiTokens'
import { reviewLink } from './reviewStyles'
import { ReportCard } from '../results/ReportCard'
import AtsChecksSection from './AtsChecksSection'
import ScoreDisclaimer from './ScoreDisclaimer'
import JobRequirementDiagnosis from './JobRequirementDiagnosis'
import ReviewAnswerForm, { type ActiveReviewQuestion } from './ReviewAnswerForm'
import { reviewSessionApi, type ReviewAnswer, type ReviewSessionTransport } from '../../api/reviewSession'
import { useReviewSession } from '../../analysis/useReviewSession'
import { evidenceQuestions, type EvidenceQuestion } from '../../analysis/evidenceQuestions'
import EvidenceQuestionCard from './EvidenceQuestionCard'
import { prioritizeEvidenceQuestions, type PriorityEvidenceQuestion } from '../../analysis/prioritizeEvidenceQuestions'

const Lines = ({ items }: { items?: string[] }) =>
  items?.length ? (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((text, i) => (
        <li key={i}>{text}</li>
      ))}
    </ul>
  ) : (
    <p>No additional items identified.</p>
  )

type ReviewProps = {
  result: NormalizedAnalysis
  referencePreview?: boolean
  localPreview?: boolean
  readOnly?: boolean
  sessionTransport?: ReviewSessionTransport
  recheckData?: ApplicationRechecks | null
}

// A new analysis or access mode must never inherit another review's answers or choices.
export default function ReviewReportView(props: ReviewProps) {
  const identity = useWorkspaceIdentity()
  return (
    <GuidedReview
      key={`${props.result.analysisId}:${!!props.result.locked}:${!props.result.report?.edits}:${!!props.readOnly}:${!!props.localPreview}:${!!props.referencePreview}:${identity ?? 'guest'}`}
      {...props}
      signedIn={!!identity}
    />
  )
}

function GuidedReview({
  result,
  referencePreview = false,
  localPreview = false,
  readOnly = false,
  sessionTransport,
  recheckData,
  signedIn,
}: ReviewProps & { signedIn: boolean }) {
  const initialReport = result.report!
  const eligible =
    result.locked !== true &&
    !!initialReport.edits &&
    result.analysisMode !== 'resume_only' &&
    !!result.jobRequirementProfile?.topPriorities?.length
  const transport = useMemo(
    () =>
      readOnly
        ? null
        : (sessionTransport ??
          (eligible && !localPreview && !referencePreview ? reviewSessionApi(result.analysisId) : null)),
    [readOnly, sessionTransport, eligible, localPreview, referencePreview, result.analysisId],
  )
  const review = useReviewSession(initialReport, transport)
  const canSave = signedIn && !!transport && !readOnly && !localPreview && !referencePreview
  const [localRechecks, setLocalRechecks] = useState<ApplicationRechecks>()
  const rechecks = recheckData === undefined ? localRechecks : recheckData
  const loadLocalRechecks = recheckData === undefined
  const [versions, setVersions] = useState<UploadedDoc[]>([])
  const [versionAction, setVersionAction] = useState('')
  const [versionError, setVersionError] = useState('')
  const [fullPreview, setFullPreview] = useState<{ key: string; preview: ResumePreview } | null>(null)
  useEffect(() => {
    let active = true
    if (canSave) {
      void listTailoredResumes(result.analysisId).then((items) => {
        if (active) setVersions((current) => [
          ...current.filter((saved) => !items.some((item) => item.documentId === saved.documentId)),
          ...items,
        ])
      }).catch(() => {
        if (active) setVersionError('Saved versions could not be loaded. Reopen this review to try again.')
      })
    }
    return () => { active = false }
  }, [canSave, result.analysisId])
  useEffect(() => {
    if (!canSave || !loadLocalRechecks) return
    let active = true
    void fetchRechecks(result.analysisId).then((items) => {
      if (active) setLocalRechecks(items)
    }).catch(() => { /* The recheck endpoint may be unavailable during rollout. */ })
    return () => { active = false }
  }, [canSave, loadLocalRechecks, result.analysisId])
  const report = review.report
  const [activeQuestion, setActiveQuestion] = useState<ActiveReviewQuestion | null>(null)
  const [view, setView] = useState<'changes' | 'full' | 'new'>('changes')
  const excluded = new Set(review.session.excludedIds)
  const answerEditIds = new Set(review.session.answers.flatMap((answer) => (answer.edit ? [answer.edit.id] : [])))
  const [notice, setNotice] = useState('')
  const [answerNotice, setAnswerNotice] = useState('')
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'manual'>('idle')
  const copyField = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (copyStatus === 'manual') {
      copyField.current?.focus()
      copyField.current?.select()
    }
  }, [copyStatus])
  const [busy, setBusy] = useState(false)
  const skipKey = `review-skipped-questions:${result.analysisId}`
  const [skippedQuestions, setSkippedQuestions] = useState<string[]>(() => {
    if (!transport) return []
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(skipKey) ?? '[]')
      return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []
    } catch {
      return []
    }
  })
  const [allEdits, setAllEdits] = useState(false)
  const hasDiagnosis = result.analysisMode !== 'resume_only' && !!result.jobMatchScoring?.requirementScores?.length
  const [panel, setPanel] = useState<'edits' | 'requirements' | 'use'>(hasDiagnosis && !result.locked && initialReport.edits ? 'requirements' : 'edits')
  const [focusTarget, setFocusTarget] = useState('')
  useEffect(() => {
    if (!focusTarget) return
    const element = document.getElementById(focusTarget)
    if (focusTarget === 'job-requirement-diagnosis' || focusTarget.startsWith('review-requirement-')) {
      const breakdown = element?.closest('details')
      if (breakdown) breakdown.open = true
    }
    element?.focus()
    element?.scrollIntoView({ block: 'start' })
    setFocusTarget('')
  }, [focusTarget])
  const edits = report.edits ?? []
  const displayedEdits = view === 'new' ? edits.filter((edit) => answerEditIds.has(edit.id)) : edits
  const locked = result.locked === true || !report.edits
  const verdict = result.aiScreening?.aiRecruiterVerdict
  const previewAction = locked && result.analysisMode !== 'resume_only'
    ? report.previewNextStep || result.fixThisFirst?.find((item) => item.action?.trim())?.action
    : undefined
  const scores = [
    ...(result.analysisMode === 'resume_only' ? [] : [{ label: 'Job match', value: getJobMatchScore(result) }]),
    { label: 'ATS readiness', value: getATSScore(result) },
    { label: 'AI screening readiness', value: getAIScreeningScore(result) },
  ].filter((item) => typeof item.value === 'number')

  const selectedPassages = revisedPassages(report, excluded)

  async function copyPassages() {
    try {
      await navigator.clipboard.writeText(selectedPassages)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('manual')
      copyField.current?.focus()
      copyField.current?.select()
    }
  }
  const exportChoices = {
    editIds: edits.filter((edit) => !excluded.has(edit.id)).map((edit) => edit.id),
    reviewVersion: review.session.version,
  }
  const previewKey = JSON.stringify(exportChoices)

  async function previewVersion() {
    setVersionAction('preview')
    setVersionError('')
    try {
      const preview = await previewTailoredResume(result.analysisId, exportChoices)
      setFullPreview({ key: previewKey, preview })
    } catch {
      setVersionError('The resume preview could not be prepared. Please try again.')
    } finally {
      setVersionAction('')
    }
  }

  async function saveVersion() {
    setVersionAction('save')
    setVersionError('')
    try {
      const saved = await saveTailoredResume(result.analysisId, exportChoices)
      setVersions((items) => [saved, ...items.filter((item) => item.documentId !== saved.documentId)])
      setNotice('Tailored resume saved for this job. You can also find it in My resumes.')
    } catch {
      setVersionError('This version could not be saved. Your edit choices are still here.')
    } finally {
      setVersionAction('')
    }
  }

  async function download() {
    setBusy(true)
    setNotice('')
    try {
      const response = await apiDownload(`/analyses/${encodeURIComponent(result.analysisId)}/reviewed-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportChoices),
      })
      triggerBrowserDownload(await response.blob(), 'reviewed-resume.docx')
      setNotice('Downloaded using your chosen edits and the remaining extracted resume text.')
    } catch {
      setNotice('The download could not be completed. Your choices remain available under Suggested resume changes.')
    } finally {
      setBusy(false)
    }
  }
  const previousAnswerCount = useRef<number | null>(null)
  const answers = review.session.answers
  useEffect(() => {
    if (review.loading || !review.ready) return
    const latestAnswer = answers.at(-1)
    if (latestAnswer && previousAnswerCount.current !== null && answers.length > previousAnswerCount.current) {
      setPanel('edits')
      setView('changes')
      setAllEdits(true)
      setActiveQuestion(null)
      setAnswerNotice(latestAnswer.edit
        ? 'Answer saved. A new edit is ready for your review.'
        : latestAnswer.delta.nextQuestion
          ? 'Answer saved. A follow-up question is available.'
          : 'Answer saved. No resume edit was added.')
      setFocusTarget('review-edit-list')
    }
    previousAnswerCount.current = answers.length
  }, [review.loading, review.ready, answers])
  const outcomes = unresolvedOutcomes(report)

  function openEdits(id?: string) {
    setPanel('edits')
    setView('changes')
    setAllEdits(true)
    if (id) setFocusTarget(`review-edit-${id}`)
  }
  const requirements = result.jobMatchScoring?.requirementScores ?? []
  const priorities = result.jobRequirementProfile?.topPriorities ?? []
  const questions = transport && !review.ready ? [] : evidenceQuestions(report.questions, answers)
  const answeredQuestionIds = new Set(answers.map(answer => answer.questionId ?? ''))
  const answerBusy = review.busy || review.session.attempts >= 6
  const showJourney = hasDiagnosis && !locked && !readOnly

  function openQuestion(question: ActiveReviewQuestion) {
    setPanel('requirements')
    setActiveQuestion(question)
    setFocusTarget('review-focused-questions')
  }

  function skipQuestion(questionId: string) {
    const next = [...skippedQuestions, questionId]
    setSkippedQuestions(next)
    try {
      localStorage.setItem(skipKey, JSON.stringify(next))
    } catch {
      // Keep the skip in this open review when browser storage is unavailable.
    }
    openEdits()
    setFocusTarget('review-edit-list')
  }

  function continueClarification(answer: ReviewAnswer) {
    openQuestion({
      questionId: `followup-${answer.id}`,
      requirementId: answer.requirementId,
      text: answer.delta.nextQuestion,
      initialAnswer: answer.text + '\nAdditional detail: ',
    })
  }

  function questionRequirement(question: EvidenceQuestion) {
    const answeredRequirement = question.answers.at(-1)?.requirementId
    if (answeredRequirement && requirements.some(item => item.requirementId === answeredRequirement)) return answeredRequirement
    return question.requirementIds.find(id => requirements.some(item => item.requirementId === id))
  }

  function renderQuestion(question: EvidenceQuestion, compact = false, featured?: PriorityEvidenceQuestion) {
    const linkedPriorities = priorities.filter(item => question.requirementIds.includes(item.id))
    const availablePriorities = question.requirementIds.length ? linkedPriorities : priorities
    const canAnswer = !!transport && availablePriorities.length > 0
    return (
      <EvidenceQuestionCard
        key={question.key}
        question={question}
        requirements={requirements}
        priorities={priorities}
        compact={compact && question.requirementIds.length === 1}
        featured={featured && {
          requirement: featured.requirement,
          followup: featured.followup,
          onExplore: () => setFocusTarget(`review-requirement-${featured.requirement.requirementId}`),
        }}
        skipped={skippedQuestions.includes(question.id)}
        excluded={excluded}
        answeredQuestionIds={answeredQuestionIds}
        busy={answerBusy}
        onAnswer={canAnswer ? () => openQuestion({
          questionId: question.id,
          requirementId: featured?.requirement.requirementId ?? (availablePriorities.length === 1 ? availablePriorities[0].id : ''),
          requirementIds: question.requirementIds,
          text: question.text,
        }) : undefined}
        onSkip={canAnswer ? () => skipQuestion(question.id) : undefined}
        onFollowup={transport ? continueClarification : undefined}
        onReviewEdit={openEdits}
      />
    )
  }

  const featuredQuestions = showJourney && transport && panel === 'requirements' && review.session.attempts < 6
    ? prioritizeEvidenceQuestions(
        questions,
        requirements.filter(requirement => priorities.some(priority => priority.id === requirement.requirementId)),
        result.jobRequirementProfile,
        new Set(skippedQuestions),
      )
    : []
  const selectedEditCount = edits.filter(edit => !excluded.has(edit.id)).length
  const originalsKept = [...excluded].filter(id => !answerEditIds.has(id)).length
  const exportBlocked = busy || review.busy || !!versionAction
  const finishLabel = canSave ? 'Save for this job' : 'Preview and download'
  const hasQuestionsPanel = hasDiagnosis || questions.length > 0 || !!(transport && eligible)
  return (
    <div className="space-y-6 text-slate-800">
      <ReportCard>
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-800">Your application review</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {result.analysisMode === 'resume_only' ? 'Your resume review' : 'Your fit for this role'}
          </h2>
          <p>{result.summary || verdict?.oneLineVerdict}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {verdict?.strongestSignal ? (
              <div className="border-l-2 border-teal-600 pl-4">
                <p className="text-sm font-semibold text-teal-900">Strongest evidence</p>
                <p>{verdict.strongestSignal}</p>
              </div>
            ) : null}
            {verdict?.mainConcern ? (
              <div className="border-l-2 border-amber-500 pl-4">
                <p className="text-sm font-semibold text-amber-900">Main concern</p>
                <p>{verdict.mainConcern}</p>
              </div>
            ) : null}
          </div>
          {previewAction ? (
            <div className="border-l-2 border-teal-600 pl-4">
              <p className="text-sm font-semibold text-teal-900">One thing to check before applying</p>
              <p>{previewAction}</p>
            </div>
          ) : null}
          {!locked ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={hasDiagnosis ? ui.button.secondary : ui.button.primary}
                onClick={() => {
                  if (edits.length) {
                    openEdits()
                    setFocusTarget('review-edit-list')
                  } else if (hasQuestionsPanel) setPanel('requirements')
                  else setPanel('use')
                }}
              >
                {edits.length
                  ? 'See suggested resume changes'
                  : hasQuestionsPanel
                    ? 'Review job evidence'
                    : finishLabel}
              </button>
              {hasDiagnosis && panel !== 'requirements' ? (
                <button
                  type="button"
                  className={ui.button.primary}
                  onClick={() => {
                    setPanel('requirements')
                    setFocusTarget('job-requirement-diagnosis')
                  }}
                >
                  View job match report
                </button>
              ) : null}
            </div>
          ) : null}
          <details className="border-t border-slate-200 pt-4">
            <summary className={reviewLink}>
              {scores[0] ? `${scores[0].label} ${scores[0].value}/100 · based on your submitted resume` : 'Submitted resume scores'}
            </summary>
            <div className="mt-3 flex flex-wrap gap-5">
              {scores.map((score) => (
                <div key={score.label}>
                  <p className={ui.results.text.label}>{score.label}</p>
                  <p className="text-xl font-semibold">{score.value}/100</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm">
              {referencePreview
                ? 'Previous analysis scores, shown for reference. This manually prepared report has not been rescored.'
                : 'Scores assess the submitted resume. Proposed edits and confirmed answers have not been rescored.'}
            </p>
            <ScoreDisclaimer />
          </details>
          {result.jobRequirementProfile?.hiddenExpectations?.length ||
          result.jobRequirementProfile?.niceToHaveSignals?.length ||
          result.scoreExplanation?.components?.length ||
          result.aiScreening?.scoreBreakdown?.length ? (
            <details className="border-t border-slate-200 pt-4">
              <summary className={reviewLink}>Scoring and reviewer context</summary>
              <div className="mt-3 space-y-4">
                <Lines
                  items={(result.jobRequirementProfile?.hiddenExpectations ?? []).map(
                    (item) => `Reviewer inference: ${item.expectation}`,
                  )}
                />
                <Lines
                  items={(result.jobRequirementProfile?.niceToHaveSignals ?? []).map(
                    (item) => `Preferred signal: ${item.signal}`,
                  )}
                />
                {result.scoreExplanation?.components?.map((component, index) => (
                  <p key={index}>
                    {component.label ?? component.title ?? component.key}: {component.score}/100 — {component.explanation}
                  </p>
                ))}
                {(result.aiScreening?.scoreBreakdown ?? []).map((component) => (
                  <p key={component.id}>
                    {component.label}: {component.score}/100 — {component.explanation}
                  </p>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      </ReportCard>

      {showJourney ? (
        <nav aria-label="Review sections">
          <ol aria-label="Application review progress" className="grid gap-3 rounded-xl border border-teal-200 bg-teal-50/60 p-3 sm:grid-cols-3 sm:gap-6 sm:p-4">
            {([
              ['requirements', 'Understand your fit'],
              ['edits', 'Tailor your resume'],
              ['use', finishLabel],
            ] as const).map(([step, label], index) => {
              const current = step === panel
              return (
                <li key={step} className="relative">
                  <button
                    type="button"
                    aria-current={current ? 'step' : undefined}
                    onClick={() => {
                      setPanel(step)
                      if (step === 'edits') setView('changes')
                    }}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 ${current ? 'border-teal-800 bg-teal-800 text-white' : 'border-teal-200 bg-white text-slate-800 hover:border-teal-600 hover:bg-teal-50'}`}
                  >
                    <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm ${current ? 'bg-white text-teal-900' : 'bg-teal-100 text-teal-900'}`}>{index + 1}</span>
                    <span>{label}</span>
                  </button>
                  {index < 2 ? (
                    <span aria-hidden="true" className="absolute -bottom-3.5 left-6 rotate-90 text-teal-700 sm:bottom-auto sm:left-auto sm:-right-5 sm:top-1/2 sm:-translate-y-1/2 sm:rotate-0">→</span>
                  ) : null}
                </li>
              )
            })}
          </ol>
        </nav>
      ) : (
        <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3" aria-label="Review sections">
          {(
            [
              ...(hasQuestionsPanel ? [['requirements', hasDiagnosis ? 'Job match report' : 'Requirements & questions']] : []),
              ['edits', `Suggested resume changes${locked ? '' : ` (${edits.length})`}`],
              ...(!locked ? [['use', finishLabel]] : []),
            ] as [typeof panel, string][]
          ).map(([id, label]) => (
            <button
              type="button"
              key={id}
              aria-pressed={panel === id}
              className={`rounded-full px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 ${panel === id ? 'bg-teal-800 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50'}`}
              onClick={() => setPanel(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {featuredQuestions.length ? (
        <ReportCard>
          <section aria-labelledby="priority-evidence-title" className="space-y-4">
            <h2 id="priority-evidence-title" className={ui.results.section.title}>Strengthen your application</h2>
            <p>Your resume may not tell the full story. These questions help uncover relevant experience that could strengthen your application.</p>
            <p className={ui.results.text.secondary}>Answer any question you choose. We’ll show what your answer establishes and let you review any proposed edit. Your original score stays the same.</p>
            <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
              {featuredQuestions.map(item => renderQuestion(item.question, false, item))}
            </div>
          </section>
        </ReportCard>
      ) : null}
      {panel === 'requirements' && hasDiagnosis ? (
        <ReportCard>
          <details open={!showJourney || !transport ? true : undefined}>
            <summary className={reviewLink}>Explore all job requirements</summary>
            <section id="job-requirement-diagnosis" tabIndex={-1} className="mt-4 scroll-mt-6">
              <h2 className={ui.results.section.title}>Job requirements</h2>
              <div className="mt-4">
                <JobRequirementDiagnosis
                  result={{ ...result, report }}
                  locked={locked}
                  renderEvidenceQuestions={(id) => {
                    const linked = questions.filter(question => questionRequirement(question) === id)
                    if (linked.length) return linked.map(question => {
                      const isFeatured = !question.answers.length && featuredQuestions.some(item => item.question === question)
                      return isFeatured ? (
                        <button type="button" key={question.key} className={reviewLink}
                          onClick={() => setFocusTarget(`priority-evidence-${question.key}`)}>
                          Go to evidence question
                        </button>
                      ) : renderQuestion(question, true)
                    })
                    if (transport && review.ready && priorities.some(item => item.id === id) &&
                      !questions.some(question => question.requirementIds.includes(id))) {
                      const priority = priorities.find(item => item.id === id)!
                      return (
                        <button type="button" className={reviewLink} disabled={answerBusy} onClick={() => openQuestion({
                          questionId: '',
                          requirementId: id,
                          text: `What experience can you confirm for this requirement: ${priority.priority}?`,
                        })}>
                          Add relevant experience
                        </button>
                      )
                    }
                    return null
                  }}
                  onReviewEdit={openEdits}
                  onReviewQuestions={() => setFocusTarget('review-focused-questions')}
                />
              </div>
            </section>
          </details>
        </ReportCard>
      ) : null}

      {locked ? (
        <ReportCard>
          <h2 className={ui.results.section.title}>Your full review is locked</h2>
          <p>Unlock this report to see the detailed analysis, suggested resume changes and relevant follow-up questions.</p>
        </ReportCard>
      ) : (
        <>
          {transport && (panel !== 'requirements' || review.error || review.session.lastError || review.session.pending || (!review.loading && !review.ready)) ? (
            <div className="rounded-lg border-l-2 border-teal-600 bg-teal-50/50 px-4 py-3 text-sm">
              <div className="space-y-2" role="status" aria-live="polite">
                {review.loading ? (
                  <p>Loading your saved review…</p>
                ) : review.working ? (
                  <p>Saving your review. Earlier edits remain unchanged.</p>
                ) : !review.ready ? (
                  <p>Your saved review is unavailable.</p>
                ) : review.error || review.session.lastError ? (
                  <p>Your earlier saved choices remain in use.</p>
                ) : (
                  <p>Your review is saved.</p>
                )}
                {review.error || review.session.lastError ? (
                  <p className="text-rose-800">{review.error || review.session.lastError}</p>
                ) : null}
                {review.session.pending ? (
                  <p>
                    An answer is being reviewed in the background. This review will update when the result arrives; you
                    can also return later.
                  </p>
                ) : null}
                {review.session.lastError && review.session.lastRequest ? (
                  <button
                    type="button"
                    className={reviewLink}
                    disabled={review.busy}
                    onClick={() => {
                      const request = review.session.lastRequest!
                      setPanel('requirements')
                      setActiveQuestion({
                        questionId: request.questionId,
                        requirementId: request.requirementId,
                        text: 'Review your answer and try again',
                        initialAnswer: request.answer,
                      })
                      setFocusTarget('review-focused-questions')
                    }}
                  >
                    Review the previous answer
                  </button>
                ) : null}
                {(!review.ready || review.error || review.session.lastError) && !review.loading ? (
                  <button
                    type="button"
                    className={reviewLink}
                    disabled={review.working}
                    onClick={() => void review.reload()}
                  >
                    Reload saved review
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          {panel === 'edits' ? (
            <section id="review-edit-list" tabIndex={-1} className="space-y-5 scroll-mt-6">
              <div role="status" className={answerNotice ? 'text-sm text-teal-900' : 'sr-only'}>
                {answerNotice}
              </div>
              <div>
                <h2 className={ui.results.section.title}>Suggested resume changes</h2>
                <p className="mt-2">
                  Compare suggested wording with your original resume. Keep the changes that accurately reflect your experience.
                </p>
              </div>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Passage view">
                <button
                  type="button"
                  className={view === 'changes' ? ui.button.primary : ui.button.secondary}
                  aria-pressed={view === 'changes'}
                  onClick={() => setView('changes')}
                >
                  Review changes
                </button>
                <button
                  type="button"
                  className={view === 'full' ? ui.button.primary : ui.button.secondary}
                  aria-pressed={view === 'full'}
                  onClick={() => setView('full')}
                >
                  Selected passages
                </button>
                {answerEditIds.size ? (
                  <button
                    type="button"
                    className={view === 'new' ? ui.button.primary : ui.button.secondary}
                    aria-pressed={view === 'new'}
                    onClick={() => setView('new')}
                  >
                    New from your answers ({answerEditIds.size})
                  </button>
                ) : null}
              </div>

              {view !== 'full' ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    {readOnly
                      ? 'This shared view shows suggested wording. Original comparisons and source excerpts are private.'
                      : 'Highlighting marks new wording. Review proposed additions from your answers before including them.'}
                  </p>
                  {!displayedEdits.length ? (
                    <ReportCard>
                      <p>
                        {view === 'new'
                          ? 'No new resume edits were added from your answers. Your earlier edits are still available under Review changes.'
                          : 'No useful wording changes were identified. Check requirements and questions for any remaining evidence to clarify.'}
                      </p>
                    </ReportCard>
                  ) : null}
                  {(allEdits ? displayedEdits : displayedEdits.slice(0, 3)).map((edit) => (
                    <ReportCard key={edit.id}>
                      <section id={`review-edit-${edit.id}`} tabIndex={-1} className="scroll-mt-6 space-y-3">
                        <h3 className={ui.results.text.cardTitle}>{edit.section}</h3>
                        <p className={ui.results.text.meta}>
                          {edit.operation === 'retain' ? 'Keep this passage' : edit.operation} ·{' '}
                          {answerEditIds.has(edit.id) ? 'New from your confirmed answer' : 'Based on your resume'}
                        </p>
                        <p>
                          {edit.operation === 'remove' && !excluded.has(edit.id)
                            ? (readOnly ? 'A passage is recommended for removal.' : 'Remove this passage; the original is available below.')
                            : readOnly
                              ? edit.after
                              : addedWords(edit.before, answerEditIds.has(edit.id) ? edit.after : chosenEditText(edit, excluded)).map((token, i) =>
                                token.changed ? (
                                  <mark key={i} className="bg-emerald-100 text-emerald-950">
                                    {token.text}
                                  </mark>
                                ) : (
                                  token.text
                                ),
                              )}
                        </p>
                        {!readOnly ? (
                          <details>
                            <summary className={reviewLink}>
                              {edit.before ? 'Compare with original' : 'New passage'}
                            </summary>
                            <p className="mt-2 whitespace-pre-wrap">
                              {edit.before || 'No original passage is replaced.'}
                            </p>
                          </details>
                        ) : null}
                        <p>
                          <strong>Why this helps:</strong> {edit.reason}
                        </p>
                        {!readOnly && edit.insertAfter ? (
                          <details>
                            <summary className={reviewLink}>Placement</summary>
                            <p>Insert after: {edit.insertAfter}</p>
                          </details>
                        ) : null}
                        {!readOnly ? (
                          <details>
                            <summary className={reviewLink}>Source evidence</summary>
                            <Lines items={edit.sourceQuotes} />
                            <p>
                              {answerEditIds.has(edit.id)
                                ? 'Uses original resume context and your confirmed answer; not independently verified.'
                                : 'Supported by the supplied resume; not independently verified.'}
                            </p>
                          </details>
                        ) : null}
                        {answerEditIds.has(edit.id) ? (
                          <details>
                            <summary className={reviewLink}>Your supporting answer</summary>
                            <p>
                              {review.session.answers.find((answer) => answer.edit?.id === edit.id)?.delta.answerQuote}
                            </p>
                          </details>
                        ) : null}
                        {!readOnly && edit.operation !== 'retain' ? (
                          <button
                            disabled={review.busy}
                            type="button"
                            className={ui.button.secondary}
                            aria-pressed={excluded.has(edit.id)}
                            onClick={() => review.choose(edit.id)}
                          >
                            {answerEditIds.has(edit.id)
                              ? (excluded.has(edit.id) ? 'Include proposed edit' : 'Leave out proposed edit')
                              : (excluded.has(edit.id) ? 'Use proposed edit' : 'Keep original')}
                          </button>
                        ) : null}
                      </section>
                    </ReportCard>
                  ))}
                  {displayedEdits.length > 3 ? (
                    <button
                      type="button"
                      className={ui.button.secondary}
                      aria-expanded={allEdits}
                      onClick={() => setAllEdits(!allEdits)}
                    >
                      {allEdits ? 'Show fewer edits' : `Show all ${displayedEdits.length} edits`}
                    </button>
                  ) : null}
                </div>
              ) : (
                <ReportCard>
                  <div className="space-y-4">
                    <h2 className={ui.results.section.title}>Revised passages</h2>
                    <p>
                      Selected passages, not a complete replacement resume. Keep other distinct experience, education,
                      skills, dates, and contact details.
                    </p>
                    {(report.sections ?? []).map((section, index) => (
                      <section key={index} className="space-y-2">
                        <h3 className={ui.results.text.cardTitle}>{section.heading}</h3>
                        {sectionPassages(section, report, excluded).map((item) => (
                          <p className="whitespace-pre-wrap" key={item.key}>
                            {item.text}
                          </p>
                        ))}
                      </section>
                    ))}
                    {edits.some(
                      (edit) => excluded.has(edit.id) && (edit.operation === 'remove' || edit.operation === 'move'),
                    ) ? (
                      <section className="space-y-2">
                        <h3 className={ui.results.text.cardTitle}>Kept in original resume</h3>
                        {edits
                          .filter(
                            (edit) =>
                              excluded.has(edit.id) && (edit.operation === 'remove' || edit.operation === 'move'),
                          )
                          .map((edit) => (
                            <div key={edit.id}>
                              <p className={ui.results.text.label}>{edit.section}</p>
                              <p className="whitespace-pre-wrap">{edit.before}</p>
                            </div>
                          ))}
                      </section>
                    ) : null}
                  </div>
                </ReportCard>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                <p>Happy with these passages?</p>
                <button type="button" className={ui.button.primary} onClick={() => {
                  setPanel('use')
                  setFocusTarget('review-export')
                }}>
                  {finishLabel}
                </button>
              </div>
            </section>
          ) : null}

          {panel === 'edits' && !readOnly && questions.length ? (
            <ReportCard>
              <details>
                <summary className={reviewLink}>Evidence questions and answers</summary>
                <div className="mt-3 space-y-4">
                  {questions.map(question => renderQuestion(question))}
                </div>
              </details>
            </ReportCard>
          ) : null}

          {panel === 'use' ? (
            <ReportCard>
              <div id="review-export" tabIndex={-1} className="scroll-mt-6 space-y-3">
                <h2 className={ui.results.section.title}>Prepare your resume for this job</h2>
                <p>
                  {selectedEditCount} proposed {selectedEditCount === 1 ? 'passage' : 'passages'} selected · {originalsKept}{' '}
                  originals kept.
                </p>
                <p>Check names, dates and factual accuracy before sending your resume.</p>
                <details>
                  <summary className={reviewLink}>Preview selected passages</summary>
                  <p className="mt-2 whitespace-pre-wrap">
                    {selectedPassages || 'No revised passages selected.'}
                  </p>
                </details>
                {fullPreview?.key === previewKey ? (
                  <details open className="rounded-lg border border-slate-200 p-4">
                    <summary className={reviewLink}>Full resume preview</summary>
                    <TailoredResumePreview preview={fullPreview.preview} />
                  </details>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  {canSave ? (
                    <>
                      <button type="button" className={ui.button.primary} disabled={exportBlocked || !review.ready} onClick={saveVersion}>
                        {versionAction === 'save' ? 'Saving…' : 'Save for this job'}
                      </button>
                      <button type="button" className={ui.button.secondary} disabled={exportBlocked || !review.ready} onClick={previewVersion}>
                        {versionAction === 'preview' ? 'Preparing preview…' : 'Preview full resume'}
                      </button>
                    </>
                  ) : null}
                  <button type="button" className={ui.button.secondary} disabled={review.busy || !selectedPassages} onClick={copyPassages}>
                    Copy selected passages
                  </button>
                  <button
                    type="button"
                    className={canSave ? ui.button.secondary : ui.button.primary}
                    disabled={exportBlocked || readOnly || referencePreview || localPreview}
                    onClick={download}
                  >
                    {readOnly
                      ? 'Download available to report owner'
                      : referencePreview
                        ? 'Download unavailable in reference preview'
                        : localPreview
                          ? 'Download unavailable in test preview'
                          : busy
                            ? 'Preparing download…'
                            : 'Download reviewed resume'}
                  </button>
                </div>
                {copyStatus === 'copied' ? (
                  <p role="status" className="text-sm text-teal-900">Selected passages copied.</p>
                ) : copyStatus === 'manual' && selectedPassages ? (
                  <label className="block space-y-2 text-sm">
                    <span>Automatic copying was unavailable. Copy the selected text below.</span>
                    <textarea ref={copyField} value={selectedPassages} readOnly rows={4} className="w-full rounded border border-slate-300 p-2" />
                  </label>
                ) : !selectedPassages ? (
                  <p className={ui.results.text.meta}>Choose suggested wording to copy a passage.</p>
                ) : null}
                {versionError ? <p role="alert" className="text-sm text-red-800">{versionError}</p> : null}
                {canSave && versions.length ? (
                  <section className="space-y-3 border-t border-slate-200 pt-3">
                    <h3 className={ui.results.text.cardTitle}>Saved versions for this job</h3>
                    {rechecks?.rechecks.length && typeof getJobMatchScore(result) === 'number' ? (
                      <p className={ui.results.text.meta}>Original submitted resume · {getJobMatchScore(result)}/100</p>
                    ) : null}
                    <ul className="space-y-2">
                      {versions.map((version) => (
                        <li key={version.documentId} className="flex flex-wrap items-center gap-x-3">
                          <span>{version.fileName} · {new Date(version.uploadedAt).toLocaleString()}</span>
                          <button type="button" className={reviewLink} disabled={exportBlocked} onClick={async () => {
                            setVersionAction(version.documentId)
                            setVersionError('')
                            try {
                              await downloadTailoredResume(version)
                            } catch {
                              setVersionError('Could not download this saved version. Please try again.')
                            } finally {
                              setVersionAction('')
                            }
                          }}>
                            {versionAction === version.documentId ? 'Preparing…' : 'Download Word file'}
                          </button>
                          {rechecks && !rechecks.originalAnalysisId ? (
                            <RecheckVersionAction
                              analysisId={result.analysisId}
                              documentId={version.documentId}
                              recheck={rechecks.rechecks.find((item) => item.documentId === version.documentId)}
                            />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    <Link className={reviewLink} to="/app/resumes">Open My resumes</Link>
                  </section>
                ) : null}
                {readOnly ? (
                  <p className={ui.results.text.meta}>
                    Shared report view. Answer history and saved edit choices are available only to the report owner.
                  </p>
                ) : referencePreview ? (
                  <p className={ui.results.text.meta}>
                    You can compare and copy the reference edits. This preview is not connected to a saved analysis, so
                    downloading is disabled.
                  </p>
                ) : localPreview ? (
                  <p className={ui.results.text.meta}>
                    {sessionTransport
                      ? 'This fictional walkthrough saves choices and answers only in this browser. You can copy the selected passages; resume downloads are disabled.'
                      : 'This generated test report is not stored as an application analysis. Copy passages here; the source-preserving revised text is also saved with the test results.'}
                  </p>
                ) : (
                  <p className={ui.results.text.meta}>
                    Downloads apply your chosen edits to the original extracted text and preserve unedited content.
                    Paragraphs and lists are rebuilt from the uploaded file; original PDF styling is not retained.{' '}
                    {transport
                      ? 'Your edit choices and confirmed-answer additions are saved with this analysis.'
                      : 'Choices apply to this view and download.'}
                  </p>
                )}
              </div>
            </ReportCard>
          ) : null}

          {panel === 'edits' && report.outcomes ? (
            <ReportCard>
              <details>
                <summary className={reviewLink}>What these changes can improve</summary>
                <div className="space-y-3">
                  <p>
                    These outcomes describe the initial proposed edits. See the answer updates for new evidence and
                    remaining gaps. Keeping originals may leave the corresponding presentation issues unresolved.
                    Editing does not create new qualifications.
                  </p>
                  <h3 className={ui.results.text.cardTitle}>Clearer now</h3>
                  <Lines items={report.outcomes.clearerNow} />
                  <h3 className={ui.results.text.cardTitle}>Needs your confirmation</h3>
                  <Lines items={report.outcomes.needsConfirmation} />
                  <h3 className={ui.results.text.cardTitle}>Still unresolved</h3>
                  <Lines items={outcomes.required} />
                  {outcomes.optional.length ? (
                    <>
                      <h3 className={ui.results.text.cardTitle}>Optional enhancements</h3>
                      <p>These are preferred or additional signals, rather than required qualifications.</p>
                      <Lines items={outcomes.optional} />
                    </>
                  ) : null}
                </div>
              </details>
            </ReportCard>
          ) : null}

          {questions.length || (transport && eligible) ? (
            <div hidden={panel !== 'requirements'}>
              <ReportCard>
                <div id="review-focused-questions" tabIndex={-1} className="scroll-mt-6 space-y-3">
                  <h2 className={ui.results.section.title}>Strengthen this application</h2>
                  <p>
                    Your earlier edits are ready to review. Answer an optional, job-specific question to uncover
                    evidence those edits cannot add yet. “None” or “not sure” is useful too.
                  </p>
                  {activeQuestion && transport ? (
                    <ReviewAnswerForm
                      key={`${activeQuestion.questionId}:${activeQuestion.requirementId}`}
                      question={activeQuestion}
                      requirements={activeQuestion.requirementIds?.length
                        ? priorities.filter(item => activeQuestion.requirementIds?.includes(item.id))
                        : priorities}
                      busy={review.busy}
                      limitReached={review.session.attempts >= 6}
                      onClose={() => setActiveQuestion(null)}
                      onSubmit={async (input) => {
                        setAnswerNotice('')
                        const success = await review.answer(input)
                        if (success) setActiveQuestion(null)
                        return success
                      }}
                    />
                  ) : null}
                  {questions.filter(question => !hasDiagnosis || !questionRequirement(question))
                    .map(question => renderQuestion(question))}
                  {transport ? (
                    <p className={ui.results.text.meta}>
                      {review.session.attempts}/6 answer attempts used for this analysis. Scores still describe your
                      submitted resume.
                    </p>
                  ) : localPreview ? (
                    <p className={ui.results.text.meta}>
                      This saved-output preview is read-only for answers. The linked guided example demonstrates the
                      answer flow without making AI calls.
                    </p>
                  ) : null}
                </div>
              </ReportCard>
            </div>
          ) : null}
        </>
      )}

      <p role="status" aria-live="polite" className="text-sm text-teal-900">
        {notice}
      </p>
      {panel === 'edits' ? (
        <details className="space-y-3">
          <summary className={ui.button.secondary}>Resume checks</summary>
          <AtsChecksSection
            result={result}
            defaultExpanded
            title={referencePreview ? 'Checks from your previous analysis' : 'Resume checks and terminology'}
          />
        </details>
      ) : null}

      {!locked && panel === 'edits' ? (
        <>
          {(report.cleanup ?? [])
            .filter((item) => item.severity === 'high')
            .map((item, index) => (
              <ReportCard key={index}>
                <h2 className={ui.results.section.title}>Important remaining concern</h2>
                <p>{item.text}</p>
              </ReportCard>
            ))}
          {(report.cleanup ?? []).some((item) => item.severity !== 'high') || report.interviewPreparation?.length ? (
            <ReportCard>
              <details>
                <summary className={reviewLink}>Remaining cleanup and interview preparation</summary>
                <div className="mt-3 space-y-3">
                  <Lines
                    items={(report.cleanup ?? []).filter((item) => item.severity !== 'high').map((item) => item.text)}
                  />
                  <h3 className={ui.results.text.cardTitle}>Be ready to explain</h3>
                  <Lines items={report.interviewPreparation} />
                </div>
              </details>
            </ReportCard>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
