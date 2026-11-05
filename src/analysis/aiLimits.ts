const messages: Record<string, string> = {
  AI_DAILY_BUDGET: 'AI processing is temporarily unavailable. Your saved work is available. Please try again later.',
  AI_PAUSED: 'AI requests are temporarily paused. Your saved work is available. Please try again later.',
  AI_GUARD_UNAVAILABLE: 'AI requests are temporarily unavailable. Your saved work is available. Please try again later.',
  AI_INPUT_LIMIT: 'This request is too large for AI processing. Please shorten the resume, job description or instructions.',
  AI_OUTPUT_LIMIT: 'This request reached its AI response limit. Please shorten the input before trying again.',
  AI_ATTEMPT_LIMIT: 'This request reached its AI attempt limit. Please simplify the input before trying again.',
}

export function aiLimitMessage(code: unknown): string | undefined {
  return typeof code === 'string' && Object.hasOwn(messages, code) ? messages[code] : undefined
}

export function analysisFailure(payload: { errorCode?: string }): Error & { code?: string } {
  const message = aiLimitMessage(payload.errorCode)
  return Object.assign(new Error(message ?? 'Analysis failed'), { code: message ? payload.errorCode : undefined })
}
