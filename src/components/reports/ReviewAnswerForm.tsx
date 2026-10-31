import { useState } from 'react'
import type { JobPriority } from '../../api/types'
import type { ReviewAnswer } from '../../api/reviewSession'
import { ui } from '../../app/uiTokens'

export type ActiveReviewQuestion = { questionId: string; requirementId: string; text: string; initialAnswer?: string }

export default function ReviewAnswerForm({ question, requirements, busy, limitReached = false, onSubmit, onClose }: {
  question: ActiveReviewQuestion
  requirements: JobPriority[]
  busy: boolean
  limitReached?: boolean
  onSubmit: (answer: { requirementId: string; questionId: string; kind: ReviewAnswer['kind']; answer: string; confirmed: boolean }) => Promise<boolean>
  onClose: () => void
}) {
  const [requirementId, setRequirementId] = useState(question.requirementId)
  const [kind, setKind] = useState<ReviewAnswer['kind']>('experience')
  const [answer, setAnswer] = useState(question.initialAnswer ?? '')
  const [confirmed, setConfirmed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const requirement = requirements.find(item => item.id === requirementId)
  return <form className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4" onSubmit={async event => {
    event.preventDefault()
    const success = await onSubmit({ requirementId, questionId: question.questionId, kind, answer, confirmed })
    if (success) setSubmitted(true)
  }}>
    <h3 className={ui.results.text.cardTitle}>{question.text}</h3>
    <label className="block space-y-1"><span>Job requirement this answer addresses</span><select required disabled={busy || submitted || !!question.requirementId} className="w-full rounded border bg-white p-2" value={requirementId} onChange={event => setRequirementId(event.target.value)}><option value="">Choose a job requirement</option>{requirements.map(item => <option key={item.id} value={item.id}>{item.priority}</option>)}</select></label>
    {requirement ? <p className={ui.results.text.secondary}>Evidence to clarify: {requirement.evidenceExpected}</p> : null}
    <fieldset disabled={busy || submitted} className="space-y-2"><legend className="font-medium">What can you confirm?</legend>{([['experience', 'I have relevant experience to describe'], ['none', 'I have no relevant experience to add'], ['not_sure', 'I am not sure']] as const).map(([value, label]) => <label key={value} className="flex items-start gap-2"><input type="radio" name="review-answer-kind" value={value} checked={kind === value} onChange={() => setKind(value)} />{label}</label>)}</fieldset>
    {kind === 'experience' ? <label className="block space-y-1"><span>Your experience</span><textarea aria-label="Your experience" required minLength={20} maxLength={3000} rows={5} disabled={busy || submitted} className="w-full rounded border bg-white p-3" value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Describe what you personally did, the employer or project, and when. Include scope or results only if you can confirm them." /><span className="text-sm">{answer.length}/3000 characters. Personal projects and learning are useful too; identify them clearly.</span></label> : <p>This will record your response without adding experience or making a model call.</p>}
    <label className="flex items-start gap-2"><input type="checkbox" required checked={confirmed} disabled={busy || submitted} onChange={event => setConfirmed(event.target.checked)} />I confirm this response reflects my own experience. Any new resume wording must stay within these facts.</label>
    <p className={ui.results.text.meta}>Your first edits and keep-original choices will remain. An answer may result in an edit, a clarification question, or no change. Scores will not be recalculated.</p>
    {limitReached ? <p>This review has reached its six-answer limit. Your earlier edits and answers remain available.</p> : null}
    <div className="flex flex-wrap gap-3"><button type="submit" className={ui.button.primary} disabled={busy || submitted || limitReached || !requirementId || !confirmed}>{busy ? 'Reviewing your answer…' : submitted ? 'Answer recorded' : 'Use my answer'}</button><button type="button" className={ui.button.secondary} disabled={busy} onClick={onClose}>Return to review</button></div>
  </form>
}
