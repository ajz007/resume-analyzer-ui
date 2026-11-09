import type { ReactNode } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
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
  renderEvidenceQuestions,
}: {
  result: NormalizedAnalysis
  locked: boolean
  onReviewEdit: (id: string) => void
  onReviewQuestions: () => void
  renderEvidenceQuestions?: (id: string) => ReactNode
}) {
  const requirements = result.jobMatchScoring?.requirementScores ?? []
  const priorities = result.jobRequirementProfile?.topPriorities ?? []
  const hasUnlinkedQuestions = !locked && result.report?.questions?.some(question => !question.requirementIds?.length)
  return (
    <div className="space-y-4">

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
        {requirements.map((requirement, index) => {
          const priority = priorities.find((item) => item.id === requirement.requirementId)
          const optional =
            /\b(preferred|optional|nice[- ]to[- ]have)\b/i.test(requirement.requirement) ||
            /^N\d+$/.test(requirement.requirementId)
          const edits = locked
            ? []
            : (result.report?.edits ?? []).filter((edit) => !edit.confirmedAnswerId && edit.requirementIds.includes(requirement.requirementId))
          return (
            <li key={requirement.requirementId} id={`review-requirement-${requirement.requirementId}`} tabIndex={-1} className="scroll-mt-6 space-y-4 border-t border-slate-200 py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-800">
              <header className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-1 text-sm font-medium tabular-nums text-slate-500">{String(index + 1).padStart(2, '0')}</span>
                <div className="min-w-0 space-y-2">
                  <h3 className="text-base font-semibold leading-snug text-slate-950 sm:text-lg">{requirement.requirement}</h3>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className={`rounded-md px-2 py-1 font-medium ${requirement.matchStatus.toUpperCase() === 'STRONG'
                      ? 'bg-teal-50 text-teal-900'
                      : requirement.matchStatus.toUpperCase() === 'MISSING'
                        ? 'bg-amber-50 text-amber-900'
                        : 'bg-slate-100 text-slate-800'}`}>
                      {evidenceLabel(requirement.matchStatus)}
                    </span>
                    {optional ? <span>Preferred / optional</span> : null}
                  </p>
                </div>
              </header>
              <div className="grid gap-3 text-sm leading-relaxed sm:grid-cols-2 sm:gap-5">
                <div className="min-w-0 rounded-lg bg-slate-50 p-3">
                  <h4 className="mb-1 font-semibold text-slate-950">What your resume shows</h4>
                  <p>{requirement.evidence || 'No specific evidence was supplied in this diagnosis.'}</p>
                </div>
                <div className="min-w-0 rounded-lg bg-slate-50 p-3">
                  <h4 className="mb-1 font-semibold text-slate-950">What's still unclear</h4>
                  <p>{requirement.gap || 'No additional gap was identified in this diagnosis.'}</p>
                </div>
              </div>
              {!locked ? renderEvidenceQuestions?.(requirement.requirementId) : null}
              {hasUnlinkedQuestions && requirement.matchStatus.toUpperCase() !== 'STRONG' ? (
                <button type="button" className={reviewLink} onClick={onReviewQuestions}>
                  Review focused questions
                </button>
              ) : null}
              <details>
                <summary className={`${reviewLink} min-h-10 py-2`}>Scoring detail and related context</summary>
                <div className="mt-2 space-y-3 text-sm">
                  {priority?.whyItMatters ? <p><strong>Why it matters</strong> · {priority.whyItMatters}</p> : null}
                  <p>Submitted resume: {requirement.score}/100 · Rethink Resume scoring weight: {requirement.weight}%.</p>
                  {priority?.evidenceExpected ? <p>Evidence expected: {priority.evidenceExpected}</p> : null}
                  {edits.length ? (
                    <div className="space-y-2">
                      <p>Related resume changes · Wording changes do not establish missing experience.</p>
                      <ul className="space-y-1">
                        {edits.map(edit => (
                          <li key={edit.id}>
                            <button type="button" className={reviewLink} onClick={() => onReviewEdit(edit.id)}>
                              Review suggested change: {edit.section}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </details>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
