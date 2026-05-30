import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import AlertCard from './AlertCard'

describe('AlertCard', () => {
  it('renders warning status styling and content', () => {
    const html = renderToStaticMarkup(
      <AlertCard
        severity="warning"
        title="ATS Compatibility Warning"
        description="Some ATS platforms may struggle to process this resume."
      >
        <button type="button">Upload another resume</button>
      </AlertCard>,
    )

    expect(html).toContain('border-amber-200')
    expect(html).toContain('bg-amber-50')
    expect(html).toContain('ATS Compatibility Warning')
    expect(html).toContain('Upload another resume')
  })

  it('keeps error status visually distinct from warnings', () => {
    const html = renderToStaticMarkup(
      <AlertCard severity="error" title="Upload failed" description="Please try again." />,
    )

    expect(html).toContain('border-red-200')
    expect(html).toContain('bg-red-50')
    expect(html).not.toContain('bg-amber-50')
  })
})
