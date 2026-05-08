import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import BulletSuggestions from './BulletSuggestions'

type Suggestion = NormalizedAnalysis['normalized']['bulletSuggestions'][number]

const suggestion = (overrides: Partial<Suggestion>): Suggestion => ({
  original: 'Managed key accounts across enterprise customers.',
  suggested: 'Grew enterprise account revenue by replacing this placeholder with an accurate metric.',
  reason: 'Connects the work to measurable commercial impact.',
  section: 'Honeywell - SALES MANAGER',
  claimSupport: 'supported',
  placeholdersNeeded: [],
  ...overrides,
})

describe('BulletSuggestions', () => {
  it('uses clear labels and warns on placeholder rewrites', () => {
    const html = renderToStaticMarkup(
      <BulletSuggestions
        suggestions={[
          suggestion({
            claimSupport: 'placeholder',
            metricsSource: 'placeholder',
            placeholdersNeeded: ['new_qualified_prospects_per_quarter'],
          }),
          suggestion({
            original: 'Built sales dashboards.',
            suggested: 'Built sales dashboards that improved pipeline visibility.',
            reason: 'Clarifies the business value of the dashboard work.',
            section: 'Projects',
          }),
        ]}
      />,
    )

    expect(html).toContain('Section: Honeywell - SALES MANAGER')
    expect(html).toContain('Suggested update')
    expect(html).toContain('Current')
    expect(html).toContain('border-l-2 border-slate-300 bg-slate-50 pl-3 py-2')
    expect(html).toContain('Suggested')
    expect(html).toContain('Why this helps')
    expect(html).not.toContain('From:')
    expect(html).toContain('Needs your input before copying')
    expect(html).toContain('Do not copy this as-is. Replace placeholders with accurate information first.')
    expect(html).toContain('new qualified prospects per quarter')
    expect(html).toContain('Supported by resume')
    expect(html).not.toContain('Metric source')
  })

  it('shows only three suggestions before the optional expansion', () => {
    const html = renderToStaticMarkup(
      <BulletSuggestions
        suggestions={[
          suggestion({ original: 'Current 1', suggested: 'Suggested 1' }),
          suggestion({ original: 'Current 2', suggested: 'Suggested 2' }),
          suggestion({ original: 'Current 3', suggested: 'Suggested 3' }),
          suggestion({ original: 'Current 4', suggested: 'Suggested 4' }),
        ]}
      />,
    )

    expect(html).toContain('Suggested 1')
    expect(html).toContain('Suggested 2')
    expect(html).toContain('Suggested 3')
    expect(html).not.toContain('Suggested 4')
    expect(html).toContain('View all suggestions')
  })
})
