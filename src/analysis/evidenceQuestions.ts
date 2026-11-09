import type { ReviewReport } from '../api/reviewReport'
import type { ReviewAnswer } from '../api/reviewSession'

export type EvidenceQuestion = {
  key: string
  id: string
  text: string
  why?: string
  requirementIds: string[]
  answers: ReviewAnswer[]
}

export function evidenceQuestions(questions: ReviewReport['questions'], answers: ReviewAnswer[]): EvidenceQuestion[] {
  const cards: EvidenceQuestion[] = (questions ?? []).map(question => ({
    key: question.id,
    id: question.id,
    text: question.question,
    why: question.why,
    requirementIds: question.requirementIds ?? [],
    answers: [],
  }))
  for (const answer of answers) {
    const card = cards.find(item => answer.questionId
      ? item.id === answer.questionId
      : item.text === answer.question && item.requirementIds.includes(answer.requirementId))
    if (card) {
      card.answers.push(answer)
    } else {
      cards.push({
        key: answer.questionId || answer.id,
        id: answer.questionId ?? '',
        text: answer.question,
        requirementIds: [answer.requirementId],
        answers: [answer],
      })
    }
  }
  return cards
}
