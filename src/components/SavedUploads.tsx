import { useCallback, useEffect, useState, useRef } from 'react'
import { fetchDocuments } from '../api/endpoints'
import type { UploadedDoc } from '../api/documents'
import { fetchPrimaryResume, setPrimaryResume } from '../api/workspace'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useNavigate } from 'react-router-dom'
import { useWorkspaceIdentity } from '../auth/useWorkspaceIdentity'
import { ui } from '../app/uiTokens'

export default function SavedUploads({
  picker = false,
  disabled = false,
}: {
  picker?: boolean
  disabled?: boolean
}) {
  const requestEpoch = useRef(0)
  const [documents, setDocuments] = useState<UploadedDoc[]>([])
  const [primary, setPrimary] = useState<string>()
  const [offset, setOffset] = useState(0)
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const token = useWorkspaceIdentity()
  const navigate = useNavigate()
  const selected = useAnalysisStore((s) => s.uploadedDoc?.documentId)
  const load = useCallback(
    async (next: number, signal?: { cancelled: boolean }) => {
      const epoch = ++requestEpoch.current
      setLoading(true)
      setError('')
      try {
        const [items, p] = await Promise.all([
          fetchDocuments({ limit: 20, offset: next }),
          fetchPrimaryResume(),
        ])
        if (signal?.cancelled || epoch !== requestEpoch.current) return
        setDocuments((old) =>
          next
            ? [
                ...old,
                ...items.filter(
                  (d) => !old.some((o) => o.documentId === d.documentId),
                ),
              ]
            : items,
        )
        setOffset(next)
        setMore(items.length === 20)
        setPrimary(p?.isPrimary ? p.documentId : undefined)
      } catch {
        if (!signal?.cancelled && epoch === requestEpoch.current)
          setError(
            'Saved uploads could not be loaded. Try again; you can still upload a resume.',
          )
      } finally {
        if (!signal?.cancelled && epoch === requestEpoch.current)
          setLoading(false)
      }
    },
    [],
  )
  useEffect(() => {
    const signal = { cancelled: false }
    setDocuments([])
    setPrimary(undefined)
    setSaving(false)
    setNotice('')
    void load(0, signal)
    const refresh = () => void load(0, signal)
    window.addEventListener('guest-claim-complete', refresh)
    return () => {
      signal.cancelled = true
      requestEpoch.current++
      window.removeEventListener('guest-claim-complete', refresh)
    }
  }, [load, token])
  const choose = (d: UploadedDoc) => {
    useAnalysisStore.getState().setUploadedDoc(d)
    useAnalysisStore.getState().setResumeFile(null)
    if (!picker) {
      useAnalysisStore.getState().resetJdOnly()
      navigate('/app/analyzer?mode=job-match')
    } else setNotice(`${d.fileName} selected for this review.`)
  }
  return (
    <section className="space-y-4" aria-label="Saved uploaded resumes">
      {!picker && (
        <div>
          <p className="text-sm font-semibold text-teal-800">
            Reusable source files
          </p>
          <h2 className="text-2xl font-semibold text-slate-950">
            Saved uploads
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Reuse a saved file or choose a primary for next time. Each review
            keeps the source file it started from.
          </p>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
        >
          {error}{' '}
          <button
            type="button"
            className={ui.results.link}
            onClick={() => void load(offset)}
          >
            Try loading again
          </button>
        </div>
      )}
      {loading && !documents.length ? (
        <p role="status">Loading saved uploads…</p>
      ) : !error && !documents.length ? (
        <p className="text-sm text-slate-600">
          No saved uploads yet. Upload your first resume in a new review.
        </p>
      ) : null}
      <ul className="divide-y divide-slate-200">
        {documents.map((d) => (
          <li
            className="flex flex-wrap items-center justify-between gap-4 py-4"
            key={d.documentId}
          >
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold text-slate-950">
                {d.fileName}
              </p>
              <p className="text-sm text-slate-600">
                Uploaded {new Date(d.uploadedAt).toLocaleDateString()}
                {primary === d.documentId ? ' · Primary resume' : ''}
                {selected === d.documentId ? ' · Selected for this review' : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={disabled || loading || saving}
                className={ui.button.secondary}
                onClick={() => choose(d)}
              >
                {picker ? 'Use this file' : 'Review a job with this file'}
              </button>
              {primary !== d.documentId && (
                <button
                  type="button"
                  disabled={disabled || saving}
                  className={ui.results.link}
                  onClick={async () => {
                    const epoch = requestEpoch.current
                    setSaving(true)
                    setError('')
                    try {
                      await setPrimaryResume(d)
                      if (epoch !== requestEpoch.current) return
                      setPrimary(d.documentId)
                      setNotice(
                        'Primary saved. Existing reviews keep their original source files.',
                      )
                    } catch {
                      if (epoch === requestEpoch.current)
                        setError(
                          'Your primary resume could not be saved. Your current selection has not changed.',
                        )
                    } finally {
                      if (epoch === requestEpoch.current) setSaving(false)
                    }
                  }}
                >
                  Make primary
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {more && (
        <button
          type="button"
          disabled={loading || disabled || saving}
          className={ui.button.secondary}
          onClick={() => void load(offset + 20)}
        >
          {loading ? 'Loading…' : 'Load more saved files'}
        </button>
      )}
      <p role="status" aria-live="polite" className="text-sm text-teal-800">
        {notice}
      </p>
    </section>
  )
}
