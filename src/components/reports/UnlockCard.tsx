import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPaymentOrder, fetchPaymentConfig, verifyPayment } from '../../api/endpoints'
import type { PaymentPrice } from '../../api/types'
import { ui } from '../../app/uiTokens'
import { CheckoutDismissedError, defaultCurrency, formatPrice, openCheckout } from '../../payments/razorpay'

const SECTION_LABELS: Record<string, string> = {
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
}) => {
  const selected = prices.find((price) => price.currency === currency) ?? prices[0]
  const labels = lockedSections.map((key) => SECTION_LABELS[key]).filter(Boolean)
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 space-y-3" data-testid="unlock-card">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-950">Unlock the full report</h2>
        <p className="text-sm text-gray-700">
          Your scores and top fixes are free. A one-time payment unlocks the rest of this report.
          There's no subscription.
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
          <button type="button" onClick={onUnlock} disabled={busy || !selected} className={ui.button.primary}>
            {busy ? 'Opening payment…' : selected ? `Unlock for ${formatPrice(selected)}` : 'Unlock'}
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
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false
    fetchPaymentConfig()
      .then((config) => {
        if (!cancelled) setPrices(config.prices ?? [])
      })
      .catch(() => {
        if (!cancelled) setError('Pricing is unavailable right now. Please try again later.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleUnlock = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const order = await createPaymentOrder(analysisId, currency)
      const checkout = await openCheckout(order)
      await verifyPayment(checkout)
      await onUnlocked()
    } catch (err) {
      if (!(err instanceof CheckoutDismissedError)) {
        const message = (err as { message?: string })?.message
        setError(message || 'Payment could not be completed. You have not been charged.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <UnlockCardView
      lockedSections={lockedSections}
      loggedIn={loggedIn}
      prices={prices}
      currency={currency}
      onCurrencyChange={setCurrency}
      onSignIn={onSignIn}
      onUnlock={() => void handleUnlock()}
      busy={busy}
      error={error}
    />
  )
}

export default UnlockCard
