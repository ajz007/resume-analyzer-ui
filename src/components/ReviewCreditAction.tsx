import { useCallback, useEffect, useRef, useState } from 'react'
import { getCreditCheckout, getReviewCredits } from '../api/reviewCredits'
import type { ReviewCreditBalance } from '../api/reviewCredits'
import type { ApiError } from '../api/client'
import { verifyPayment } from '../api/endpoints'
import type { PaymentPurchase } from '../api/endpoints'
import { recordConfirmedPurchase } from '../analytics/google'
import { CheckoutDismissedError, formatPrice, openCheckout } from '../payments/razorpay'
import { ui } from '../app/uiTokens'

const checkoutKey = 'rr-review-credit-checkout'
function savedCheckout(): string | null {
  try { return localStorage.getItem(checkoutKey) } catch { return null }
}
function saveCheckout(id: string | null) {
  try {
    if (id) localStorage.setItem(checkoutKey, id)
    else localStorage.removeItem(checkoutKey)
  } catch { /* The in-page reference still supports recovery. */ }
}

export default function ReviewCreditAction({ allowBuy, disabled, onUse }: {
  allowBuy: boolean
  disabled?: boolean
  onUse: () => Promise<void>
}) {
  const [balance, setBalance] = useState<ReviewCreditBalance>()
  const [checkoutId, setCheckoutId] = useState(savedCheckout)
  const [purchase, setPurchase] = useState<PaymentPurchase>()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const operation = useRef(false)
  const refresh = useCallback(async () => {
    try { setBalance(await getReviewCredits()) } catch { /* This offer is optional during rollout. */ }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  const clearCheckout = () => {
    saveCheckout(null)
    setCheckoutId(null)
    setPurchase(undefined)
  }

  const run = async (action: 'use' | 'buy' | 'check') => {
    if (operation.current) return
    operation.current = true
    setBusy(true)
    setMessage('')
    let confirmed = false
    try {
      if (action === 'use') {
        await onUse()
        await refresh()
        return
      }

      const id = checkoutId ?? crypto.randomUUID()
      saveCheckout(id)
      setCheckoutId(id)
      let state = await getCreditCheckout(id, action === 'buy' && !purchase?.order)
      if (action === 'buy' && state.state === 'ready' && state.order) {
        try {
          const proof = await openCheckout(state.order)
          try { await verifyPayment(proof) } catch { /* Read the durable state below. */ }
        } catch (err) {
          if (!(err instanceof CheckoutDismissedError)) throw err
        }
        state = await getCreditCheckout(id)
      }
      if (state.state === 'paid') {
        confirmed = true
        recordConfirmedPurchase(state.receipt)
        clearCheckout()
        await refresh()
        if (action === 'buy') {
          await onUse()
          await refresh()
        } else {
          setMessage('Payment confirmed. Your review credit is ready to use.')
        }
      } else if (state.state === 'refunded' || state.state === 'none') {
        clearCheckout()
        setMessage(state.state === 'refunded' ? 'This checkout was refunded.' : 'No completed checkout was found.')
      } else {
        setPurchase(state)
        setMessage(state.state === 'ready' ? 'You can resume the same checkout.' : 'Payment is still being confirmed. Check again before paying.')
      }
    } catch (err) {
      if ((err as ApiError)?.status === 404 && action === 'check') clearCheckout()
      setMessage(confirmed ? 'Payment confirmed. Your review credit is available if the review did not start.' : action === 'use'
        ? (err instanceof Error ? err.message : 'Could not use your credit. Try again.')
        : 'Could not confirm this checkout. Check its status before paying again.')
    } finally {
      operation.current = false
      setBusy(false)
    }
  }

  if (!balance || (!allowBuy && balance.available === 0 && !checkoutId)) return null

  const price = formatPrice({ amount: purchase?.order?.amount ?? balance.price, currency: balance.currency })
  return (
    <div className="space-y-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-slate-800">
      <p>{balance.available} paid review {balance.available === 1 ? 'credit' : 'credits'} available. Free previews are counted separately.</p>
      <div className="flex flex-wrap items-center gap-2">
        {balance.available > 0 ? (
          <button type="button" className={ui.button.primary} disabled={disabled || busy} onClick={() => void run('use')}>Use 1 review credit</button>
        ) : null}
        {checkoutId && purchase?.state !== 'ready' ? (
          <button type="button" className={ui.button.secondary} disabled={busy} onClick={() => void run('check')}>Check credit purchase</button>
        ) : allowBuy ? (
          <button type="button" className={ui.button.primary} disabled={disabled || busy} onClick={() => void run('buy')}>
            {purchase?.state === 'ready' ? `Resume checkout · ${price}` : `Buy 1 full review · ${price}`}
          </button>
        ) : null}
      </div>
      {message ? <p role="status">{message}</p> : null}
    </div>
  )
}
