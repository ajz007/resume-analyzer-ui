import { useNavigate } from 'react-router-dom'
import { useHistoryStore } from '../store/useHistoryStore'
import { ui } from '../app/uiTokens'

const HistoryPage = () => {
  const navigate = useNavigate()
  const { items, clearHistory } = useHistoryStore()
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className="p-6">
      <div className={`${ui.layout.header} mb-4`}>
        <div className="space-y-1">
          <h1 className={ui.text.h2}>History</h1>
          <p className={ui.text.subtitle}>Your recent resume analyses.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/app/analyzer')}
            className={ui.button.primary}
          >
            New analysis
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all history?')) {
                clearHistory()
              }
            }}
            className={ui.button.secondary}
          >
            Clear history
          </button>
        </div>
      </div>
      {items.length === 0 ? (
        <div className={`${ui.card.base} p-8 text-center space-y-3`}>
          <h2 className="text-xl font-bold text-gray-900">No analyses yet</h2>
          <p className={ui.text.subtitle}>Run your first analysis to see results here.</p>
          <div>
            <button
              onClick={() => navigate('/app/analyzer')}
              className={ui.button.primary}
            >
              Analyze now
            </button>
          </div>
        </div>
      ) : (
        <div className={ui.card.list}>
          {sorted.map((item, idx) => {
            const shortId = item.analysisId.slice(0, 8)
            const hasCached = (() => {
              try {
                return !!localStorage.getItem(`analysis:${item.analysisId}`)
              } catch {
                return false
              }
            })()
              return (
                <div
                  key={item.analysisId}
                  className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                    idx !== sorted.length - 1 ? 'border-b' : ''
                }`}
                onClick={() => navigate(`/app/results/${item.analysisId}`)}
              >
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">{new Date(item.createdAt).toLocaleString()}</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {shortId ? `Analysis ${shortId}` : 'Analysis'}
                  </div>
                  {!hasCached && (
                    <div className="text-xs text-gray-500">
                      Result may need a fresh analysis to view details.
                    </div>
                  )}
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold text-gray-800">
                  {item.matchScore}/100
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HistoryPage
