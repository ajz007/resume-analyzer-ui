import { describe, expect, it } from 'vitest'
import type { ReviewAnswer } from '../api/reviewSession'
import { evidenceQuestions } from './evidenceQuestions'

const questions = [
  { id: 'q1', question: 'What did you build?', why: '', editIds: [], requirementIds: ['R1', 'R2'] },
  { id: 'q2', question: 'How long did you use it?', why: '', editIds: [], requirementIds: ['R2'] },
]

const firstAnswer: ReviewAnswer = {
  id: 'a1', requestId: 'request1', requirementId: 'R2', questionId: 'q1', question: questions[0].question,
  text: 'I worked on the service.', kind: 'experience', createdAt: '',
  delta: {
    action: 'needs_detail', passage: '', section: '', insertAfter: '', sourceQuote: '', answerQuote: '',
    explanation: 'Clarify your contribution.', establishes: '', stillUnproven: 'Ownership', nextQuestion: 'Which part did you own?',
  },
}

describe('evidence questions', () => {
  it('keeps separate questions for the same requirement and preserves follow-up history', () => {
    const followup = {
      ...firstAnswer, id: 'a2', requestId: 'request2', questionId: 'followup-a1',
      question: 'Which part did you own?', text: 'I owned the data model.',
    }
    const cards = evidenceQuestions(questions, [firstAnswer, followup])
    expect(cards.map(card => [card.key, card.requirementIds, card.answers.map(answer => answer.id)])).toEqual([
      ['q1', ['R1', 'R2'], ['a1']],
      ['q2', ['R2'], []],
      ['followup-a1', ['R2'], ['a2']],
    ])
  })

  it('keeps legacy answers linked by matching question text and requirement, or in their own card', () => {
    const legacy = { ...firstAnswer, questionId: undefined }
    const independent = { ...legacy, id: 'a2', question: 'What experience can you confirm?' }
    expect(evidenceQuestions(questions, [legacy, independent]).map(card => [card.key, card.answers.length])).toEqual([
      ['q1', 1],
      ['q2', 0],
      ['a2', 1],
    ])
  })
})
