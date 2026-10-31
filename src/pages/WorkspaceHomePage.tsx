import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  fetchApplications,
  fetchPrimaryResume,
  applicationHeading,
  type Application,
  type PrimaryResume,
} from '../api/workspace'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useWorkspaceIdentity } from '../auth/useWorkspaceIdentity'
import { ui } from '../app/uiTokens'
import AppPageMetadata from '../components/seo/AppPageMetadata'

export default function WorkspaceHomePage() {
  const [resume, setResume] = useState<PrimaryResume | null>(null)
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const navigate = useNavigate()
  const token = useWorkspaceIdentity()
  const loggedIn = !!token
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    Promise.all([
      fetchPrimaryResume(),
      loggedIn ? fetchApplications({ limit: 3 }) : Promise.resolve([]),
    ])
      .then(([d, a]) => {
        if (!cancelled) {
          setResume(d)
          setApps(a)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, reload])
  useEffect(() => {
    const update = () => setReload((n) => n + 1)
    window.addEventListener('guest-claim-complete', update)
    return () => window.removeEventListener('guest-claim-complete', update)
  }, [])
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <AppPageMetadata
        title="Your application workspace | Rethink Resume"
        description="Reuse your saved resume and continue a job-specific application review."
      />
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-800">
          Your next application
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
          Bring the job. Start with your experience.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Understand the fit, choose truthful improvements and return to the
          same review later.
        </p>
      </header>
      {loading ? (
        <p role="status">Loading your workspace…</p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-5"
        >
          <p>Your saved workspace could not be loaded.</p>
          <button
            type="button"
            className={ui.button.secondary}
            onClick={() => setReload((n) => n + 1)}
          >
            Try loading again
          </button>
        </div>
      ) : (
        <>
          <section className="border-t-4 border-teal-800 bg-white p-6 sm:p-8">
            <p className="text-sm font-medium text-teal-800">
              {resume?.isPrimary
                ? 'Primary resume'
                : resume
                  ? 'Most recent saved upload'
                  : 'Start with an existing resume'}
            </p>
            <h2 className="mt-3 break-words text-2xl font-semibold text-slate-950">
              {resume?.fileName ||
                'Save a resume, then choose your target job.'}
            </h2>
            <p className="mt-3 text-slate-600">
              {resume
                ? 'This file is ready to reuse. Each new review keeps its submitted source.'
                : 'Upload the resume you intend to use. You can reuse saved uploads on later visits.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                className={ui.button.primary}
                type="button"
                onClick={() => {
                  const s = useAnalysisStore.getState()
                  s.resetJdOnly()
                  s.setAnalysisMode('JOB_MATCH')
                  if (resume) s.setUploadedDoc(resume)
                  navigate('/app/analyzer?mode=job-match')
                }}
              >
                Review a new job →
              </button>
              {loggedIn && (
                <Link className={ui.button.secondary} to="/app/resumes">
                  Choose another saved resume
                </Link>
              )}
            </div>
          </section>
          {!!apps.length && (
            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                Continue an application review
              </h2>
              <ul className="mt-3 divide-y divide-slate-200">
                {apps.map((a) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-4 py-5"
                    key={a.analysisId}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-lg font-semibold text-slate-950">
                        {applicationHeading(a)}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {a.resumeFileName || 'Saved source'} ·{' '}
                        {a.status === 'completed'
                          ? 'Ready to review'
                          : a.status}
                      </p>
                    </div>
                    <Link
                      className={ui.button.secondary}
                      to={`/app/results/${a.analysisId}`}
                    >
                      Continue review
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className={ui.results.link} to="/app/history">
                All applications
              </Link>
            </section>
          )}
        </>
      )}
    </div>
  )
}
