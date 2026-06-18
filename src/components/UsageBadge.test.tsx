import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { UsageBadgeContent } from './UsageBadge'

describe('UsageBadge', () => {
  it('shows remaining analyses when provided by the API response', () => {
    const html = renderToStaticMarkup(
      <UsageBadgeContent
        usage={{
          plan: 'Free account',
          used: 3,
          limit: 15,
          remaining: 12,
          authenticated: true,
          resetsAt: '2026-07-01T00:00:00.000Z',
        }}
        loggedIn
      />,
    )

    expect(html).toContain('12 left')
    expect(html).toContain('of 15 this month')
  })
})
