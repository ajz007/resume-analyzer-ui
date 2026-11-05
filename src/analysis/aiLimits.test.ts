import { describe, expect, it } from 'vitest'
import { aiLimitMessage, analysisFailure } from './aiLimits'

describe('AI safeguard messages', () => {
  it('preserves a safe code for polling failures without showing provider details', () => {
    const error = analysisFailure({ errorCode: 'AI_DAILY_BUDGET' })
    expect(error.code).toBe('AI_DAILY_BUDGET')
    expect(error.message).toContain('Your saved work is available')
    expect(error.message).not.toContain('50')
  })
  it('ignores unknown and inherited properties', () => {
    expect(aiLimitMessage('constructor')).toBeUndefined()
    expect(aiLimitMessage('UNTRUSTED_PROVIDER_ERROR')).toBeUndefined()
    expect(analysisFailure({ errorCode: 'UNTRUSTED_PROVIDER_ERROR' }).message).toBe('Analysis failed')
  })
})
