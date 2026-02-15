import type { RecommendationItem } from '../api/types'
import { ui } from '../app/uiTokens'
import { ReportCard } from './results/ReportCard'
import { SectionHeader } from './results/SectionHeader'
import { SeverityChip } from './results/SeverityChip'

type RecommendationsPanelProps = {
  recommendations?: RecommendationItem[]
  showHeader?: boolean
}

const severityTone: Record<RecommendationItem['severity'], 'critical' | 'warning' | 'info'> = {
  info: 'info',
  warning: 'warning',
  critical: 'critical',
}

const RecommendationsPanel = ({ recommendations, showHeader = true }: RecommendationsPanelProps) => {
  const ordered = (recommendations ?? [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (a.item.order !== b.item.order) return a.item.order - b.item.order
      const titleCompare = a.item.title.localeCompare(b.item.title)
      if (titleCompare !== 0) return titleCompare
      const idCompare = a.item.id.localeCompare(b.item.id)
      if (idCompare !== 0) return idCompare
      return a.index - b.index
    })
    .slice(0, 7)
    .map(({ item }) => item)

  const shortenKeywordLists = (text: string) => {
    if (!text) return text
    const token = text.toLowerCase()
    if (token.includes('keyword') && token.split(',').length >= 4) {
      return 'Focus on missing keywords from the job description.'
    }
    return text
  }

  const getTitle = (rec: RecommendationItem) =>
    rec.severity === 'critical' ? `Critical: ${rec.title}` : rec.title

  const getBody = (rec: RecommendationItem) => {
    const summary = shortenKeywordLists(rec.summary)
    const details = shortenKeywordLists(rec.details ?? '')
    if (summary.trim().toLowerCase() === rec.title.trim().toLowerCase()) {
      return details || ''
    }
    return summary || details
  }

  return (
    <ReportCard>
      <div className="space-y-3">
        {showHeader ? (
          <>
            <SectionHeader
              title="Detailed Findings & Recommendations"
              subtitle="Underlying issues detected in your resume, ordered by impact, that inform the Next Steps above."
            />
            <p className={ui.results.text.meta}>
              You don’t need to fix everything at once. Start with Critical items, then address Warnings
              as time allows.
            </p>
          </>
        ) : null}

        {ordered.length ? (
          <ul className="space-y-2">
            {ordered.map((rec, idx) => (
              <li key={rec.id} className={ui.results.card.muted}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className={ui.results.text.body}>{getTitle(rec)}</p>
                    {getBody(rec) && <p className={ui.results.text.secondary}>{getBody(rec)}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityChip label={rec.severity} tone={severityTone[rec.severity]} />
                    <span className={`${ui.results.chip.base} ${ui.results.chip.info}`}>
                      {rec.category}
                    </span>
                  </div>
                </div>
                {rec.details && rec.details.trim().toLowerCase() !== rec.summary.trim().toLowerCase() && (
                  <details className={`mt-2 ${ui.results.text.secondary}`} defaultOpen={idx < 2}>
                    <summary className={ui.results.link}>Details</summary>
                    <p className="mt-2">{shortenKeywordLists(rec.details)}</p>
                  </details>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={ui.results.text.meta}>No recommendations available yet.</p>
        )}

        {ordered.length ? (
          <p className={ui.results.text.meta}>
            Once you&apos;ve addressed the critical and top warning items above, your resume should be
            ATS-safe for this role.
          </p>
        ) : null}
      </div>
    </ReportCard>
  )
}

export default RecommendationsPanel
