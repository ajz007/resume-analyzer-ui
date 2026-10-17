import { describe, expect, it } from 'vitest'
import { defaultCurrency, formatPrice } from './razorpay'

describe('razorpay helpers', () => {
  it('defaults to INR for India and USD elsewhere', () => {
    expect(defaultCurrency('en-US', 'Asia/Kolkata')).toBe('INR')
    expect(defaultCurrency('en-IN', 'Europe/London')).toBe('INR')
    expect(defaultCurrency('en-US', 'America/New_York')).toBe('USD')
  })

  it('formats minor units as currency', () => {
    expect(formatPrice({ currency: 'USD', amount: 900 })).toBe('$9')
    expect(formatPrice({ currency: 'USD', amount: 1299 })).toBe('$12.99')
    expect(formatPrice({ currency: 'INR', amount: 49900 })).toBe('₹499')
  })
})
