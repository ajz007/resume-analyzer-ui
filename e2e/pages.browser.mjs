import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile, mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const port = 8820
const origin = `http://127.0.0.1:${port}`
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { stdio: 'pipe', env: { ...process.env, VITE_USE_MOCK_API: 'false', VITE_API_BASE_URL: `${origin}/__test_api` } },
)
server.stderr.on('data', (data) => process.stderr.write(data))
const example = JSON.parse(await readFile('src/fixtures/report-v3-cases.json', 'utf8'))[0].result
const source = {
  documentId: 'source-example',
  fileName: 'Engineering-resume-with-a-long-source-filename-for-small-screens.pdf',
  sizeBytes: 24000,
  uploadedAt: '2026-11-01T00:00:00Z',
  isPrimary: true,
}
const applications = ['completed', 'queued', 'failed'].map((status, i) => ({
  analysisId: `example-${i}`,
  documentId: source.documentId,
  resumeFileName: source.fileName,
  companyName: 'Example company with a long name',
  targetRole: 'Senior Platform Engineer',
  mode: 'job_match',
  status,
  createdAt: '2026-11-01T00:00:00Z',
  jobExcerpt: '',
}))
const screenshots = process.env.PAGE_SCREENSHOT_DIR
let browser
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Test server did not start')), 10000)
    server.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    server.once('exit', (code) => {
      clearTimeout(timer)
      reject(Error(`Test server exited: ${code}`))
    })
    server.stdout.on('data', (chunk) => {
      if (chunk.toString().includes(`${origin}/`)) {
        clearTimeout(timer)
        resolve()
      }
    })
  })
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addInitScript(() => {
    localStorage.setItem('auth_token', 'fictional-test-owner')
    sessionStorage.setItem('guest_claimed_for_fictional-test-owner', '1')
    // A fictional checkout response, never the provider's real script or a payment.
    window.Razorpay = class {
      constructor(options) {
        this.options = options
      }
      on() {}
      open() {
        this.options.handler({
          razorpay_order_id: 'order-example',
          razorpay_payment_id: 'payment-example',
          razorpay_signature: 'fictional-signature',
        })
      }
    }
  })
  let paymentConfig = { paywallEnabled: false, prices: [] }
  let configError = false
  let configGate = null
  let failApps = false
  let failSource = false
  let failDrafts = false
  let noUploads = false
  let verifyError = true
  let orders = 0
  let verifications = []
  let unlocked = false
  const pageErrors = []
  const intercept = async (route) => {
    const url = new URL(route.request().url())
    if (url.origin !== origin) return route.abort()
    if (!url.pathname.startsWith('/__test_api')) return route.continue()
    const path = url.pathname.replace('/__test_api', '')
    let body
    if (path === '/payments/config') {
      if (configGate) await configGate
      if (configError) return route.fulfill({ status: 503, json: { message: 'Unavailable' } })
      body = paymentConfig
    } else if (path === '/workspace/primary-resume') {
      if (failSource) return route.fulfill({ status: 503, json: { message: 'Source unavailable' } })
      if (noUploads) return route.fulfill({ status: 404, json: { message: 'No saved source' } })
      body = source
    } else if (path === '/applications') {
      if (failApps) return route.fulfill({ status: 503, json: { message: 'Applications unavailable' } })
      body = applications
    } else if (path.startsWith('/applications/')) body = applications[0]
    else if (path === '/documents') body = noUploads ? [] : [source]
    else if (path === '/api/v1/resumes') {
      if (failDrafts) return route.fulfill({ status: 503, json: { message: 'Drafts unavailable' } })
      body = []
    } else if (path === '/usage')
      body = { plan: 'free', used: 0, limit: 15, remaining: 15, resetsAt: '2026-12-01T00:00:00Z', authenticated: true }
    else if (path === '/payments/orders') {
      orders++
      body = { orderId: 'order-example', amount: 900, currency: 'USD', keyId: 'fictional-key' }
    } else if (path === '/payments/verify') {
      verifications.push(route.request().postDataJSON())
      if (verifyError) return route.fulfill({ status: 503, json: { message: 'Verification interrupted' } })
      unlocked = true
      body = { analysisId: 'example-0', unlocked: true }
    } else if (/^\/analyses\/[^/]+\/review-session$/.test(path))
      body = { session: { version: 0, excludedIds: [], answers: [], attempts: 0 }, report: example.report }
    else if (path.startsWith('/analyses/'))
      body = {
        id: path.split('/')[2],
        status: 'completed',
        locked: !unlocked,
        lockedSections: unlocked ? [] : ['report'],
        result: example,
      }
    else return route.fulfill({ status: 404, json: { message: 'Fictional test route only' } })
    return route.fulfill({ json: body })
  }
  await context.route('**/*', intercept)
  const page = await context.newPage()
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.setDefaultTimeout(10000)
  const visit = async (path) => {
    await page.goto(origin + path)
    await page.locator('h1').first().waitFor()
  }
  const visible = (locator) => locator.waitFor({ state: 'visible' })
  const button = (name) => page.getByRole('button', { name, exact: true })
  const sourceSelected = () => page.getByText(source.fileName, { exact: true }).filter({ visible: true }).first()

  await visit('/app/analyzer?mode=job-match')
  await visible(sourceSelected())
  const company = page.getByLabel('Company (optional)', { exact: true })
  const role = page.getByLabel('Target position (optional)', { exact: true })
  await company.fill('Previous company')
  await role.fill('Previous role')
  await page.locator('#jd').fill('Previous job description for a different application.')
  await page
    .getByRole('complementary', { name: 'Workspace navigation' })
    .getByRole('link', { name: 'Applications', exact: true })
    .click()
  await page.getByRole('link', { name: 'Review a new job', exact: true }).click()
  assert.equal(await company.inputValue(), '')
  assert.equal(await role.inputValue(), '')
  assert.equal(await page.locator('#jd').inputValue(), '')
  await visible(sourceSelected())
  await company.fill('Another old company')
  await page.getByRole('link', { name: 'New job review', exact: true }).click()
  assert.equal(await company.inputValue(), '')
  // Ordinary navigation preserves an in-progress draft.
  await company.fill('Draft company')
  await page
    .getByRole('complementary', { name: 'Workspace navigation' })
    .getByRole('link', { name: 'Applications', exact: true })
    .click()
  await page.goBack()
  assert.equal(await company.inputValue(), 'Draft company')

  let releaseConfig
  configGate = new Promise((resolve) => {
    releaseConfig = resolve
  })
  await visit('/pricing')
  await visible(page.getByText('Loading current access and pricing…'))
  assert.equal(await page.getByText('Early access · no report-unlock payment required').count(), 0)
  configError = true
  releaseConfig()
  configGate = null
  await visible(page.getByRole('heading', { name: 'Current pricing could not be loaded' }))
  assert.equal(await page.getByText('Early access · no report-unlock payment required').count(), 0)
  configError = false
  await button('Reload pricing').click()
  await visible(page.getByRole('heading', { name: 'Early access · no report-unlock payment required' }))
  paymentConfig = { paywallEnabled: true, prices: [] }
  await visit('/pricing')
  await visible(page.getByText('Paid unlocks are enabled, but prices are unavailable. Check again before purchasing.'))
  paymentConfig = { paywallEnabled: true, prices: [{ currency: 'USD', amount: 900 }] }
  await button('Reload pricing').click()
  await visible(page.getByText('$9 per review'))

  failApps = true
  await visit('/app/home')
  await visible(page.getByText('Your recent applications could not be loaded. You can still start a review above.'))
  await visible(page.getByRole('heading', { name: source.fileName }))
  assert.equal(await button('Review a new job').isEnabled(), true)
  failApps = false
  failSource = true
  await visit('/app/home')
  await visible(
    page.getByText('Your saved source could not be loaded. You can still start a review and choose a file there.'),
  )
  await visible(page.getByRole('link', { name: 'View issue', exact: true }))
  failSource = false
  await visit('/app/resumes')
  await visible(page.getByRole('heading', { name: 'No editable drafts yet' }))
  await visible(page.getByText(source.fileName, { exact: true }))
  assert.equal(await page.getByRole('heading', { name: 'No resumes yet', exact: true }).count(), 0)
  failDrafts = true
  await visit('/app/resumes')
  await visible(button('Try loading drafts again'))
  assert.equal(await page.getByRole('heading', { name: 'No editable drafts yet' }).count(), 0)
  failDrafts = false
  await button('Try loading drafts again').click()
  await visible(page.getByRole('heading', { name: 'No editable drafts yet' }))

  // Checkout is simulated. The same proof is retried, with no second order.
  await visit('/app/results/example-0')
  await visible(button('Unlock for $9'))
  await button('Unlock for $9').click()
  await visible(button('Check review access'))
  assert.equal(orders, 1)
  assert.equal(await button('Payment confirmation pending').isDisabled(), true)
  assert.equal((await page.locator('main').innerText()).includes('not been charged'), false)
  unlocked = true // Provider/server confirmation can arrive while verify is unavailable.
  await button('Check review access').click()
  await page.getByTestId('unlock-card').waitFor({ state: 'detached' })
  assert.equal(orders, 1)
  assert.equal(verifications.length, 2)
  assert.deepEqual(verifications[0], verifications[1])

  // A lost checkout callback survives reload as a status-check-only state.
  unlocked = false
  await page.evaluate(() => sessionStorage.setItem('payment-confirmation:example-0', 'pending'))
  await visit('/app/results/example-0')
  await visible(button('Check review access'))
  await button('Check review access').click()
  await visible(
    page.getByText('Confirmation is still unavailable. Check your receipt or contact support before another payment.'),
  )
  assert.equal(orders, 1)
  unlocked = true
  await button('Check review access').click()
  await page.getByTestId('unlock-card').waitFor({ state: 'detached' })

  unlocked = false
  verifyError = false
  await visit('/app/results/example-0')
  await visible(button('Unlock for $9'))
  await button('Unlock for $9').click()
  await page.getByTestId('unlock-card').waitFor({ state: 'detached' })
  assert.equal(orders, 2) // A separate successful checkout, not a recovery order.

  if (screenshots) await mkdir(screenshots, { recursive: true })
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const path of [
      '/',
      '/pricing',
      '/app/home',
      '/app/analyzer?mode=job-match',
      '/app/history',
      '/app/resumes',
      '/app/resumes/new',
      '/ats-resume-checker',
      '/ai-resume-builder',
      '/privacy',
      '/delivery',
    ]) {
      await visit(path)
      // Wait for source controls before measuring dynamic routes.
      if (path === '/app/analyzer?mode=job-match' || path === '/app/resumes') await visible(sourceSelected())
      if (path === '/app/home') await visible(page.getByRole('link', { name: 'View progress', exact: true }))
      if (path === '/pricing') await visible(page.getByRole('heading', { name: 'Full review unlock' }))
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
        console.log(
          await page.evaluate(() =>
            [...document.querySelectorAll('main *')]
              .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
              .map((el) => ({
                tag: el.tagName,
                class: el.className,
                width: el.getBoundingClientRect().width,
                right: el.getBoundingClientRect().right,
                text: el.textContent?.slice(0, 50),
              }))
              .slice(0, 18),
          ),
        )
        if (screenshots) await page.screenshot({ path: `${screenshots}/overflow.png`, fullPage: true })
        throw Error(`Overflow at ${width}px on ${path}`)
      }
      if (screenshots)
        await page.screenshot({
          path: `${screenshots}/${width}-${path.replaceAll('/', '_').replaceAll('?', '-').replaceAll('=', '-')}.png`,
          fullPage: true,
        })
    }
  }
  // A first-time account still has a clear start action.
  noUploads = true
  await visit('/app/home')
  await visible(page.getByRole('heading', { name: 'Choose a resume for your next review.' }))
  assert.equal(await button('Review a new job').isEnabled(), true)
  noUploads = false
  const guest = await browser.newContext({ viewport: { width: 320, height: 1000 } })
  await guest.route('**/*', intercept)
  const guestPage = await guest.newPage()
  guestPage.on('pageerror', (error) => pageErrors.push(error.message))
  for (const path of ['/', '/pricing', '/app/analyzer?mode=job-match']) {
    await guestPage.goto(origin + path)
    await guestPage.locator('h1').first().waitFor()
    if (path.includes('analyzer'))
      await guestPage.getByText(source.fileName, { exact: true }).filter({ visible: true }).first().waitFor()
    assert.equal(await guestPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    if (screenshots)
      await guestPage.screenshot({
        path: `${screenshots}/320-guest-${path.replaceAll('/', '_').replaceAll('?', '-').replaceAll('=', '-')}.png`,
        fullPage: true,
      })
  }
  await guestPage.getByRole('button', { name: 'Toggle navigation menu' }).click()
  await guestPage.getByRole('link', { name: 'Pricing', exact: true }).waitFor({ state: 'visible' })
  assert.equal(await guestPage.getByRole('link', { name: 'Applications', exact: true }).count(), 0)
  await guest.close()
  assert.deepEqual(pageErrors, [])
  console.log(
    'Page consistency checks passed: new-job/draft boundaries, pricing states, independent workspace failures, draft recovery, simulated payment confirmation/reload without duplicate orders, and 36 responsive route checks and guest mobile navigation.',
  )
} finally {
  await browser?.close()
  server.kill()
}
