import { apiRequest } from './client'
import type { PaymentPurchase } from './endpoints'

export type ReviewCreditBalance = { available: number; price: number; currency: 'INR' }

export function getReviewCredits() {
  return apiRequest<ReviewCreditBalance>('/payments/review-credits', { method: 'GET' }, { suppressToast: true })
}
export function getCreditCheckout(id: string, create = false) {
  return apiRequest<PaymentPurchase>(`/payments/review-credits/${encodeURIComponent(id)}`, {
    method: create ? 'POST' : 'GET',
  }, { suppressToast: true })
}
export function unlockWithReviewCredit(id: string) {
  return apiRequest<void>(`/analyses/${encodeURIComponent(id)}/use-review-credit`, {
    method: 'POST',
  }, { suppressToast: true })
}
