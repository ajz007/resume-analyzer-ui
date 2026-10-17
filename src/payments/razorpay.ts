import type { PaymentOrder, PaymentPrice } from '../api/types'

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

export type CheckoutSuccess = {
  orderId: string
  paymentId: string
  signature: string
}

type RazorpayHandlerResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  prefill?: { email?: string; name?: string }
  theme?: { color?: string }
  handler: (response: RazorpayHandlerResponse) => void
  modal?: { ondismiss?: () => void }
}

type RazorpayInstance = {
  open: () => void
  on: (event: 'payment.failed', cb: (response: { error?: { description?: string } }) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

let scriptPromise: Promise<void> | null = null

export const loadCheckoutScript = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Checkout needs a browser'))
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Could not load the payment form. Check your connection and try again.'))
    }
    document.body.appendChild(script)
  })
  return scriptPromise
}

export class CheckoutDismissedError extends Error {
  constructor() {
    super('Payment cancelled')
    this.name = 'CheckoutDismissedError'
  }
}

export const openCheckout = async (
  order: PaymentOrder,
  prefill?: { email?: string; name?: string },
): Promise<CheckoutSuccess> => {
  await loadCheckoutScript()
  const Razorpay = window.Razorpay
  if (!Razorpay) throw new Error('Payment form is unavailable')

  return new Promise<CheckoutSuccess>((resolve, reject) => {
    const instance = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'Rethink Resume',
      description: 'Full resume report unlock',
      prefill,
      theme: { color: '#1d4ed8' },
      handler: (response) =>
        resolve({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
      modal: { ondismiss: () => reject(new CheckoutDismissedError()) },
    })
    instance.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed. You have not been charged.'))
    })
    instance.open()
  })
}

/** INR for visitors who appear to be in India, USD for everyone else. */
export const defaultCurrency = (
  locale = typeof navigator !== 'undefined' ? navigator.language : '',
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
): PaymentPrice['currency'] => {
  if (timeZone === 'Asia/Kolkata' || timeZone === 'Asia/Calcutta') return 'INR'
  if (/-IN$/i.test(locale)) return 'INR'
  return 'USD'
}

export const formatPrice = (price: PaymentPrice): string =>
  new Intl.NumberFormat(price.currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: price.currency,
    maximumFractionDigits: price.amount % 100 === 0 ? 0 : 2,
  }).format(price.amount / 100)
