import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import RecheckStatus from './RecheckStatus'

describe('application recheck status', () => {
  const recheck = { analysisId: 'recheck-1', documentId: 'resume-1', status: 'queued' }
  const render = (props: Parameters<typeof RecheckStatus>[0]) =>
    renderToStaticMarkup(<MemoryRouter><RecheckStatus {...props} /></MemoryRouter>)

  it('links to a queued recheck from the original application', () => {
    const html = render({ recheck })
    expect(html).toContain('Recheck in progress')
    expect(html).toContain('href="/app/results/recheck-1"')
  })

  it('compares the original and tailored scores when ready', () => {
    expect(render({ recheck: { ...recheck, status: 'completed', score: 68 }, originalScore: 61 }))
      .toContain('Original 61/100 · Tailored 68/100')
  })

  it('shows returned credit only when confirmed', () => {
    const failed = { ...recheck, status: 'failed' }
    expect(render({ recheck: failed })).not.toContain('credit was returned')
    expect(render({ recheck: { ...failed, paidReviewCredit: 'returned' } })).toContain('credit was returned')
  })
})
