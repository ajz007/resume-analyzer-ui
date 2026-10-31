import { useEffect, useMemo, useRef, useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import { getAIScreeningScore, getATSScore, getJobMatchScore } from '../../analysis/reportScores'
import { addedWords, chosenEditText, revisedPassages, sectionPassages, questionFocus, unresolvedOutcomes } from '../../analysis/reviewEdits'
import { apiDownload } from '../../api/client'
import { triggerBrowserDownload } from '../../api/resumes'
import { ui } from '../../app/uiTokens'
import { ReportCard } from '../results/ReportCard'
import AtsChecksSection from './AtsChecksSection'
import ScoreDisclaimer from './ScoreDisclaimer'
import JobRequirementDiagnosis from './JobRequirementDiagnosis'
import ReviewAnswerForm, { type ActiveReviewQuestion } from './ReviewAnswerForm'
import { reviewSessionApi, type ReviewSessionTransport } from '../../api/reviewSession'
import { useReviewSession } from '../../analysis/useReviewSession'

const Lines = ({ items }: { items?: string[] }) => items?.length
  ? <ul className="list-disc space-y-2 pl-5">{items.map((text, i) => <li key={i}>{text}</li>)}</ul>
  : <p>No additional items identified.</p>

export default function ReviewReportView({ result, referencePreview = false, localPreview = false, readOnly = false, sessionTransport }: { result: NormalizedAnalysis; referencePreview?: boolean; localPreview?: boolean; readOnly?: boolean; sessionTransport?: ReviewSessionTransport }) {
  const initialReport = result.report!
  const eligible = result.locked !== true && !!initialReport.edits && result.analysisMode !== 'resume_only' && !!result.jobRequirementProfile?.topPriorities?.length
  const transport = useMemo(() => readOnly ? null : sessionTransport ?? (eligible && !localPreview && !referencePreview ? reviewSessionApi(result.analysisId) : null), [readOnly, sessionTransport, eligible, localPreview, referencePreview, result.analysisId])
  const review = useReviewSession(initialReport, transport)
  const report = review.report
  const [activeQuestion, setActiveQuestion] = useState<ActiveReviewQuestion | null>(null)
  const [view, setView] = useState<'changes' | 'full' | 'new'>('changes')
  const excluded = new Set(review.session.excludedIds)
  const answerEditIds = new Set(review.session.answers.flatMap(answer => answer.edit ? [answer.edit.id] : []))
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [allQuestions, setAllQuestions] = useState(false)
  const [allEdits, setAllEdits] = useState(false)
  const [diagnosisOpen, setDiagnosisOpen] = useState(false)
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
  const initialEdits = edits.filter(edit => !answerEditIds.has(edit.id))
  const displayedEdits = view === 'new' ? edits.filter(edit => answerEditIds.has(edit.id)) : edits
  const editMap = new Map(edits.map(edit => [edit.id, edit]))
  const locked = result.locked === true || !report.edits
  const verdict = result.aiScreening?.aiRecruiterVerdict
  const scores = [
    ...(result.analysisMode === 'resume_only' ? [] : [{ label: 'Job match', value: getJobMatchScore(result) }]),
    { label: 'ATS readiness', value: getATSScore(result) },
    { label: 'AI screening readiness', value: getAIScreeningScore(result) },
  ].filter(item => typeof item.value === 'number')

  async function copyPassages() {
    try {
      await navigator.clipboard.writeText(revisedPassages(report, excluded))
      setNotice('Selected revised passages copied. Keep the rest of your resume.')
    } catch { setNotice('Copy was unavailable. You can select and copy the passages below.') }
  }
  async function download() {
    setBusy(true)
    setNotice('')
    try {
      const response = await apiDownload(`/analyses/${encodeURIComponent(result.analysisId)}/reviewed-resume`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editIds: edits.filter(edit => !excluded.has(edit.id)).map(edit => edit.id), reviewVersion: review.session.version }),
      })
      triggerBrowserDownload(await response.blob(), 'reviewed-resume.docx')
      setNotice('Downloaded using your chosen edits and the remaining extracted resume text.')
    } catch { setNotice('The download could not be completed. Your reviewed passages remain available below.') }
    finally { setBusy(false) }
  }
  const previousAnswerCount = useRef<number | null>(null)
  const questions = (report.questions ?? []).filter(question => !review.session.answers.some(answer => answer.questionId === question.id || (question.requirementIds?.length === 1 && question.requirementIds[0] === answer.requirementId)))
  useEffect(() => {
    if (review.loading || !review.ready) return
    if (previousAnswerCount.current !== null && review.session.answers.length > previousAnswerCount.current) {
      setView('new'); setAllEdits(true); setActiveQuestion(null)
      setNotice('Answer recorded. Your earlier edits and choices remain.')
      setFocusTarget('review-answer-updates')
    }
    previousAnswerCount.current = review.session.answers.length
  }, [review.loading, review.ready, review.session.answers.length])
 const outcomes = unresolvedOutcomes(report)

  return <div className="space-y-5">
    <ReportCard>
      <div className="space-y-3">
        <h2 className={ui.results.section.title}>{result.analysisMode === 'resume_only' ? 'Your resume review' : 'Your fit for this role'}</h2>
        <p>{result.summary || verdict?.oneLineVerdict}</p>
        {verdict?.strongestSignal ? <p><strong>Strongest evidence:</strong> {verdict.strongestSignal}</p> : null}
        {verdict?.mainConcern ? <p><strong>Main concern:</strong> {verdict.mainConcern}</p> : null}
        <div className="flex flex-wrap gap-5">{scores.map(score => <div key={score.label}><p className={ui.results.text.label}>{score.label}</p><p className="text-2xl font-semibold">{score.value}/100</p></div>)}</div>
        <p className={ui.results.text.meta}>{referencePreview ? 'These are your previous analysis scores, shown for reference. This manually prepared report has not been rescored.' : 'Scores assess the submitted resume. Proposed edits have not been rescored.'}</p>
        <ScoreDisclaimer />
        {hasDiagnosis ? <button type="button" className={ui.button.secondary} aria-expanded={diagnosisOpen} aria-controls="job-requirement-diagnosis" onClick={() => setDiagnosisOpen(!diagnosisOpen)}>See how you match this job</button> : null}
      </div>
    </ReportCard>

    {hasDiagnosis ? <ReportCard><details id="job-requirement-diagnosis" open={diagnosisOpen} onToggle={event => setDiagnosisOpen(event.currentTarget.open)}><summary className={ui.results.link}>Job requirement diagnosis</summary><div className="mt-4"><JobRequirementDiagnosis result={{ ...result, report }} locked={locked} answers={review.session.answers} onClarifyRequirement={transport && !review.busy && review.session.attempts < 6 ? id => {
      const requirement = result.jobRequirementProfile?.topPriorities?.find(item => item.id === id)
      if (requirement) { setActiveQuestion({ questionId: '', requirementId: id, text: `What experience can you confirm for: ${requirement.priority}?` }); setFocusTarget('review-focused-questions') }
    } : undefined} onReviewEdit={id => { setView('changes'); setAllEdits(true); setFocusTarget(`review-edit-${id}`) }} onReviewQuestions={() => { setAllQuestions(true); setFocusTarget('review-focused-questions') }} /></div></details></ReportCard> : null}

    {report.priorities.length ? <ReportCard><h2 className={ui.results.section.title}>Where to focus</h2><ol className="list-decimal space-y-3 pl-5">{report.priorities.map((priority, index) => <li key={index}><strong>{priority.title}</strong><p>{priority.reason}</p>{!locked ? <div className="flex flex-wrap gap-3">{priority.editIds.map(id => <a key={id} className={ui.results.link} href={`#review-edit-${id}`} onClick={() => { setView('changes'); setAllEdits(true) }}>Review {editMap.get(id)?.section ?? 'edit'}</a>)}</div> : null}</li>)}</ol></ReportCard> : null}

    {locked ? <ReportCard><h2 className={ui.results.section.title}>Your full review is locked</h2><p>Unlock this report to see finished edits, revised passages, supporting evidence, and focused questions.</p></ReportCard> : <>
      {transport ? <ReportCard><div className="space-y-3" role="status" aria-live="polite">
        {review.loading ? <p>Loading your saved review…</p> : review.working ? <p>Saving your review. Earlier edits remain unchanged.</p> : <p>Your first {initialEdits.length} {initialEdits.length === 1 ? 'edit remains' : 'edits remain'} available. Answers add evidence only when there is something useful to add.</p>}
        {review.error || review.session.lastError ? <p>{review.error || review.session.lastError}</p> : null}
        {review.session.pending ? <p>An answer is being reviewed in the background. This review will update when the result arrives; you can also return later.</p> : null}
        {review.session.lastError && review.session.lastRequest ? <button type="button" className={ui.results.link} disabled={review.busy} onClick={() => {
          const request = review.session.lastRequest!
          setActiveQuestion({ questionId: request.questionId, requirementId: request.requirementId, text: 'Review your answer and try again', initialAnswer: request.answer }); setFocusTarget('review-focused-questions')
        }}>Review the previous answer</button> : null}
        <button type="button" className={ui.results.link} disabled={review.loading || review.working} onClick={() => void review.reload()}>Reload saved review</button>
      </div></ReportCard> : null}
      {review.session.answers.length ? <ReportCard><div id="review-answer-updates" tabIndex={-1} className="scroll-mt-6 space-y-4"><h2 className={ui.results.section.title}>What your answers changed</h2><p>Your earlier edits and keep-original choices remain. New evidence is self-reported and has not been independently verified.</p>
        {[...review.session.answers].reverse().map(answer => <section key={answer.id} className="space-y-2 border-t border-slate-200 pt-3"><p><strong>{result.jobRequirementProfile?.topPriorities?.find(item => item.id === answer.requirementId)?.priority ?? answer.requirementId}</strong></p><details><summary className={ui.results.link}>Your answer</summary><p>{answer.question}</p><p className="whitespace-pre-wrap">{answer.text}</p></details><p>{answer.delta.explanation}</p><p><strong>What this establishes:</strong> {answer.delta.establishes || 'No additional experience confirmed.'}</p><p><strong>Still unproven:</strong> {answer.delta.stillUnproven}</p>
          {answer.edit ? <button type="button" className={ui.results.link} onClick={() => { setView('new'); setAllEdits(true); setFocusTarget(`review-edit-${answer.edit!.id}`) }}>Review new edit</button> : <p>No resume edit was added.</p>}
          {answer.delta.nextQuestion && transport ? <button type="button" className={ui.results.link} disabled={review.busy || review.session.attempts >= 6} onClick={() => { setActiveQuestion({ questionId: `followup-${answer.id}`, requirementId: answer.requirementId, text: answer.delta.nextQuestion, initialAnswer: answer.text + '\nAdditional detail: ' }); setFocusTarget('review-focused-questions') }}>Clarify the remaining detail</button> : null}
        </section>)}
        <button type="button" className={ui.button.secondary} onClick={() => { setView('changes'); setAllEdits(true) }}>Review all {edits.length} edits</button>
      </div></ReportCard> : null}
      <div className="flex flex-wrap gap-3" role="group" aria-label="Report view">
        <button type="button" className={view === 'changes' ? ui.button.primary : ui.button.secondary} aria-pressed={view === 'changes'} onClick={() => setView('changes')}>Review changes</button>
        <button type="button" className={view === 'full' ? ui.button.primary : ui.button.secondary} aria-pressed={view === 'full'} onClick={() => setView('full')}>Full revised report</button>
        {answerEditIds.size ? <button type="button" className={view === 'new' ? ui.button.primary : ui.button.secondary} aria-pressed={view === 'new'} onClick={() => setView('new')}>New from your answers ({answerEditIds.size})</button> : null}
      </div>

      {view !== 'full' ? <div className="space-y-4">
        <p>Your first edits clarify facts already in your resume. Missing evidence needs your input below. New edits from answers are labeled separately. Highlighting marks new wording; you can keep the original for any edit.</p>
        {!displayedEdits.length ? <ReportCard><p>{view === 'new' ? 'No new resume edits were added from your answers. Your earlier edits are still available under Review changes.' : 'No useful wording changes were identified. Review the remaining questions and gaps below.'}</p></ReportCard> : null}
        {(allEdits ? displayedEdits : displayedEdits.slice(0, 3)).map(edit => <ReportCard key={edit.id}><section id={`review-edit-${edit.id}`} tabIndex={-1} className="scroll-mt-6 space-y-3">
          <h3 className={ui.results.text.cardTitle}>{edit.section}</h3>
          <p className={ui.results.text.meta}>{edit.operation === 'retain' ? 'Keep this passage' : edit.operation} · {answerEditIds.has(edit.id) ? 'New from your confirmed answer' : 'Based on your resume'}</p>
          <p>{edit.operation === 'remove' && !excluded.has(edit.id) ? 'Remove this passage; the original is available below.' : addedWords(edit.before, chosenEditText(edit, excluded)).map((token, i) => token.changed ? <mark key={i} className="bg-emerald-100 text-emerald-950">{token.text}</mark> : token.text)}</p>
          <details><summary className={ui.results.link}>{edit.before ? 'Compare with original' : 'New passage'}</summary><p className="mt-2 whitespace-pre-wrap">{edit.before || 'No original passage is replaced.'}</p></details>
          <p><strong>Why:</strong> {edit.reason}</p>
          {edit.insertAfter ? <details><summary className={ui.results.link}>Placement</summary><p>Insert after: {edit.insertAfter}</p></details> : null}
          <details><summary className={ui.results.link}>Source evidence</summary><Lines items={edit.sourceQuotes} /><p>{answerEditIds.has(edit.id) ? 'Uses original resume context and your confirmed answer; not independently verified.' : 'Supported by the supplied resume; not independently verified.'}</p></details>
          {answerEditIds.has(edit.id) ? <details><summary className={ui.results.link}>Your supporting answer</summary><p>{review.session.answers.find(answer => answer.edit?.id === edit.id)?.delta.answerQuote}</p></details> : null}
          {!readOnly && edit.operation !== 'retain' ? <button disabled={review.busy} type="button" className={ui.button.secondary} aria-pressed={excluded.has(edit.id)} onClick={() => review.choose(edit.id)}>{excluded.has(edit.id) ? 'Use proposed edit' : 'Keep original'}</button> : null}
        </section></ReportCard>)}
        {displayedEdits.length > 3 ? <button type="button" className={ui.button.secondary} aria-expanded={allEdits} onClick={() => setAllEdits(!allEdits)}>{allEdits ? 'Show fewer edits' : `Show all ${displayedEdits.length} edits`}</button> : null}
      </div> : <ReportCard><div className="space-y-4">
        <h2 className={ui.results.section.title}>Revised passages</h2>
        <p>Selected passages, not a complete replacement resume. Keep other distinct experience, education, skills, dates, and contact details.</p>
        {(report.sections ?? []).map((section, index) => <section key={index} className="space-y-2"><h3 className={ui.results.text.cardTitle}>{section.heading}</h3>{sectionPassages(section, report, excluded).map(item => <p className="whitespace-pre-wrap" key={item.key}>{item.text}</p>)}</section>)}
        {edits.some(edit => excluded.has(edit.id) && (edit.operation === 'remove' || edit.operation === 'move')) ? <section className="space-y-2"><h3 className={ui.results.text.cardTitle}>Kept in original resume</h3>{edits.filter(edit => excluded.has(edit.id) && (edit.operation === 'remove' || edit.operation === 'move')).map(edit => <div key={edit.id}><p className={ui.results.text.label}>{edit.section}</p><p className="whitespace-pre-wrap">{edit.before}</p></div>)}</section> : null}
      </div></ReportCard>}

      <ReportCard><div className="space-y-3"><h2 className={ui.results.section.title}>Use your reviewed edits</h2><div className="flex flex-wrap gap-3"><button type="button" className={ui.button.secondary} onClick={copyPassages}>Copy selected passages</button><button type="button" className={ui.button.primary} disabled={busy || review.busy || readOnly || referencePreview || localPreview} onClick={download}>{readOnly ? 'Download available to report owner' : referencePreview ? 'Download unavailable in reference preview' : localPreview ? 'Download unavailable in test preview' : busy ? 'Preparing download…' : 'Download reviewed resume'}</button></div>{readOnly ? <p className={ui.results.text.meta}>Shared report view. Answer history and saved edit choices are available only to the report owner.</p> : referencePreview ? <p className={ui.results.text.meta}>You can compare and copy the reference edits. This preview is not connected to a saved analysis, so downloading is disabled.</p> : localPreview ? <p className={ui.results.text.meta}>{sessionTransport ? 'This fictional walkthrough saves choices and answers only in this browser. You can copy the selected passages; resume downloads are disabled.' : 'This generated test report is not stored as an application analysis. Copy passages here; the source-preserving revised text is also saved with the test results.'}</p> : <p className={ui.results.text.meta}>Downloads apply your chosen edits to the original extracted text and preserve unedited content. Paragraphs and lists are rebuilt from the uploaded file; original PDF styling is not retained. {transport ? 'Your edit choices and confirmed-answer additions are saved with this analysis.' : 'Choices apply to this view and download.'}</p>}<p role="status" aria-live="polite">{notice}</p></div></ReportCard>

      {report.outcomes ? <ReportCard><div className="space-y-3"><h2 className={ui.results.section.title}>After these edits</h2><p>These outcomes describe the initial proposed edits. See the answer updates for new evidence and remaining gaps. Keeping originals may leave the corresponding presentation issues unresolved. Editing does not create new qualifications.</p><h3 className={ui.results.text.cardTitle}>Clearer now</h3><Lines items={report.outcomes.clearerNow} /><h3 className={ui.results.text.cardTitle}>Needs your confirmation</h3><Lines items={report.outcomes.needsConfirmation} /><h3 className={ui.results.text.cardTitle}>Still unresolved</h3><Lines items={outcomes.required} />{outcomes.optional.length ? <><h3 className={ui.results.text.cardTitle}>Optional enhancements</h3><p>These are preferred or additional signals, rather than required qualifications.</p><Lines items={outcomes.optional} /></> : null}</div></ReportCard> : null}

      {questions.length || (transport && eligible) ? <ReportCard><div id="review-focused-questions" tabIndex={-1} className="scroll-mt-6 space-y-3"><h2 className={ui.results.section.title}>Strengthen this application</h2>
        <p>Your earlier edits are ready to review. Answer an optional, job-specific question to uncover evidence those edits cannot add yet. “None” or “not sure” is useful too.</p>
        {activeQuestion && transport ? <ReviewAnswerForm key={`${activeQuestion.questionId}:${activeQuestion.requirementId}`} question={activeQuestion} requirements={result.jobRequirementProfile?.topPriorities ?? []} busy={review.busy} limitReached={review.session.attempts >= 6} onClose={() => setActiveQuestion(null)} onSubmit={async input => {
          const success = await review.answer(input)
          if (success) { setNotice('Answer submitted. Your earlier edits and choices remain.'); setActiveQuestion(null) }
          return success
        }} /> : null}
        {!questions.length && transport ? <p>You have answered the current suggested questions. You can review the remaining gaps in the diagnosis and clarify another requirement if useful.</p> : null}
        {(allQuestions ? questions : questions.slice(0, 1)).map(question => <div key={question.id}><p><strong>{questionFocus(question.question)}</strong></p><p className={ui.results.text.secondary}>{question.why}</p>{questionFocus(question.question) !== question.question ? <details><summary className={ui.results.link}>More context</summary><p>{question.question}</p></details> : null}
          {transport ? <button type="button" className={ui.results.link} disabled={review.busy || review.session.attempts >= 6} onClick={() => setActiveQuestion({ questionId: question.id, requirementId: question.requirementIds?.length === 1 ? question.requirementIds[0] : '', text: question.question })}>Clarify this experience</button> : null}
        </div>)}
        {questions.length > 1 ? <button type="button" className={ui.results.link} aria-expanded={allQuestions} onClick={() => setAllQuestions(!allQuestions)}>{allQuestions ? 'Show only the next question' : `Show ${questions.length - 1} optional questions`}</button> : null}
        {transport ? <p className={ui.results.text.meta}>{review.session.attempts}/6 answer attempts used for this analysis. Scores still describe your submitted resume.</p> : localPreview ? <p className={ui.results.text.meta}>This saved-output preview is read-only for answers. The linked guided example demonstrates the answer flow without making AI calls.</p> : null}
      </div></ReportCard> : null}
    </>}

    <ReportCard><details><summary className={ui.results.link}>Score explanations and reviewer context</summary><div className="mt-3 space-y-4">
      {result.jobRequirementProfile?.recruiterIntentSummary ? <p>{result.jobRequirementProfile.recruiterIntentSummary}</p> : null}
      <Lines items={(result.jobRequirementProfile?.hiddenExpectations ?? []).map(item => `Reviewer inference: ${item.expectation}`)} />
      <Lines items={(result.jobRequirementProfile?.niceToHaveSignals ?? []).map(item => `Preferred signal: ${item.signal}`)} />
      {result.scoreExplanation?.components?.map((component, index) => <p key={index}>{component.label ?? component.title ?? component.key}: {component.score}/100 — {component.explanation}</p>)}
      {(result.aiScreening?.scoreBreakdown ?? []).map(component => <p key={component.id}>{component.label}: {component.score}/100 — {component.explanation}</p>)}
    </div></details></ReportCard>
    <details className="space-y-3"><summary className={ui.button.secondary}>Resume checks and terminology</summary><AtsChecksSection result={result} defaultExpanded={false} title={referencePreview ? 'Checks from your previous analysis' : 'Resume checks and terminology'} /></details>

    {!locked ? <>
      {(report.cleanup ?? []).filter(item => item.severity === 'high').map((item, index) => <ReportCard key={index}><h2 className={ui.results.section.title}>Important remaining concern</h2><p>{item.text}</p></ReportCard>)}
      <ReportCard><details><summary className={ui.results.link}>Remaining cleanup and interview preparation</summary><div className="mt-3 space-y-3"><Lines items={(report.cleanup ?? []).filter(item => item.severity !== 'high').map(item => item.text)} /><h3 className={ui.results.text.cardTitle}>Be ready to explain</h3><Lines items={report.interviewPreparation} /></div></details></ReportCard>
    </> : null}
  </div>
}
