import { apiRequest } from './client'
import type { ReviewEdit, ReviewReport } from './reviewReport'

export type ReviewDelta = { action: 'add_evidence' | 'no_change' | 'needs_detail'; passage: string; section: string; insertAfter: string; sourceQuote: string; answerQuote: string; explanation: string; establishes: string; stillUnproven: string; nextQuestion: string }
export type ReviewAnswer = { id: string; requestId: string; requirementId: string; question: string; questionId?: string; text: string; kind: 'experience' | 'none' | 'not_sure'; createdAt: string; delta: ReviewDelta; edit?: ReviewEdit }
export type ReviewSession = { version: number; excludedIds: string[]; answers: ReviewAnswer[]; pending?: { requestId: string; startedAt: string }; attempts: number; lastError?: string; lastRequest?: ReviewAnswerRequest }
export type ReviewSessionResponse = { session: ReviewSession; report: ReviewReport }
export type ReviewAnswerRequest = { version: number; requestId: string; requirementId: string; questionId: string; kind: ReviewAnswer['kind']; answer: string; confirmed: boolean; excludedIds: string[] }
export type ReviewSessionTransport = { load: () => Promise<ReviewSessionResponse>; saveChoices: (version: number, excludedIds: string[]) => Promise<ReviewSessionResponse>; answer: (request: ReviewAnswerRequest) => Promise<ReviewSessionResponse> }

export function reviewSessionApi(analysisId: string): ReviewSessionTransport {
  const base = `/analyses/${encodeURIComponent(analysisId)}/review-session`
  const post = <T,>(path: string, method: string, body: unknown) => apiRequest<T>(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, { suppressToast: true })
  return {
    load: () => apiRequest<ReviewSessionResponse>(base, {}, { suppressToast: true }),
    saveChoices: (version, excludedIds) => post(base + '/choices', 'PUT', { version, excludedIds }),
    answer: request => post(base + '/answers', 'POST', request),
  }
}
