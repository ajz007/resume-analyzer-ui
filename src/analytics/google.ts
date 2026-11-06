type Gtag = (...args: unknown[]) => void

export type PurchaseReceipt = { transactionId: string; amountMinor: number; currency: string }

const measurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim()
export const analyticsAvailable = /^G-[A-Z0-9]+$/.test(measurementId) && import.meta.env.PROD
const consentKey = 'rr-analytics-consent'
const sentPurchases = new Set<string>()

type TagWindow = Window & { gtag?: Gtag; dataLayer?: unknown[] }
let configured = false
let enabled = false

export function analyticsChoice(): string | null {
  try { return localStorage.getItem(consentKey) } catch { return null }
}

export function setAnalyticsChoice(allowed: boolean) {
  try { localStorage.setItem(consentKey, allowed ? 'yes' : 'no') } catch { /* In-memory choice still applies. */ }
  enabled = allowed
  if (configured) {
    const tag = window as TagWindow
    try { tag.gtag?.('consent', 'update', { analytics_storage: allowed ? 'granted' : 'denied' }) } catch { /* Optional analytics. */ }
  }
}

function tag(): Gtag | undefined {
  if (!analyticsAvailable || !enabled) return
  const target = window as TagWindow
  if (!configured) {
    target.dataLayer ??= []
    target.gtag ??= function () { target.dataLayer?.push(arguments) }
    target.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    target.gtag('js', new Date())
    target.gtag('config', measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: window.location.origin + '/',
      page_referrer: '',
      page_title: 'Rethink Resume',
    })
    const script = document.createElement('script')
    script.async = true
    script.referrerPolicy = 'no-referrer'
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)
    configured = true
  }
  return target.gtag
}

// Measurement must never interrupt a preview or payment flow.
function sendEvent(event: string, data: Record<string, unknown>): boolean {
  try {
    const send = tag()
    if (!send) return false
    send('event', event, data)
    return true
  } catch {
    return false
  }
}

export function recordPublicPage(path: string) {
  if (!['/', '/pricing', '/app/analyzer'].includes(path)) return
  const location = new URL(path, window.location.origin)
  const query = new URLSearchParams(window.location.search)
  for (const key of ['gclid', 'gbraid', 'wbraid']) {
    const value = query.get(key)
    if (value && /^[A-Za-z0-9_-]{1,160}$/.test(value)) location.searchParams.set(key, value)
  }
  sendEvent('page_view', {
    send_to: measurementId, page_location: location.href, page_referrer: '', page_title: 'Rethink Resume',
  })
}

export function recordPreviewCompleted() {
  sendEvent('preview_completed', {
    send_to: measurementId, page_location: window.location.origin + '/app/analyzer', page_referrer: '',
  })
}

export function recordConfirmedPurchase(receipt?: PurchaseReceipt) {
  if (!receipt?.transactionId || !['INR', 'USD'].includes(receipt.currency) ||
      !Number.isSafeInteger(receipt.amountMinor) || receipt.amountMinor <= 0) return
  if (sentPurchases.has(receipt.transactionId)) return
  const value = receipt.amountMinor / 100
  const sent = sendEvent('purchase', {
    send_to: measurementId,
    transaction_id: receipt.transactionId,
    value,
    currency: receipt.currency,
    page_location: window.location.origin + '/app/results',
    page_referrer: '',
    items: [{ item_id: 'job_review', item_name: 'Full job review', price: value, quantity: 1 }],
  })
  if (sent) sentPurchases.add(receipt.transactionId)
}
