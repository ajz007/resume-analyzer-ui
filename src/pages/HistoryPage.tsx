import NewJobLink from '../components/NewJobLink'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  applicationHeading,
  fetchApplications,
  type Application,
} from '../api/workspace'
import { useWorkspaceIdentity } from '../auth/useWorkspaceIdentity'
import { ui } from '../app/uiTokens'
import AppPageMetadata from '../components/seo/AppPageMetadata'

export default function HistoryPage() {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [items, setItems] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const token = useWorkspaceIdentity()
  const loggedIn = !!token
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    if (!loggedIn) {
      setItems([])
      setLoading(false)
      return
    }
    fetchApplications({ q: search, limit: 20, offset })
      .then((a) => {
        if (!cancelled) setItems(a)
      })
      .catch(() => {
        if (!cancelled)
          setError(
            'Your saved applications could not be loaded. Try again; starting a new analysis is not required.',
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, search, offset, retry])
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AppPageMetadata
        title="Applications | Rethink Resume"
        description="Continue your saved job-specific resume reviews."
      />
      <header className="flex flex-wrap justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-teal-800">
            Pick up where you left off
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Applications
          </h1>
          <p className="mt-3 text-slate-600">
            Find the job you reviewed, the source resume and your next action.
          </p>
        </div>
        <NewJobLink className={ui.button.primary} >
          Review a new job
        </NewJobLink>
      </header>
      {!loggedIn ? (
        <div className={ui.card.padded}>
          <p>Sign in to see saved applications across devices.</p>
          <Link className={ui.results.link} to="/app/analyzer">
            Return to your review
          </Link>
        </div>
      ) : (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSearch(query.trim())
              setOffset(0)
            }}
            className="space-y-2"
          >
            <label
              htmlFor="application-search"
              className="font-medium text-slate-800"
            >
              Find a previous application
            </label>
            <div className="flex flex-wrap gap-3">
              <input
                id="application-search"
                type="search"
                maxLength={120}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Company, target position or resume filename"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white p-3"
              />
              <button className={ui.button.secondary} type="submit">
                Search applications
              </button>
            </div>
          </form>
          {error ? (
            <div
              role="alert"
              className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5"
            >
              <p>{error}</p>
              <button
                className={ui.button.secondary}
                onClick={() => setRetry((n) => n + 1)}
              >
                Try loading again
              </button>
            </div>
          ) : loading ? (
            <p role="status">Loading applications…</p>
          ) : items.length ? (
            <ul className="divide-y divide-slate-200">
              {items.map((a) => (
                <li
                  key={a.analysisId}
                  className="flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold ${a.status === 'failed' ? 'text-red-800' : 'text-teal-800'}`}
                    >
                      {a.status === 'completed'
                        ? 'Ready to continue'
                        : a.status === 'failed'
                          ? 'Needs attention'
                          : a.status === 'queued'
                            ? 'In the queue'
                            : 'Processing'}
                    </p>
                    <h2 className="mt-2 break-words text-xl font-semibold text-slate-950">
                      {applicationHeading(a)}
                    </h2>
                    <p className="mt-2 break-words text-sm text-slate-600">
                      {a.resumeFileName || 'Original submitted resume'} ·{' '}
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    className={ui.button.secondary}
                    to={`/app/results/${a.analysisId}`}
                  >
                    {a.status === 'completed'
                      ? 'Continue review'
                      : a.status === 'failed'
                        ? 'View issue'
                        : 'View progress'}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8">
              <h2 className="text-xl font-semibold">
                {search
                  ? 'No matching applications'
                  : 'Your first application review starts here'}
              </h2>
              <p className="mt-3 text-slate-600">
                {search
                  ? 'Try another company, role or filename.'
                  : 'Use a saved resume with a target job to begin.'}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <button
              className={ui.button.secondary}
              disabled={loading || offset === 0}
              onClick={() => setOffset((n) => Math.max(0, n - 20))}
            >
              Previous page
            </button>
            <span className="text-sm text-slate-600">
              Page {Math.floor(offset / 20) + 1}
            </span>
            <button
              className={ui.button.secondary}
              disabled={loading || items.length < 20}
              onClick={() => setOffset((n) => n + 20)}
            >
              Next page
            </button>
          </div>
        </>
      )}
      <p className="text-sm text-slate-600">
        This history records preparation and review. Downloading a resume does
        not mean an application was submitted.
      </p>
    </div>
  )
}
