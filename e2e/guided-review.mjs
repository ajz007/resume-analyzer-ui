import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const port = Number(process.env.REVIEW_TEST_PORT ?? 8818)
const url = `http://127.0.0.1:${port}/e2e/guided-review.html`
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { stdio: 'pipe', env: { ...process.env, VITE_API_BASE_URL: `http://127.0.0.1:${port}/api/v1` } },
)
const errors = []
server.stderr.on('data', (data) => process.stderr.write(data))
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
      if (chunk.toString().includes(`http://127.0.0.1:${port}/`)) {
        clearTimeout(timer)
        resolve()
      }
    })
  })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/*', (route) =>
    new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort(),
  )
  const button = (name) =>
    name === 'Preview and download'
      ? page.getByRole('navigation', { name: 'Review sections' }).getByRole('button', { name, exact: true })
      : page.getByRole('button', { name, exact: true })
  const visible = (locator) => locator.waitFor({ state: 'visible' })
  const absent = async (locator) => assert.equal(await locator.isVisible(), false)
  async function start(query = '') {
    await page.goto(url + query)
    await visible(page.getByRole('heading', { name: 'Job requirements', exact: true }))
    assert.equal(await button('Job match report').getAttribute('aria-pressed'), 'true')
    await absent(page.getByRole('heading', { name: 'Suggested resume changes', exact: true }))
    await button('Suggested resume changes (1)').click()
    await visible(page.getByRole('heading', { name: 'Suggested resume changes', exact: true }))
    if (!query.includes('load-error'))
      await visible(
        page.getByText('Your review is saved.', {
          exact: true,
        }),
      )
  }
  async function openQuestion() {
    await button('Job match report').click()
    await button('Add relevant experience').click()
  }
  async function submitKind(label) {
    await openQuestion()
    await page.getByLabel(label, { exact: true }).check()
    await page.getByRole('checkbox').check()
    await button('Use my answer').click()
    await visible(page.getByRole('heading', { name: 'What your answers changed' }))
  }
  await start()
  const progress = page.getByRole('list', { name: 'Application review progress' })
  await visible(progress.locator('[aria-current="step"]').getByText('Tailor your resume', { exact: true }))
  await button('Job match report').click()
  const requirement = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: /Terraform/ }) })
  await visible(requirement.getByRole('button', { name: 'Add relevant experience', exact: true }))
  await requirement.getByRole('button', { name: 'Skip for now', exact: true }).click()
  await visible(progress.locator('[aria-current="step"]').getByText('Tailor your resume', { exact: true }))
  await start()
  await absent(button('Download reviewed resume'))
  await button('Keep original').click()
  await visible(button('Use proposed edit'))
  await openQuestion()
  await page.getByLabel('Your experience', { exact: true }).fill('I implemented Terraform for a personal project.')
  await page.getByRole('checkbox').check()
  await page.getByLabel('Your experience', { exact: true }).fill('I implemented Terraform for my own personal project.')
  assert.equal(await page.getByRole('checkbox').isChecked(), false, 'Editing facts requires renewed confirmation')
  // Draft survives reviewing another section before submission.
  await button('Suggested resume changes (1)').click()
  await button('Job match report').click()
  assert.equal(
    await page.getByLabel('Your experience', { exact: true }).inputValue(),
    'I implemented Terraform for my own personal project.',
  )
  await page.getByRole('checkbox').check()
  await button('Use my answer').click()
  await visible(page.getByRole('heading', { name: 'What your answers changed' }))
  assert.equal(await page.locator('#review-answer-updates').evaluate((el) => el === document.activeElement), true)
  await button('Review new edit').click()
  await visible(page.getByText('New from your confirmed answer', { exact: false }))
  await button('Suggested resume changes (2)').click()
  await button('Review changes').click()
  await visible(button('Use proposed edit'))
  await page
    .getByRole('navigation', { name: 'Review sections' })
    .getByRole('button', { name: 'Preview and download', exact: true })
    .click()
  await visible(page.getByText('1 proposed passage selected · 1 originals kept.'))
  await page.getByText('Preview selected passages', { exact: true }).click()
  await visible(progress.locator('[aria-current="step"]').getByText('Preview and download', { exact: true }))
  assert.equal(await button('Download reviewed resume').isEnabled(), true)
  await button('Toggle shared view').click()
  await absent(button('Answer updates (1)'))
  await button('See suggested resume changes').click()
  await visible(page.getByText('This shared view shows suggested wording. Original comparisons and source excerpts are private.', { exact: true }))
  assert.equal(await page.locator('summary').filter({ hasText: /Compare with original|Source evidence/ }).count(), 0)
  await button('Preview and download').click()
  assert.equal(await button('Download available to report owner').isDisabled(), true)
  await button('Toggle shared view').click()
  await visible(button('Suggested resume changes (2)'))
  await button('Switch analysis').click()
  await visible(button('Suggested resume changes (1)'))
  await absent(button('Answer updates (1)'))
  await button('Suggested resume changes (1)').click()
  await visible(button('Keep original'))
  await button('Toggle locked view').click()
  await visible(page.getByRole('heading', { name: 'Your full review is locked' }))
  await absent(button('Keep original'))
  await absent(button('Preview and download'))

  await start()
  await submitKind('I have no relevant experience to add')
  await visible(page.getByText('No resume edit was added.'))
  await button('Review all 1 edits').click()
  await visible(button('Keep original'))
  await start()
  await submitKind('I am not sure')
  await button('Clarify the remaining detail').click()
  await visible(page.getByRole('heading', { name: 'What did you personally build?' }))
  await start('?save-error')
  await button('Keep original').click()
  await visible(page.getByText('Your earlier saved choices remain in use.'))
  await visible(button('Keep original'))
  await start('?load-error')
  await visible(page.getByText('Your saved review is unavailable.'))
  await button('Preview and download').click()
  assert.equal(await button('Download reviewed resume').isDisabled(), true)
  assert.equal(await button('Copy selected passages').isDisabled(), true)

  await start('?pending')
  await button('Preview and download').click()
  assert.equal(await button('Download reviewed resume').isDisabled(), true)
  assert.equal(await button('Copy selected passages').isDisabled(), true)

  const screenshots = process.env.REVIEW_SCREENSHOT_DIR
  if (screenshots) await mkdir(screenshots, { recursive: true })
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await start()
    for (const section of ['Suggested resume changes (1)', 'Job match report', 'Preview and download']) {
      await page
        .getByRole('navigation', { name: 'Review sections' })
        .getByRole('button', { name: section, exact: true })
        .click()
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
        `${section} overflows at ${width}px`,
      )
      if (screenshots)
        await page.screenshot({
          path: `${screenshots}/${width}-${section.startsWith('Suggested') ? 'edits' : section.startsWith('Job match') ? 'requirements' : 'export'}.png`,
          fullPage: true,
        })
    }
  }
  // Native buttons remain keyboard accessible and expose the active section.
  await button('Suggested resume changes (1)').focus()
  await page.keyboard.press('Enter')
  assert.equal(await button('Suggested resume changes (1)').getAttribute('aria-pressed'), 'true')
  await visible(page.getByRole('heading', { name: 'Suggested resume changes', exact: true }))
  const savedVersions = []
  await page.route('**/api/v1/analyses/example-a/tailored-resumes**', async (route) => {
    const request = route.request()
    if (request.method() === 'GET') return route.fulfill({ json: savedVersions })
    assert.equal(request.postDataJSON().editIds.length, 1)
    if (request.url().endsWith('/preview')) {
      return route.fulfill({ json: {
        text: 'Complete tailored resume preview',
        blocks: [
          { kind: 'heading', text: 'Complete tailored resume preview' },
          { kind: 'bullet', text: 'Example achievement' },
        ],
      } })
    }
    const version = {
      documentId: 'snapshot-1',
      fileName: 'Example · Engineer.docx',
      uploadedAt: '2026-11-06T00:00:00Z',
    }
    if (!savedVersions.length) savedVersions.push(version)
    return route.fulfill({ json: version })
  })
  await page.evaluate(() => localStorage.setItem('auth_token', 'fictional-test-token'))
  await start()
  const finish = page.getByRole('navigation', { name: 'Review sections' }).getByRole('button', { name: 'Save for this job', exact: true })
  await finish.click()
  await button('Preview full resume').click()
  await visible(page.getByRole('heading', { name: 'Complete tailored resume preview' }))
  await visible(page.getByRole('listitem').getByText('Example achievement'))
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: async () => { throw new Error('Clipboard access denied') },
  } }))
  await button('Copy selected passages').click()
  await visible(page.getByRole('textbox', { name: /Automatic copying was unavailable/ }))
  await page.locator('#review-export').getByRole('button', { name: 'Save for this job', exact: true }).click()
  await visible(page.getByText('Saved versions for this job'))
  await start()
  await finish.click()
  await visible(page.getByText(/Example · Engineer.docx/))
  assert.deepEqual(errors, [])
  console.log(
    'Guided review browser checks passed: edits, confirmations, draft preservation, answer/no-change/clarification, choice recovery, analysis/access isolation, locked views, export guards, 1280/390/320px layouts.',
  )
} finally {
  await browser?.close()
  server.kill()
}
