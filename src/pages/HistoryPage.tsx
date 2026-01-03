import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHistoryStore } from '../store/useHistoryStore'
import { fetchAnalyses } from '../api/endpoints'
import { useToastStore } from '../store/useToastStore'
import { ui } from '../app/uiTokens'
import { isLoggedIn } from '../auth/identity'
import { env } from '../app/env'

const HistoryPage = () => {
  const navigate = useNavigate()
  const { setItems, clearHistory } = useHistoryStore()
  const showToast = useToastStore((state) => state.showToast)
  const [analyses, setAnalyses] = useState<Awaited<ReturnType<typeof fetchAnalyses>>>([])
  const [loading, setLoading] = useState(false)
  const loggedIn = isLoggedIn()

  const authStartUrl = useMemo(() => {
    const base = (env.apiBaseUrl || '').replace(/\/$/, '')
    return base ? `${base}/auth/google/start` : '/auth/google/start'
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!loggedIn) {
      setAnalyses([])
      setItems([])
      return
    }
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchAnalyses({ limit: 20, offset: 0 })
        if (cancelled) return
        setAnalyses(data)
        setItems(
          data.map((item) => ({
            analysisId: item.analysisId,
            createdAt: item.createdAt,
            matchScore: item.matchScore ?? 0,
          })),
        )
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load history.'
          showToast({ type: 'error', title: 'Could not load history', message })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [loggedIn, setItems, showToast])

  const sorted = useMemo(
    () => [...analyses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [analyses],
  )

  return (
    <div className="p-6">
      <div className={`${ui.layout.header} mb-4`}>
        <div className="space-y-1">
          <h1 className={ui.text.h2}>History</h1>
          <p className={ui.text.subtitle}>Your recent resume analyses.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/app/analyzer')} className={ui.button.primary}>
            New analysis
          </button>
          {loggedIn && (
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
          )}
        </div>
      </div>
      {!loggedIn ? (
        <div className={`${ui.card.base} p-8 text-center space-y-3`}>
          <h2 className="text-xl font-bold text-gray-900">Sign in to view history</h2>
          <p className={ui.text.subtitle}>Connect your account to see your past analyses.</p>
          <div>
            <button
              type="button"
              onClick={() => window.open(authStartUrl, '_self')}
              className={ui.button.primary}
            >
              Sign in with Google
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className={`${ui.card.base} p-8 text-center text-gray-700`}>Loading history...</div>
      ) : sorted.length === 0 ? (
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
            const matchScore = typeof item.matchScore === 'number' ? item.matchScore : undefined
            return (
              <div
                key={item.analysisId}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${idx !== sorted.length - 1 ? 'border-b' : ''}`}
                onClick={() => navigate(`/app/results/${item.analysisId}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">{new Date(item.createdAt).toLocaleString()}</div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border">
                    {item.status ?? 'unknown'}
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {shortId ? `Analysis ${shortId}` : 'Analysis'}
                </div>
                {typeof matchScore === 'number' && (
                  <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-100 text-sm font-semibold">
                    Score: {matchScore}/100
                  </div>
                )}
                {item.summary && (
                  <p className="mt-2 text-sm text-gray-700 line-clamp-2">{item.summary}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HistoryPage
