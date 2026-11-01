import { describe, expect, it } from 'vitest'
import { buildFaqs } from './PricingPage'

const answer = (paywallEnabled: boolean, question: string) =>
  buildFaqs(paywallEnabled).find((faq) => faq.question === question)?.answer ?? ''

describe('buildFaqs', () => {
  it('does not infer free access from unavailable payment configuration', () => {
    const faqs = buildFaqs(null).map(faq => faq.answer).join(' ')
    expect(faqs).not.toContain('no credit card required')
    expect(faqs).toContain('does not mean paid features are free')
  })
  it('keeps early-access copy while the paywall is off', () => {
    expect(answer(false, 'Do I need a credit card?')).toContain('no credit card required')
    expect(answer(false, 'Will pricing change later?')).toContain('may introduce paid plans later')
  })

  it('describes paid report unlocks once the paywall is live', () => {
    expect(answer(true, 'Do I need a credit card?')).toContain('unlock the full report')
    expect(answer(true, 'Will pricing change later?')).toContain('one-time payment per report')
    expect(answer(true, 'Will pricing change later?')).not.toContain('may introduce paid plans later')
  })
})
