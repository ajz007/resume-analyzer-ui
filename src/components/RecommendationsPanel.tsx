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

  return (
    <div className="bg-white rounded border p-4 space-y-3">
      <div>
        <h3 className="text-lg font-semibold">Recommendations</h3>
        <p className="text-sm text-gray-600">Ordered by priority.</p>
      </div>

      {ordered.length ? (
        <ul className="space-y-2">
          {ordered.map((rec, idx) => (
            <li key={rec.id} className="border rounded p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{rec.title}</p>
                  <p className="text-sm text-gray-700">{rec.summary}</p>
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
              {rec.details && (
                <details className="mt-2 text-sm text-gray-700" defaultOpen={idx < 2}>
                  <summary className="cursor-pointer text-gray-600">Details</summary>
                  <p className="mt-2">{rec.details}</p>
                </details>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-600">No recommendations available yet.</p>
      )}
    </div>
  )
}

export default RecommendationsPanel
