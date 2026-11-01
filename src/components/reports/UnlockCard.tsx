import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPaymentOrder, fetchPaymentConfig, recoverPaymentPurchase, verifyPayment } from '../../api/endpoints'
import type { PaymentPurchase } from '../../api/endpoints'
import type { PaymentOrder, PaymentPrice } from '../../api/types'
import { LEGAL } from '../../constants/legal'
import { ui } from '../../app/uiTokens'
import { CheckoutDismissedError, defaultCurrency, formatPrice, openCheckout } from '../../payments/razorpay'

const SECTION_LABELS: Record<string, string> = {
  report: 'Finished edits, revised passages, evidence and focused follow-up questions',
  jobRequirements: 'Weighted per-requirement match for this job',
  bulletRewrites: 'Bullet rewrites tied to your actual resume content',
  issues: 'Every issue found, not just the top 3',
  recommendations: 'Detailed recommendations',
  actionPlan: 'Step-by-step action plan',
  missingInformation: 'Missing information checklist',
}

type UnlockCardProps = {
  analysisId: string
  lockedSections: string[]
  loggedIn: boolean
  onSignIn: () => void
  onUnlocked: () => void | Promise<void>
}

export const UnlockCardView = ({
  lockedSections,
  loggedIn,
  prices,
  currency,
  onCurrencyChange,
  onSignIn,
  onUnlock,
  busy,
  error,
  paymentPending = false,
  onCheckStatus,
  resumeCheckout = false,
  notice,
}: {
  lockedSections: string[]
  loggedIn: boolean
  prices: PaymentPrice[]
  currency: PaymentPrice['currency']
  onCurrencyChange: (currency: PaymentPrice['currency']) => void
  onSignIn: () => void
  onUnlock: () => void
  busy: boolean
  error?: string
  paymentPending?: boolean
  onCheckStatus?: () => void
  resumeCheckout?: boolean
  notice?: string
}) => {
  const selected = prices.find((price) => price.currency === currency) ?? prices[0]
  const labels = lockedSections.map((key) => SECTION_LABELS[key]).filter(Boolean)
  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50 p-5 space-y-3" data-testid="unlock-card">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-950">Unlock the full report</h2>
        <p className="text-sm text-gray-700">
          Your scores and top fixes are free. A one-time payment unlocks the rest of this report. There's no
          subscription.
        </p>
      </div>
      {labels.length ? (
        <ul className="list-disc list-inside text-sm text-gray-700">
          {labels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
      {prices.length > 1 ? (
        <div className="flex items-center gap-2 text-sm" role="group" aria-label="Currency">
          {prices.map((price) => (
            <button
              key={price.currency}
              type="button"
              onClick={() => onCurrencyChange(price.currency)}
              aria-pressed={price.currency === selected?.currency}
              className={`rounded border px-2 py-1 ${
                price.currency === selected?.currency
                  ? 'border-blue-600 bg-white text-blue-700'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              {price.currency}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {loggedIn ? (
          <button
            type="button"
            onClick={onUnlock}
            disabled={busy || !selected || paymentPending}
            className={ui.button.primary}
          >
            {paymentPending
              ? 'Payment confirmation pending'
              : busy
                ? 'Opening payment…'
                : selected
                  ? `${resumeCheckout ? 'Resume checkout for' : 'Unlock for'} ${formatPrice(selected)}`
                  : 'Unlock'}
          </button>
        ) : (
          <button type="button" onClick={onSignIn} className={ui.button.primary}>
            Sign in with Google to unlock
          </button>
        )}
        <Link to="/refund" className="text-sm text-blue-700 underline">
          Refund policy
        </Link>
      </div>
      {paymentPending ? (
        <div className="space-y-3">
          <p>Check the existing payment before trying another. Your review remains saved.</p>
          <button type="button" className={ui.button.secondary} disabled={busy} onClick={onCheckStatus}>
            {busy ? 'Checking confirmation…' : 'Check review access'}
          </button>
          <p className="text-sm">
            If confirmation remains unavailable,{' '}
            <a className={ui.results.link} href={`mailto:${LEGAL.supportEmail}`}>
              contact support
            </a>{' '}
            with the payment ID from your receipt.
          </p>
        </div>
      ) : null}
      {notice ? (
        <p className="text-sm text-gray-700" role="status">{notice}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const UnlockCard = ({ analysisId, lockedSections, loggedIn, onSignIn, onUnlocked }: UnlockCardProps) => {
  const [prices, setPrices] = useState<PaymentPrice[]>([])
  const [currency, setCurrency] = useState<PaymentPrice['currency']>(() => defaultCurrency())
  const [busy, setBusy] = useState(false)
  const [checkingPurchase, setCheckingPurchase] = useState(loggedIn)
  const [error, setError] = useState<string | undefined>()
  const [notice, setNotice] = useState<string | undefined>()
  const [savedOrder, setSavedOrder] = useState<PaymentOrder | undefined>()
  const marker = `payment-confirmation:${analysisId}`
  const [paymentPending, setPaymentPending] = useState(false)
  const proof = useRef<Parameters<typeof verifyPayment>[0] | null>(null)
  const operation = useRef(false)
  const onUnlockedRef = useRef(onUnlocked)
  useEffect(() => {
    onUnlockedRef.current = onUnlocked
  }, [onUnlocked])

  const markPending = useCallback((value: boolean) => {
    setPaymentPending(value)
    try {
      if (value) sessionStorage.setItem(marker, 'pending')
      else sessionStorage.removeItem(marker)
    } catch {
      /* The server remains the source of purchase recovery. */
    }
  }, [marker])

  const applyRecovery = useCallback(async (purchase: PaymentPurchase) => {
    if (purchase.state === 'paid') {
      await onUnlockedRef.current()
      markPending(false)
      proof.current = null
      setSavedOrder(undefined)
      setNotice(undefined)
    } else if (purchase.state === 'ready' && purchase.order) {
      setSavedOrder(purchase.order)
      setCurrency(purchase.order.currency)
      markPending(false)
      setNotice('Your existing checkout is ready to resume at its saved price. No completed payment was found.')
    } else if (purchase.state === 'none') {
      setSavedOrder(undefined)
      markPending(false)
      setNotice(undefined)
    } else {
      markPending(true)
      setNotice(purchase.state === 'refunded'
        ? 'This purchase was refunded. Contact support before purchasing this review again.'
        : 'Your existing purchase is still being confirmed. Check its status before another payment.')
    }
  }, [markPending])

  useEffect(() => {
    let cancelled = false
    proof.current = null
    setSavedOrder(undefined)
    setError(undefined)
    setNotice(undefined)
    setCheckingPurchase(loggedIn)
    try {
      setPaymentPending(sessionStorage.getItem(marker) === 'pending')
    } catch {
      setPaymentPending(false)
    }
    const config = fetchPaymentConfig().then((result) => {
      if (cancelled) return
      setPrices(result.paywallEnabled ? result.prices ?? [] : [])
      if (!result.paywallEnabled || !result.prices?.length) setError('Paid unlock pricing is unavailable. Reload the review or check the Pricing page.')
    }).catch(() => {
      if (!cancelled) setError('Pricing is unavailable right now. Please try again later.')
    })
    const recovery = loggedIn ? recoverPaymentPurchase(analysisId).then(async (result) => {
      if (!cancelled) await applyRecovery(result)
    }).catch(() => {
      if (!cancelled) {
        markPending(true)
        setError('We could not check your existing purchase. Check its status before another payment.')
      }
    }) : Promise.resolve()
    void Promise.all([config, recovery]).finally(() => {
      if (!cancelled) setCheckingPurchase(false)
    })
    return () => { cancelled = true }
  }, [analysisId, loggedIn, marker, applyRecovery, markPending])

  async function confirmExisting() {
    if (proof.current) {
      try {
        await verifyPayment(proof.current)
      } catch {
        /* Read authoritative purchase/access state below. */
      }
    }
    await applyRecovery(await recoverPaymentPurchase(analysisId))
  }
  async function checkStatus() {
    if (operation.current) return
    operation.current = true
    setBusy(true)
    setError(undefined)
    try {
      await confirmExisting()
    } catch {
      markPending(true)
      setError('Confirmation is still unavailable. Check your receipt or contact support before another payment.')
    } finally {
      operation.current = false
      setBusy(false)
    }
  }

  const handleUnlock = async () => {
    if (operation.current || paymentPending || checkingPurchase) return
    operation.current = true
    setBusy(true)
    setError(undefined)
    try {
      const order = await createPaymentOrder(analysisId, currency)
      setSavedOrder(order)
      markPending(true)
      proof.current = await openCheckout(order)
      await confirmExisting()
    } catch (err) {
      if (err instanceof CheckoutDismissedError) {
        markPending(false)
        setNotice('Checkout was closed. You can resume the same purchase when ready.')
      } else {
        // The order request may have reached the provider even if its response was lost.
        // Recovery is read-only at the provider and never creates a second order.
        markPending(true)
        try {
          await applyRecovery(await recoverPaymentPurchase(analysisId))
        } catch {
          setError('Payment could not be confirmed. Check its status before another payment.')
        }
      }
    } finally {
      operation.current = false
      setBusy(false)
    }
  }

  return (
    <UnlockCardView
      lockedSections={lockedSections}
      loggedIn={loggedIn}
      prices={savedOrder ? [{ currency: savedOrder.currency, amount: savedOrder.amount }] : prices}
      currency={currency}
      onCurrencyChange={setCurrency}
      onSignIn={onSignIn}
      onUnlock={() => void handleUnlock()}
      busy={busy || checkingPurchase}
      error={error}
      notice={checkingPurchase ? 'Checking for an existing purchase…' : notice}
      resumeCheckout={Boolean(savedOrder)}
      paymentPending={paymentPending}
      onCheckStatus={() => void checkStatus()}
    />
  )
}

export default UnlockCard
