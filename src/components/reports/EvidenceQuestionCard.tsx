import type { EvidenceQuestion } from '../../analysis/evidenceQuestions'
import type { RequirementScore, JobPriority } from '../../api/types'
import type { ReviewAnswer } from '../../api/reviewSession'
import { ui } from '../../app/uiTokens'
import { reviewLink } from './reviewStyles'

type Props = {
  question: EvidenceQuestion
  requirements: RequirementScore[]
  priorities: JobPriority[]
  skipped: boolean
  compact?: boolean
  excluded: ReadonlySet<string>
  answeredQuestionIds: ReadonlySet<string>
  onAnswer?: () => void
  onSkip?: () => void
  onFollowup?: (answer: ReviewAnswer) => void
  onReviewEdit: (id: string) => void
  busy: boolean
}

export default function EvidenceQuestionCard({
  question, requirements, priorities, skipped, compact, excluded, answeredQuestionIds,
  onAnswer, onSkip, onFollowup, onReviewEdit, busy,
}: Props) {
  const latest = question.answers.at(-1)
  const hasEdit = !!latest?.edit
  const needsDetail = latest?.delta.action === 'needs_detail' || !!latest?.delta.nextQuestion
  const establishesEvidence = !!latest?.delta.establishes.trim()
  const status = hasEdit ? 'Suggested resume edit'
    : needsDetail ? 'Partially clarified'
      : establishesEvidence ? 'Evidence established'
        : latest ? 'Gap remains unresolved'
          : skipped ? 'Skipped for now' : 'Unanswered'
  const tone = hasEdit || establishesEvidence ? 'bg-teal-50 text-teal-900'
    : latest ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-700'
  const requirementIds = question.requirementIds.length ? question.requirementIds : latest ? [latest.requirementId] : []

  return (
    <article aria-label={question.text} className="space-y-3 rounded-lg border border-slate-200 p-4">
      <div className="space-y-2">
        <p className="font-semibold">{question.text}</p>
        <span className={`inline-block rounded px-2 py-1 text-sm font-medium ${tone}`}>{status}</span>
      </div>
      {!compact ? (
        <div className="space-y-2 text-sm">
          {requirementIds.length ? requirementIds.map(id => {
            const assessment = requirements.find(item => item.requirementId === id)
            const priority = priorities.find(item => item.id === id)
            return (
              <div key={id}>
                <p><strong>Requirement</strong> · {assessment?.requirement || priority?.priority || id}</p>
                <p><strong>Existing evidence</strong> · {assessment?.evidence || 'No specific resume evidence was recorded for this requirement.'}</p>
              </div>
            )
          }) : <p>This question is linked to a requirement when you answer it.</p>}
        </div>
      ) : null}
      {!latest && question.why ? <p className={ui.results.text.secondary}>{question.why}</p> : null}
      {!latest && onAnswer ? (
        <div className="flex flex-wrap gap-3">
          <button type="button" className={reviewLink} disabled={busy} onClick={onAnswer}>
            {skipped ? 'Revisit question' : 'Add relevant experience'}
          </button>
          {!skipped && onSkip ? (
            <button type="button" className={reviewLink} disabled={busy} onClick={onSkip}>Skip for now</button>
          ) : null}
        </div>
      ) : null}
      {question.answers.map(answer => {
        const editId = answer.edit?.id
        const followupId = `followup-${answer.id}`
        return (
          <details key={answer.id} className="border-t border-slate-200 pt-2">
            <summary className={reviewLink}>Answer and outcome</summary>
            <div className="mt-2 space-y-2 text-sm">
              <p className="whitespace-pre-wrap"><strong>Your answer</strong> · {answer.text}</p>
              {answer.delta.explanation && answer.delta.explanation !== answer.delta.establishes ? <p>{answer.delta.explanation}</p> : null}
              <p><strong>What this establishes</strong> · {answer.delta.establishes || 'No additional qualifying evidence was established by this answer.'}</p>
              {answer.delta.stillUnproven ? <p><strong>What remains unproven</strong> · {answer.delta.stillUnproven}</p> : null}
              <p><strong>Resume impact</strong> · {editId
                ? (excluded.has(editId) ? 'Proposed edit is outside your selected passages. Review it in Step 2.' : 'Proposed edit is included in your selected passages.')
                : 'No new resume change'}</p>
              {editId ? (
                <button type="button" className={reviewLink} onClick={() => onReviewEdit(editId)}>Review new edit</button>
              ) : null}
              {answer.delta.nextQuestion && !answeredQuestionIds.has(followupId) ? (
                <>
                  <p><strong>Follow-up</strong> · {answer.delta.nextQuestion}</p>
                  {onFollowup ? (
                    <button type="button" className={reviewLink} disabled={busy} onClick={() => onFollowup(answer)}>
                      Clarify the remaining detail
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </details>
        )
      })}
    </article>
  )
}
