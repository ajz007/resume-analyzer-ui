import { describe, expect, it } from 'vitest'
import type { JobPriority, RequirementScore } from '../api/types'
import type { ReviewAnswer } from '../api/reviewSession'
import { evidenceQuestions } from './evidenceQuestions'
import { prioritizeEvidenceQuestions } from './prioritizeEvidenceQuestions'

const question = (id: string, text = 'What did you personally do?', requirementIds = [id]) =>
  ({ id, question: text, requirementIds, why: '', editIds: [] })
const requirement = (id: string, matchStatus = '', evidence = '', gap = ''): RequirementScore =>
  ({ requirementId: id, requirement: id, matchStatus, evidence, gap, weight: 0, score: 0 })
const priority = (id: string, importance: string): JobPriority =>
  ({ id, importance, priority: id, weight: 0, resumeMatchStatus: '', evidenceExpected: '', whyItMatters: '' })
const saved = (id: string, nextQuestion = ''): ReviewAnswer => ({
  id: `answer-${id}`, requestId: id, questionId: id, requirementId: id, question: '', text: 'Confirmed.',
  kind: 'experience', createdAt: '',
  delta: {
    action: nextQuestion ? 'needs_detail' : 'no_change', nextQuestion,
    establishes: '', stillUnproven: '', explanation: '', section: '', passage: '', insertAfter: '', sourceQuote: '', answerQuote: '',
  },
})

describe('evidence question prioritization', () => {
  it('uses explicit importance and optional metadata without inferring importance from job wording', () => {
    const questions = evidenceQuestions(['optional', 'unknown', 'core'].map(id => question(id)), [])
    const profile = {
      isApplicable: true,
      topPriorities: [priority('core', 'HIGH')],
      niceToHaveSignals: [{ id: 'optional', signal: '', resumeMatchStatus: '', whyItMatters: '' }],
    }
    const requirements = [
      requirement('optional', 'MISSING'),
      { ...requirement('unknown', 'MISSING'), requirement: 'Must know tools' },
      { ...requirement('core', 'PARTIAL', 'Related experience'), requirement: 'Preferred tool experience' },
    ]
    expect(prioritizeEvidenceQuestions(questions, requirements, profile, new Set()).map(item => item.question.id))
      .toEqual(['core', 'unknown', 'optional'])
  })

  it('favors substantial gaps and specific questions about experience already in the resume', () => {
    const ids = ['supported', 'missing', 'vague', 'distributed']
    const questions = evidenceQuestions([
      question('supported'),
      question('missing'),
      question('vague', 'Do you have distributed-systems experience?'),
      question('distributed', 'What geographically distributed system did you personally help design, if any?'),
    ], [])
    const requirements = [
      requirement('supported', 'STRONG', 'Design ownership'),
      requirement('missing', 'MISSING'),
      ...ids.slice(2).map(id => requirement(id, 'PARTIAL', 'Kafka trading systems and automated failover.', 'Geographic distribution and design ownership.')),
    ]
    expect(prioritizeEvidenceQuestions(questions, requirements, undefined, new Set()).map(item => item.question.id))
      .toEqual(['distributed', 'vague', 'missing'])
  })

  it('keeps source order for ties, selects a multi-linked question once, and never fills missing slots', () => {
    const questions = evidenceQuestions([
      question('first', undefined, ['R1', 'R2']),
      question('second', undefined, ['R2']),
      question('unlinked', undefined, []),
    ], [])
    const requirements = ['R1', 'R2'].map(id => requirement(id))
    expect(prioritizeEvidenceQuestions(questions, requirements, undefined, new Set()).map(item => item.question.id))
      .toEqual(['first', 'second'])
    expect(prioritizeEvidenceQuestions(questions, [], undefined, new Set())).toEqual([])
  })

  it('keeps outstanding follow-ups eligible and retains skipped or completed questions outside the priority list', () => {
    const questions = ['completed', 'skipped', 'clarify', 'unanswered'].map(id => question(id))
    const answers = [saved('completed'), saved('clarify', 'What did you own?')]
    const requirements = questions.map(item => requirement(item.id))
    const cards = evidenceQuestions(questions, answers)
    const skipped = new Set(['skipped'])
    const ranked = prioritizeEvidenceQuestions(cards, requirements, undefined, skipped)
    expect(ranked.map(item => item.question.id)).toEqual(['clarify', 'unanswered'])
    expect(ranked[0].followup).toBe(answers[1])
    expect(cards).toHaveLength(4)
    expect(prioritizeEvidenceQuestions(evidenceQuestions(questions, [
      ...answers, { ...saved('followup-answer-clarify'), requirementId: 'clarify' },
    ]), requirements, undefined, skipped).map(item => item.question.id)).toEqual(['unanswered'])
  })
})
