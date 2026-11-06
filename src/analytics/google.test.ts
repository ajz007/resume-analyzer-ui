import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('waits for consent and reports the actual receipt once without private URLs', async () => {
  vi.stubEnv('PROD', true)
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
  const gtag = vi.fn()
  const appendChild = vi.fn()
  vi.stubGlobal('window', {
    gtag,
    location: { origin: 'https://app.example', search: '?gclid=example-123&token=private' },
  })
  vi.stubGlobal('document', { createElement: () => ({}), head: { appendChild } })
  vi.stubGlobal('localStorage', { setItem: vi.fn() })
  const analytics = await import('./google')
  const receipt = { transactionId: 'order-test', amountMinor: 16900, currency: 'INR' }

  analytics.recordConfirmedPurchase(receipt)
  expect(appendChild).not.toHaveBeenCalled()
  analytics.setAnalyticsChoice(true)
  analytics.recordPublicPage('/app/share/private')
  expect(appendChild).not.toHaveBeenCalled()
  analytics.recordPublicPage('/app/analyzer')
  expect(gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({
    page_location: 'https://app.example/app/analyzer?gclid=example-123',
    page_referrer: '',
  }))
  analytics.recordConfirmedPurchase(receipt)
  analytics.recordConfirmedPurchase(receipt)
  analytics.setAnalyticsChoice(false)
  analytics.recordConfirmedPurchase({ ...receipt, transactionId: 'another' })

  const purchases = gtag.mock.calls.filter(([, name]) => name === 'purchase')
  expect(purchases).toEqual([['event', 'purchase', expect.objectContaining({
    transaction_id: 'order-test',
    currency: 'INR',
    value: 169,
    page_location: 'https://app.example/app/results',
    page_referrer: '',
  })]])
})

it('carries an existing home-page choice across hosts and honors a later opt-out', async () => {
  let cookie = ''
  const location = { hostname: 'rethinkresume.com', protocol: 'https:' }
  const local = vi.fn(() => 'yes')
  vi.stubGlobal('window', { location })
  vi.stubGlobal('document', {
    get cookie() { return cookie.split(';')[0] },
    set cookie(value: string) { cookie = value },
  })
  vi.stubGlobal('localStorage', { getItem: local, setItem: vi.fn() })
  const analytics = await import('./google')
  analytics.restoreAnalyticsChoice()
  expect(cookie).toContain('rr-analytics-consent=yes; Domain=rethinkresume.com')
  location.hostname = 'app.rethinkresume.com'
  local.mockReturnValue('')
  expect(analytics.analyticsChoice()).toBe('yes')
  analytics.setAnalyticsChoice(false)
  location.hostname = 'rethinkresume.com'
  local.mockReturnValue('yes')
  analytics.restoreAnalyticsChoice()
  expect(analytics.analyticsChoice()).toBe('no')
})
