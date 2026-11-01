import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import type { ReviewAnswer } from '../../api/reviewSession'
import { ui } from '../../app/uiTokens'
import { reviewLink } from './reviewStyles'

export function evidenceLabel(status: string) {
  switch (status.toUpperCase()) {
    case 'STRONG':
      return 'Supported'
    case 'PARTIAL':
    case 'WEAK':
      return 'Partially supported'
    case 'MISSING':
      return 'Not established'
    default:
      return 'Needs review'
  }
}

export default function JobRequirementDiagnosis({
  result,
  locked,
  onReviewEdit,
  onReviewQuestions,
  onClarifyRequirement,
  answers = [],
}: {
  result: NormalizedAnalysis
  locked: boolean
  onReviewEdit: (id: string) => void
  onReviewQuestions: () => void
  onClarifyRequirement?: (id: string) => void
  answers?: ReviewAnswer[]
}) {
  const requirements = result.jobMatchScoring?.requirementScores ?? []
  const priorities = result.jobRequirementProfile?.topPriorities ?? []
  const hasQuestions = !locked && !!result.report?.questions?.length
  return (
    <div className="space-y-4">
      <p>{result.jobRequirementProfile?.recruiterIntentSummary}</p>
      <p>
        Based on the submitted resume. “Not established” means the resume does not demonstrate the requirement; it does
        not prove you lack the experience. Supported evidence can still leave duration or scope unconfirmed.
      </p>
      <div className="flex flex-wrap gap-3" aria-label="Requirement evidence overview">
        {['Supported', 'Partially supported', 'Not established', 'Needs review'].map((label) => {
          const count = requirements.filter((item) => evidenceLabel(item.matchStatus) === label).length
          return count ? (
            <span key={label} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-900">
              {count} {label.toLowerCase()}
            </span>
          ) : null
        })}
      </div>
      <ol className="space-y-4">
        {requirements.map((requirement) => {
          const priority = priorities.find((item) => item.id === requirement.requirementId)
          const optional =
            /\b(preferred|optional|nice[- ]to[- ]have)\b/i.test(requirement.requirement) ||
            /^N\d+$/.test(requirement.requirementId)
          const edits = locked
            ? []
            : (result.report?.edits ?? []).filter((edit) => edit.requirementIds.includes(requirement.requirementId))
          return (
            <li key={requirement.requirementId} className="space-y-4 border-b border-slate-200 py-5 last:border-0">
              <h3 className={ui.results.text.cardTitle}>{requirement.requirement}</h3>
              <p>
                <strong
                  className={
                    requirement.matchStatus.toUpperCase() === 'STRONG'
                      ? 'rounded bg-teal-50 px-2 py-1 text-sm text-teal-900'
                      : 'rounded bg-amber-50 px-2 py-1 text-sm text-amber-900'
                  }
                >
                  {evidenceLabel(requirement.matchStatus)}
                </strong>
                {optional ? ' · Preferred / optional' : null}
              </p>
              {priority?.whyItMatters ? (
                <details>
                  <summary className={reviewLink}>Why it matters</summary>
                  <p>{priority.whyItMatters}</p>
                </details>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <p>
                  <strong className="block text-sm text-teal-900">Evidence in your resume:</strong>{' '}
                  {requirement.evidence || 'No specific evidence was supplied in this diagnosis.'}
                </p>
                <p>
                  <strong className="block text-sm text-amber-900">What remains unclear or missing:</strong>{' '}
                  {requirement.gap || 'No additional gap was identified in this diagnosis.'}
                </p>
              </div>
              {edits.length ? (
                <div className="space-y-2">
                  <p>
                    <strong>Related resume edits</strong> · Wording changes do not establish missing experience.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {edits.map((edit) => (
                      <button type="button" key={edit.id} className={reviewLink} onClick={() => onReviewEdit(edit.id)}>
                        Review edit: {edit.section}
                        {edit.confirmedAnswerId ? ' (from your answer)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {!locked && onClarifyRequirement ? (
                <button
                  type="button"
                  className={reviewLink}
                  onClick={() => onClarifyRequirement(requirement.requirementId)}
                >
                  Clarify this requirement
                </button>
              ) : hasQuestions && requirement.matchStatus.toUpperCase() !== 'STRONG' ? (
                <button type="button" className={reviewLink} onClick={onReviewQuestions}>
                  Review focused questions
                </button>
              ) : null}
              {answers
                .filter((answer) => answer.requirementId === requirement.requirementId)
                .map((answer) => (
                  <div key={answer.id} className="space-y-1 border-l-2 border-teal-300 pl-3">
                    <p>
                      <strong>Answer update:</strong>{' '}
                      {answer.delta.establishes || 'No additional experience confirmed.'}
                    </p>
                    <p>Still unproven: {answer.delta.stillUnproven}</p>
                    <p className={ui.results.text.meta}>
                      Candidate-confirmed context; original evidence rating and score have not been recalculated.
                    </p>
                  </div>
                ))}
              <details>
                <summary className={reviewLink}>Scoring detail</summary>
                <p className="mt-2">
                  Submitted resume: {requirement.score}/100 · Weight {requirement.weight}%. This is not a score for the
                  proposed edits.
                </p>
                {priority?.evidenceExpected ? <p>Evidence expected: {priority.evidenceExpected}</p> : null}
              </details>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
