import type { RecommendationItem } from '../api/types'

type RecommendationsPanelProps = {
  recommendations?: RecommendationItem[]
}

const severityStyles: Record<RecommendationItem['severity'], string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
}

const RecommendationsPanel = ({ recommendations }: RecommendationsPanelProps) => {
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
    <div className="bg-white rounded border p-4 space-y-3">
      <div>
        <h3 className="text-lg font-semibold">Detailed Findings & Recommendations</h3>
        <p className="text-sm text-gray-600">
          Underlying issues detected in your resume, ordered by impact, that inform the Next Steps above.
        </p>
        <p className="text-sm text-gray-600">
          You don’t need to fix everything at once. Start with Critical items, then address Warnings
          as time allows.
        </p>
      </div>

      {ordered.length ? (
        <ul className="space-y-2">
          {ordered.map((rec, idx) => (
            <li key={rec.id} className="border rounded p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{getTitle(rec)}</p>
                  {getBody(rec) && <p className="text-sm text-gray-700">{getBody(rec)}</p>}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full border ${severityStyles[rec.severity]}`}>
                    {rec.severity}
                  </span>
                  <span className="px-2 py-1 rounded-full border bg-gray-50 text-gray-700">
                    {rec.category}
                  </span>
                </div>
              </div>
              {rec.details && rec.details.trim().toLowerCase() !== rec.summary.trim().toLowerCase() && (
                <details className="mt-2 text-sm text-gray-700" defaultOpen={idx < 2}>
                  <summary className="cursor-pointer text-gray-600">Details</summary>
                  <p className="mt-2">{shortenKeywordLists(rec.details)}</p>
                </details>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-600">No recommendations available yet.</p>
      )}

      {ordered.length ? (
        <p className="text-sm text-gray-600">
          Once you&apos;ve addressed the critical and top warning items above, your resume should be
          ATS-safe for this role.
        </p>
      ) : null}
    </div>
  )
}

export default RecommendationsPanel
