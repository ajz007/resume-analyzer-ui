type Gtag = (...args: unknown[]) => void

export type PurchaseReceipt = { transactionId: string; amountMinor: number; currency: string }

const measurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim()
export const analyticsAvailable = /^G-[A-Z0-9]+$/.test(measurementId) && import.meta.env.PROD
const consentKey = 'rr-analytics-consent'
const sentPurchases = new Set<string>()

type TagWindow = Window & { gtag?: Gtag; dataLayer?: unknown[] }
let configured = false
let enabled = false

function usesSharedChoice() {
  const host = window.location.hostname
  return window.location.protocol === 'https:' &&
    (host === 'rethinkresume.com' || host === 'app.rethinkresume.com')
}

function sharedChoice(): 'yes' | 'no' | null {
  if (!usesSharedChoice()) return null
  try {
    for (const entry of document.cookie.split(';')) {
      const [key, value] = entry.trim().split('=')
      if (key === consentKey && (value === 'yes' || value === 'no')) return value
    }
  } catch { /* Fall back to the choice saved on this origin. */ }
  return null
}

function saveSharedChoice(choice: 'yes' | 'no') {
  if (!usesSharedChoice()) return
  try {
    document.cookie = `${consentKey}=${choice}; Domain=rethinkresume.com; Path=/; Max-Age=31536000; Secure; SameSite=Lax`
  } catch { /* The local choice remains available. */ }
}

export function analyticsChoice(): 'yes' | 'no' | null {
  if (typeof window === 'undefined') return null
  const shared = sharedChoice()
  if (shared !== null) return shared
  try {
    const local = localStorage.getItem(consentKey)
    if (local === 'yes' || local === 'no') return local
  } catch { /* No stored choice. */ }
  return null
}

// Promote a pre-existing origin-specific choice once, without overriding a newer shared choice.
export function restoreAnalyticsChoice() {
  const choice = analyticsChoice()
  if (choice !== null && sharedChoice() === null) saveSharedChoice(choice)
  applyAnalyticsChoice(choice === 'yes')
}

function applyAnalyticsChoice(allowed: boolean) {
  if (enabled === allowed) return
  enabled = allowed
  if (configured) {
    const tag = window as TagWindow
    try { tag.gtag?.('consent', 'update', { analytics_storage: allowed ? 'granted' : 'denied' }) } catch { /* Optional analytics. */ }
  }
}

export function setAnalyticsChoice(allowed: boolean) {
  const choice = allowed ? 'yes' : 'no'
  saveSharedChoice(choice)
  try { localStorage.setItem(consentKey, choice) } catch { /* In-memory choice still applies. */ }
  applyAnalyticsChoice(allowed)
}

function tag(): Gtag | undefined {
  if (!analyticsAvailable) return
  const shared = sharedChoice()
  if (shared !== null) applyAnalyticsChoice(shared === 'yes')
  if (!enabled) return
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
