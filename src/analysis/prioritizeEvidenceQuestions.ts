import type { JobRequirementProfile, RequirementScore } from '../api/types'
import type { ReviewAnswer } from '../api/reviewSession'
import type { EvidenceQuestion } from './evidenceQuestions'

export type PriorityEvidenceQuestion = {
  question: EvidenceQuestion
  requirement: RequirementScore
  followup?: ReviewAnswer
}

const importanceRank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }

function actionability(text: string) {
  if ((text.match(/\?/g)?.length ?? 0) > 1) return 0
  return /^(what|how|which|when|where|describe|tell me about)\b/i.test(text.trim()) ? 2 : 1
}

export function prioritizeEvidenceQuestions(
  questions: EvidenceQuestion[],
  requirements: RequirementScore[],
  profile: JobRequirementProfile | undefined,
  skipped: ReadonlySet<string>,
): PriorityEvidenceQuestion[] {
  const assessments = new Map(requirements.map(item => [item.requirementId, item]))
  const priorities = new Map(profile?.topPriorities?.map(item => [item.id, item]))
  const optional = new Set(profile?.niceToHaveSignals?.map(item => item.id))
  const answeredIds = new Set(questions.filter(item => item.answers.length).map(item => item.id))
  const candidates: (PriorityEvidenceQuestion & { rank: number[] })[] = []

  for (const question of questions) {
    const latest = question.answers.at(-1)
    const followup = latest?.delta.nextQuestion.trim() && !answeredIds.has(`followup-${latest.id}`)
      ? latest
      : undefined
    if (!followup && (question.answers.length || skipped.has(question.id))) continue

    const ids = followup ? [followup.requirementId] : question.requirementIds
    for (const id of ids) {
      const requirement = assessments.get(id)
      if (!requirement) continue
      const priority = priorities.get(id)
      const status = (requirement.matchStatus || priority?.resumeMatchStatus || '').toUpperCase()
      const partial = status === 'PARTIAL' || status === 'WEAK'
      const gap = partial || status === 'MISSING' ? 2 : status !== 'STRONG' && requirement.gap?.trim() ? 1 : 0
      candidates.push({
        question, requirement, followup,
        rank: [
          optional.has(id) ? 0 : 1,
          importanceRank[priority?.importance?.toUpperCase() ?? ''] ?? 0,
          gap,
          Number(partial && !!requirement.evidence?.trim()),
          actionability(followup?.delta.nextQuestion ?? question.text),
          Number(!!followup),
          requirement.weight || priority?.weight || 0,
        ],
      })
    }
  }

  candidates.sort((first, second) => {
    for (const [index, value] of first.rank.entries()) {
      const difference = second.rank[index] - value
      if (difference) return difference
    }
    return 0
  })
  const seen = new Set<string>()
  const selected: PriorityEvidenceQuestion[] = []
  for (const { question, requirement, followup } of candidates) {
    if (seen.has(question.key)) continue
    seen.add(question.key)
    selected.push({ question, requirement, followup })
    if (selected.length === 3) break
  }
  return selected
}
