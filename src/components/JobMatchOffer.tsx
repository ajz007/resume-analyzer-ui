import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPaymentConfig } from '../api/endpoints'
import type { PaymentConfig } from '../api/types'
import { ui } from '../app/uiTokens'
import { formatPrice } from '../payments/razorpay'

export default function JobMatchOffer() {
  const [config, setConfig] = useState<PaymentConfig>()
  useEffect(() => {
    let active = true
    void fetchPaymentConfig()
      .then((value) => { if (active) setConfig(value) })
      .catch(() => { /* Pricing page provides retry and availability details. */ })
    return () => { active = false }
  }, [])

  const price = config?.prices.find((item) => item.currency === 'INR') ?? config?.prices[0]
  return (
    <p className="text-sm text-slate-600">
      Free job match preview.{' '}
      {config?.paywallEnabled && price
        ? `Full review ${formatPrice(price)} per job, paid once.`
        : config?.paywallEnabled === false
          ? 'Full reviews are included during early access.'
          : 'Check current pricing for the full review.'}{' '}
      <Link className={ui.results.link} to="/pricing">See access and pricing</Link>
    </p>
  )
}
