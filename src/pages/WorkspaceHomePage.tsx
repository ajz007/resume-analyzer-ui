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
import { startNewJobReview } from '../components/NewJobLink'
import { ui } from '../app/uiTokens'
import AppPageMetadata from '../components/seo/AppPageMetadata'

export default function WorkspaceHomePage() {
  const [resume, setResume] = useState<PrimaryResume | null>(null)
  const [apps, setApps] = useState<Application[]>([])
  const [sourceStatus, setSourceStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [appsStatus, setAppsStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reload, setReload] = useState(0)
  const navigate = useNavigate()
  const token = useWorkspaceIdentity()
  const loggedIn = !!token
  useEffect(() => {
    let active = true
    setResume(null)
    setApps([])
    setSourceStatus('loading')
    setAppsStatus(loggedIn ? 'loading' : 'ready')
    void fetchPrimaryResume()
      .then((value) => {
        if (active) {
          setResume(value)
          setSourceStatus('ready')
        }
      })
      .catch(() => {
        if (active) setSourceStatus('error')
      })
    if (loggedIn)
      void fetchApplications({ limit: 3 })
        .then((value) => {
          if (active) {
            setApps(value)
            setAppsStatus('ready')
          }
        })
        .catch(() => {
          if (active) setAppsStatus('error')
        })
    return () => {
      active = false
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
        description="Reuse a saved resume and continue a job-specific application review."
      />
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-800">Your next application</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
          Bring the job. Start with your experience.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Understand the fit, choose truthful improvements and return to the same review later.
        </p>
      </header>
      <section className="space-y-4 rounded-xl border border-slate-200 border-t-4 border-t-teal-800 bg-white p-6 sm:p-8">
        <p className="text-sm font-medium text-teal-800">
          {resume?.isPrimary ? 'Primary resume' : resume ? 'Most recent saved upload' : 'Start with an existing resume'}
        </p>
        {sourceStatus === 'loading' ? (
          <p role="status">Loading your saved source…</p>
        ) : sourceStatus === 'error' ? (
          <div role="alert">
            <p>Your saved source could not be loaded. You can still start a review and choose a file there.</p>
            <button type="button" className={ui.results.link} onClick={() => setReload((n) => n + 1)}>
              Try loading the source again
            </button>
          </div>
        ) : (
          <>
            <h2 className="break-words text-2xl font-semibold">
              {resume?.fileName || 'Choose a resume for your next review.'}
            </h2>
            <p className="text-slate-600">
              {resume
                ? 'Reuse this file. Earlier reviews keep the source they started with.'
                : 'Upload your current resume. You can reuse saved uploads on later visits.'}
            </p>
          </>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={ui.button.primary}
            onClick={() => {
              startNewJobReview()
              if (resume) useAnalysisStore.getState().setUploadedDoc(resume)
              navigate('/app/analyzer?mode=job-match')
            }}
          >
            Review a new job
          </button>
          {loggedIn ? (
            <Link className={ui.button.secondary} to="/app/resumes">
              Choose another saved resume
            </Link>
          ) : null}
        </div>
      </section>
      {loggedIn ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Continue an application review</h2>
          {appsStatus === 'loading' ? (
            <p role="status">Loading applications…</p>
          ) : appsStatus === 'error' ? (
            <div role="alert">
              <p>Your recent applications could not be loaded. You can still start a review above.</p>
              <button type="button" className={ui.results.link} onClick={() => setReload((n) => n + 1)}>
                Try loading applications again
              </button>
            </div>
          ) : apps.length ? (
            <ul className="divide-y divide-slate-200">
              {apps.map((app) => (
                <li key={app.analysisId} className="flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold ${app.status === 'failed' ? 'text-red-800' : 'text-teal-800'}`}
                    >
                      {app.status === 'completed'
                        ? 'Ready to continue'
                        : app.status === 'failed'
                          ? 'Needs attention'
                          : app.status === 'queued'
                            ? 'In the queue'
                            : 'Processing'}
                    </p>
                    <h3 className="mt-2 break-words text-lg font-semibold">{applicationHeading(app)}</h3>
                    <p className="mt-2 break-words text-sm text-slate-600">{app.resumeFileName || 'Saved source'}</p>
                  </div>
                  <Link className={ui.button.secondary} to={`/app/results/${app.analysisId}`}>
                    {app.status === 'completed'
                      ? 'Continue review'
                      : app.status === 'failed'
                        ? 'View issue'
                        : 'View progress'}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">
              Your first review will appear here. Start with a resume and one target job.
            </p>
          )}
          <Link className={ui.results.link} to="/app/history">
            All applications
          </Link>
        </section>
      ) : (
        <p className="text-sm text-slate-600">Sign in to find saved applications across devices.</p>
      )}
    </div>
  )
}
