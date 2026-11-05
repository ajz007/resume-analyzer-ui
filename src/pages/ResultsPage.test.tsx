import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuestResultsCta } from './ResultsPage'

describe('ResultsPage guest CTA', () => {
  it('renders the guest save/sign-in CTA copy', () => {
    const html = renderToStaticMarkup(<GuestResultsCta onSignIn={vi.fn()} />)

    expect(html).toContain('Sign in to save this review and reuse your resume.')
    expect(html).toContain('Your history, resume workspace, and tailored resumes stay available across devices.')
    expect(html).toContain('Sign in with Google')
  })
})
