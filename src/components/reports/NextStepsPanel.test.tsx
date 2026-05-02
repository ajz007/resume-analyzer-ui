import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import NextStepsPanel from './NextStepsPanel'

describe('NextStepsPanel', () => {
  it('groups action plan items under friendly headings', () => {
    const html = renderToStaticMarkup(
      <NextStepsPanel
        actionPlan={{
          quickWins: ['Add missing AWS services'],
          mediumEffort: ['Clarify backend ownership'],
          deepFixes: ['Rework experience around platform impact'],
        }}
      />,
    )

    expect(html).toContain('Quick wins')
    expect(html).toContain('Medium-effort improvements')
    expect(html).toContain('Deeper improvements')
    expect(html).not.toContain('Fix these first')
  })
})
