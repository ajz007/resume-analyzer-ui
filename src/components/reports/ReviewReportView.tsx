import { useEffect, useMemo, useRef, useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import { getAIScreeningScore, getATSScore, getJobMatchScore } from '../../analysis/reportScores'
import {
  addedWords,
  chosenEditText,
  revisedPassages,
  sectionPassages,
  questionFocus,
  unresolvedOutcomes,
} from '../../analysis/reviewEdits'
import { apiDownload } from '../../api/client'
import { triggerBrowserDownload } from '../../api/resumes'
import { ui } from '../../app/uiTokens'
import { reviewLink } from './reviewStyles'
import { ReportCard } from '../results/ReportCard'
import AtsChecksSection from './AtsChecksSection'
import ScoreDisclaimer from './ScoreDisclaimer'
import JobRequirementDiagnosis from './JobRequirementDiagnosis'
import ReviewAnswerForm, { type ActiveReviewQuestion } from './ReviewAnswerForm'
import { reviewSessionApi, type ReviewSessionTransport } from '../../api/reviewSession'
import { useReviewSession } from '../../analysis/useReviewSession'

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
}

// A new analysis or access mode must never inherit another review's answers or choices.
export default function ReviewReportView(props: ReviewProps) {
  return (
    <GuidedReview
      key={`${props.result.analysisId}:${!!props.result.locked}:${!props.result.report?.edits}:${!!props.readOnly}:${!!props.localPreview}:${!!props.referencePreview}`}
      {...props}
    />
  )
}

function GuidedReview({
  result,
  referencePreview = false,
  localPreview = false,
  readOnly = false,
  sessionTransport,
}: ReviewProps) {
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
  const report = review.report
  const [activeQuestion, setActiveQuestion] = useState<ActiveReviewQuestion | null>(null)
  const [view, setView] = useState<'changes' | 'full' | 'new'>('changes')
  const excluded = new Set(review.session.excludedIds)
  const answerEditIds = new Set(review.session.answers.flatMap((answer) => (answer.edit ? [answer.edit.id] : [])))
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [allQuestions, setAllQuestions] = useState(false)
  const [allEdits, setAllEdits] = useState(false)
  const [panel, setPanel] = useState<'edits' | 'requirements' | 'answers' | 'use'>('edits')
  const [focusTarget, setFocusTarget] = useState('')
  useEffect(() => {
    if (!focusTarget) return
    const element = document.getElementById(focusTarget)
    element?.focus()
    element?.scrollIntoView({ block: 'start' })
    setFocusTarget('')
  }, [focusTarget])
  const hasDiagnosis = result.analysisMode !== 'resume_only' && !!result.jobMatchScoring?.requirementScores?.length
  const edits = report.edits ?? []
  const initialEdits = edits.filter((edit) => !answerEditIds.has(edit.id))
  const displayedEdits = view === 'new' ? edits.filter((edit) => answerEditIds.has(edit.id)) : edits
  const editMap = new Map(edits.map((edit) => [edit.id, edit]))
  const locked = result.locked === true || !report.edits
  const verdict = result.aiScreening?.aiRecruiterVerdict
  const scores = [
    ...(result.analysisMode === 'resume_only' ? [] : [{ label: 'Job match', value: getJobMatchScore(result) }]),
    { label: 'ATS readiness', value: getATSScore(result) },
    { label: 'AI screening readiness', value: getAIScreeningScore(result) },
  ].filter((item) => typeof item.value === 'number')

  async function copyPassages() {
    try {
      await navigator.clipboard.writeText(revisedPassages(report, excluded))
      setNotice('Selected revised passages copied. Keep the rest of your resume.')
    } catch {
      setNotice('Copy was unavailable. Open Selected passages to select and copy the text.')
    }
  }
  async function download() {
    setBusy(true)
    setNotice('')
    try {
      const response = await apiDownload(`/analyses/${encodeURIComponent(result.analysisId)}/reviewed-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editIds: edits.filter((edit) => !excluded.has(edit.id)).map((edit) => edit.id),
          reviewVersion: review.session.version,
        }),
      })
      triggerBrowserDownload(await response.blob(), 'reviewed-resume.docx')
      setNotice('Downloaded using your chosen edits and the remaining extracted resume text.')
    } catch {
      setNotice('The download could not be completed. Your choices remain available in Ready edits.')
    } finally {
      setBusy(false)
    }
  }
  const previousAnswerCount = useRef<number | null>(null)
  const questions = (report.questions ?? []).filter(
    (question) =>
      !review.session.answers.some(
        (answer) =>
          answer.questionId === question.id ||
          (question.requirementIds?.length === 1 && question.requirementIds[0] === answer.requirementId),
      ),
  )
  useEffect(() => {
    if (review.loading || !review.ready) return
    if (previousAnswerCount.current !== null && review.session.answers.length > previousAnswerCount.current) {
      setPanel('answers')
      setView('new')
      setAllEdits(true)
      setActiveQuestion(null)
      setNotice('Answer recorded. Your earlier edits and choices remain.')
      setFocusTarget('review-answer-updates')
    }
    previousAnswerCount.current = review.session.answers.length
  }, [review.loading, review.ready, review.session.answers.length])
  const outcomes = unresolvedOutcomes(report)

  function openEdits(id?: string) {
    setPanel('edits')
    setView('changes')
    setAllEdits(true)
    if (id) setFocusTarget(`review-edit-${id}`)
  }
  function openQuestions() {
    setPanel('requirements')
    setAllQuestions(true)
    setFocusTarget('review-focused-questions')
  }
  const exportBlocked = busy || review.busy
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
          {!locked ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={ui.button.primary}
                onClick={() => {
                  if (edits.length) {
                    openEdits()
                    setFocusTarget('review-edit-list')
                  } else if (hasQuestionsPanel) setPanel('requirements')
                  else setPanel('use')
                }}
              >
                {edits.length
                  ? `Review ${edits.length} ready ${edits.length === 1 ? 'edit' : 'edits'}`
                  : hasQuestionsPanel
                    ? 'Review job evidence'
                    : 'Use your resume'}
              </button>
              {hasDiagnosis ? (
                <button
                  type="button"
                  className={reviewLink}
                  aria-controls="job-requirement-diagnosis"
                  onClick={() => setPanel('requirements')}
                >
                  See how you match this job
                </button>
              ) : null}
            </div>
          ) : null}
          <details className="border-t border-slate-200 pt-4">
            <summary className={reviewLink}>
              Submitted resume scores
              {scores[0] ? ` · ${scores[0].label} ${scores[0].value}/100` : ''}
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
        </div>
      </ReportCard>

      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3" aria-label="Review sections">
        {(
          [
            ['edits', `Ready edits${locked ? '' : ` (${edits.length})`}`],
            ...(hasQuestionsPanel ? [['requirements', 'Requirements & questions']] : []),
            ...(!readOnly && review.session.answers.length
              ? [['answers', `Answer updates (${review.session.answers.length})`]]
              : []),
            ...(!locked ? [['use', 'Use your resume']] : []),
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
      {panel === 'requirements' && hasDiagnosis ? (
        <ReportCard>
          <section id="job-requirement-diagnosis">
            <h2 className={ui.results.section.title}>Job requirements</h2>
            <div className="mt-4">
              <JobRequirementDiagnosis
                result={{ ...result, report }}
                locked={locked}
                answers={review.session.answers}
                onClarifyRequirement={
                  transport && !review.busy && review.session.attempts < 6
                    ? (id) => {
                        const requirement = result.jobRequirementProfile?.topPriorities?.find((item) => item.id === id)
                        if (requirement) {
                          setActiveQuestion({
                            questionId: '',
                            requirementId: id,
                            text: `What experience can you confirm for: ${requirement.priority}?`,
                          })
                          setFocusTarget('review-focused-questions')
                        }
                      }
                    : undefined
                }
                onReviewEdit={(id) => {
                  openEdits(id)
                }}
                onReviewQuestions={() => {
                  openQuestions()
                }}
              />
            </div>
          </section>
        </ReportCard>
      ) : null}

      {locked ? (
        <ReportCard>
          <h2 className={ui.results.section.title}>Your full review is locked</h2>
          <p>Unlock this report to see finished edits, revised passages, supporting evidence, and focused questions.</p>
        </ReportCard>
      ) : (
        <>
          {transport ? (
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
                  <p>
                    {initialEdits.length} initial {initialEdits.length === 1 ? 'edit' : 'edits'} available · Your review
                    is saved.
                  </p>
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
                <button
                  type="button"
                  className={reviewLink}
                  disabled={review.loading || review.working}
                  onClick={() => void review.reload()}
                >
                  Reload saved review
                </button>
              </div>
            </div>
          ) : null}
          {panel === 'answers' && review.session.answers.length ? (
            <ReportCard>
              <div id="review-answer-updates" tabIndex={-1} className="scroll-mt-6 space-y-4">
                <h2 className={ui.results.section.title}>What your answers changed</h2>
                <p>
                  Your earlier edits and keep-original choices remain. New evidence is self-reported and has not been
                  independently verified.
                </p>
                {[...review.session.answers].reverse().map((answer) => (
                  <section key={answer.id} className="space-y-2 border-t border-slate-200 pt-3">
                    <p>
                      <strong>
                        {result.jobRequirementProfile?.topPriorities?.find((item) => item.id === answer.requirementId)
                          ?.priority ?? answer.requirementId}
                      </strong>
                    </p>
                    <details>
                      <summary className={reviewLink}>Your answer</summary>
                      <p>{answer.question}</p>
                      <p className="whitespace-pre-wrap">{answer.text}</p>
                    </details>
                    <p>{answer.delta.explanation}</p>
                    <p>
                      <strong>What this establishes:</strong>{' '}
                      {answer.delta.establishes || 'No additional experience confirmed.'}
                    </p>
                    <p>
                      <strong>Still unproven:</strong> {answer.delta.stillUnproven}
                    </p>
                    {answer.edit ? (
                      <button
                        type="button"
                        className={reviewLink}
                        onClick={() => {
                          setPanel('edits')
                          setView('new')
                          setAllEdits(true)
                          setFocusTarget(`review-edit-${answer.edit!.id}`)
                        }}
                      >
                        Review new edit
                      </button>
                    ) : (
                      <p>No resume edit was added.</p>
                    )}
                    {answer.delta.nextQuestion && transport ? (
                      <button
                        type="button"
                        className={reviewLink}
                        disabled={review.busy || review.session.attempts >= 6}
                        onClick={() => {
                          setPanel('requirements')
                          setActiveQuestion({
                            questionId: `followup-${answer.id}`,
                            requirementId: answer.requirementId,
                            text: answer.delta.nextQuestion,
                            initialAnswer: answer.text + '\nAdditional detail: ',
                          })
                          setFocusTarget('review-focused-questions')
                        }}
                      >
                        Clarify the remaining detail
                      </button>
                    ) : null}
                  </section>
                ))}
                <button
                  type="button"
                  className={ui.button.secondary}
                  onClick={() => {
                    openEdits()
                  }}
                >
                  Review all {edits.length} edits
                </button>
              </div>
            </ReportCard>
          ) : null}
          {panel === 'edits' ? (
            <section id="review-edit-list" tabIndex={-1} className="space-y-5 scroll-mt-6">
              <div>
                <h2 className={ui.results.section.title}>Ready edits</h2>
                <p className="mt-2">
                  Start with wording supported by your resume. Keep any original you prefer; your choices carry through
                  to the download.
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
                    Highlighting marks new wording. Edits from confirmed answers are labeled separately.
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
                            ? 'Remove this passage; the original is available below.'
                            : addedWords(edit.before, chosenEditText(edit, excluded)).map((token, i) =>
                                token.changed ? (
                                  <mark key={i} className="bg-emerald-100 text-emerald-950">
                                    {token.text}
                                  </mark>
                                ) : (
                                  token.text
                                ),
                              )}
                        </p>
                        <details>
                          <summary className={reviewLink}>
                            {edit.before ? 'Compare with original' : 'New passage'}
                          </summary>
                          <p className="mt-2 whitespace-pre-wrap">
                            {edit.before || 'No original passage is replaced.'}
                          </p>
                        </details>
                        <p>
                          <strong>Why:</strong> {edit.reason}
                        </p>
                        {edit.insertAfter ? (
                          <details>
                            <summary className={reviewLink}>Placement</summary>
                            <p>Insert after: {edit.insertAfter}</p>
                          </details>
                        ) : null}
                        <details>
                          <summary className={reviewLink}>Source evidence</summary>
                          <Lines items={edit.sourceQuotes} />
                          <p>
                            {answerEditIds.has(edit.id)
                              ? 'Uses original resume context and your confirmed answer; not independently verified.'
                              : 'Supported by the supplied resume; not independently verified.'}
                          </p>
                        </details>
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
                            {excluded.has(edit.id) ? 'Use proposed edit' : 'Keep original'}
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
                <button type="button" className={ui.button.primary} onClick={() => setPanel('use')}>
                  Use your resume
                </button>
              </div>
            </section>
          ) : null}

          {panel === 'use' ? (
            <ReportCard>
              <div className="space-y-3">
                <h2 className={ui.results.section.title}>Use your reviewed edits</h2>
                <p>
                  {edits.filter((edit) => !excluded.has(edit.id)).length} proposed passages selected · {excluded.size}{' '}
                  originals kept.
                </p>
                <p>Check names, dates and factual accuracy before sending your resume.</p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className={ui.button.secondary} disabled={exportBlocked} onClick={copyPassages}>
                    Copy selected passages
                  </button>
                  <button
                    type="button"
                    className={ui.button.primary}
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
                <button
                  type="button"
                  className={reviewLink}
                  onClick={() => {
                    setPanel('edits')
                    setView('full')
                  }}
                >
                  Preview selected passages
                </button>
              </div>
            </ReportCard>
          ) : null}

          {panel === 'edits' && report.priorities.length ? (
            <ReportCard>
              <details>
                <summary className={reviewLink}>Why these edits matter</summary>
                <ol className="list-decimal space-y-3 pl-5">
                  {report.priorities.map((priority, index) => (
                    <li key={index}>
                      <strong>{priority.title}</strong>
                      <p>{priority.reason}</p>
                      {!locked ? (
                        <div className="flex flex-wrap gap-3">
                          {priority.editIds.map((id) => (
                            <a
                              key={id}
                              className={reviewLink}
                              href={`#review-edit-${id}`}
                              onClick={() => {
                                openEdits()
                              }}
                            >
                              Review {editMap.get(id)?.section ?? 'edit'}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </details>
            </ReportCard>
          ) : null}

          {panel === 'edits' && report.outcomes ? (
            <ReportCard>
              <details>
                <summary className={reviewLink}>What wording can and cannot improve</summary>
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
                      requirements={result.jobRequirementProfile?.topPriorities ?? []}
                      busy={review.busy}
                      limitReached={review.session.attempts >= 6}
                      onClose={() => setActiveQuestion(null)}
                      onSubmit={async (input) => {
                        const success = await review.answer(input)
                        if (success) {
                          setNotice('Answer submitted. Your earlier edits and choices remain.')
                          setActiveQuestion(null)
                        }
                        return success
                      }}
                    />
                  ) : null}
                  {!questions.length && transport ? (
                    <p>
                      You have answered the current suggested questions. You can review the remaining gaps in the
                      diagnosis and clarify another requirement if useful.
                    </p>
                  ) : null}
                  {(allQuestions ? questions : questions.slice(0, 1)).map((question) => (
                    <div key={question.id}>
                      <p>
                        <strong>{questionFocus(question.question)}</strong>
                      </p>
                      <p className={ui.results.text.secondary}>{question.why}</p>
                      {questionFocus(question.question) !== question.question ? (
                        <details>
                          <summary className={reviewLink}>More context</summary>
                          <p>{question.question}</p>
                        </details>
                      ) : null}
                      {transport ? (
                        <button
                          type="button"
                          className={reviewLink}
                          disabled={review.busy || review.session.attempts >= 6}
                          onClick={() =>
                            setActiveQuestion({
                              questionId: question.id,
                              requirementId: question.requirementIds?.length === 1 ? question.requirementIds[0] : '',
                              text: question.question,
                            })
                          }
                        >
                          Clarify this experience
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {questions.length > 1 ? (
                    <button
                      type="button"
                      className={reviewLink}
                      aria-expanded={allQuestions}
                      onClick={() => setAllQuestions(!allQuestions)}
                    >
                      {allQuestions ? 'Show only the next question' : `Show ${questions.length - 1} optional questions`}
                    </button>
                  ) : null}
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
      {result.jobRequirementProfile?.recruiterIntentSummary ||
      result.jobRequirementProfile?.hiddenExpectations?.length ||
      result.jobRequirementProfile?.niceToHaveSignals?.length ||
      result.scoreExplanation?.components?.length ||
      result.aiScreening?.scoreBreakdown?.length ? (
        <ReportCard>
          <details>
            <summary className={reviewLink}>Score explanations and reviewer context</summary>
            <div className="mt-3 space-y-4">
              {result.jobRequirementProfile?.recruiterIntentSummary ? (
                <p>{result.jobRequirementProfile.recruiterIntentSummary}</p>
              ) : null}
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
        </ReportCard>
      ) : null}
      <details className="space-y-3">
        <summary className={ui.button.secondary}>Resume checks and terminology</summary>
        <AtsChecksSection
          result={result}
          defaultExpanded={false}
          title={referencePreview ? 'Checks from your previous analysis' : 'Resume checks and terminology'}
        />
      </details>

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
