import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHistoryStore } from '../store/useHistoryStore'
import { fetchAnalyses } from '../api/endpoints'
import { useToastStore } from '../store/useToastStore'
import { ui } from '../app/uiTokens'
import { isLoggedIn } from '../auth/identity'
import { env } from '../app/env'
import { getMatchScore, getOverallScore } from './historyScore'

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
    const load = async () => {
      if (!loggedIn) {
        setAnalyses([])
        setItems([])
        return
      }
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

    const handleClaim = () => {
      void load()
    }
    window.addEventListener('guest-claim-complete', handleClaim)

    return () => {
      cancelled = true
      window.removeEventListener('guest-claim-complete', handleClaim)
    }
  }, [loggedIn, setItems, showToast])

  const sorted = useMemo(
    () => [...analyses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [analyses],
  )

  const getJobSnippet = (jobDescription?: string) => {
    if (!jobDescription) return undefined
    const lines = jobDescription.split('\n').map((line) => line.trim())
    const firstLine = lines.find((line) => line.length > 0) ?? ''
    const snippet = firstLine.length ? firstLine : jobDescription.trim()
    if (!snippet) return undefined
    return snippet.length > 60 ? `${snippet.slice(0, 60)}…` : snippet
  }

  const getTitle = (item: (typeof analyses)[number]) => {
    if (item.resumeFileName) return item.resumeFileName
    const snippet = getJobSnippet(item.jobDescription)
    if (snippet) return snippet
    const shortId = item.analysisId.slice(0, 8)
    return shortId ? `Analysis ${shortId}` : 'Analysis'
  }

  const getSubtitle = (item: (typeof analyses)[number]) => {
    if (item.resumeFileName) return `Resume: ${item.resumeFileName}`
    const snippet = getJobSnippet(item.jobDescription)
    if (snippet) return `JD: ${snippet}`
    return undefined
  }

  const getSummaryText = (summary: unknown) => {
    if (!summary) return undefined
    if (typeof summary === 'string') return summary
    if (typeof summary === 'object') {
      const record = summary as {
        overallAssessment?: string
        strengths?: string[]
        weaknesses?: string[]
      }
      if (record.overallAssessment) return record.overallAssessment
      const parts = [...(record.strengths ?? []), ...(record.weaknesses ?? [])].filter(Boolean)
      if (parts.length) return parts.join(' ')
    }
    return undefined
  }

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
            const overallScore = getOverallScore(item)
            const matchScore = getMatchScore(item)
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
                  {getTitle(item)}
                </div>
                {getSubtitle(item) && (
                  <p className="text-xs text-gray-600 mt-1">{getSubtitle(item)}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-2">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-100 text-sm font-semibold">
                    Overall: {overallScore}
                  </div>
                  {matchScore !== '—' && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-100 text-sm font-semibold">
                      Match: {matchScore}
                    </div>
                  )}
                </div>
                {getSummaryText(item.summary) && (
                  <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                    {getSummaryText(item.summary)}
                  </p>
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

