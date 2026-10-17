import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { UnlockCardView } from './UnlockCard'

const render = (loggedIn: boolean) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <UnlockCardView
        lockedSections={['jobRequirements', 'bulletRewrites']}
        loggedIn={loggedIn}
        prices={[
          { currency: 'INR', amount: 49900 },
          { currency: 'USD', amount: 900 },
        ]}
        currency="USD"
        onCurrencyChange={vi.fn()}
        onSignIn={vi.fn()}
        onUnlock={vi.fn()}
        busy={false}
      />
    </MemoryRouter>,
  )

describe('UnlockCardView', () => {
  it('shows the selected price and locked sections for signed-in users', () => {
    const html = render(true)
    expect(html).toContain('Unlock for $9')
    expect(html).toContain('Weighted per-requirement match for this job')
    expect(html).toContain('Refund policy')
  })

  it('asks guests to sign in before paying', () => {
    const html = render(false)
    expect(html).toContain('Sign in with Google to unlock')
    expect(html).not.toContain('Unlock for')
  })
})
