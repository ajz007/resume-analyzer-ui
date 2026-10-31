import { useAnalysisStore } from '../store/useAnalysisStore'
import { useEffect, useState } from 'react'
import {
  applicationHeading,
  fetchApplication,
  saveApplicationLabels,
  type Application,
} from '../api/workspace'
import { ui } from '../app/uiTokens'

export default function ApplicationContext({
  analysisId,
  onStatus,
  refreshKey = 0,
}: {
  analysisId: string
  refreshKey?: number
  onStatus?: (status: string) => void
}) {
  const [app, setApp] = useState<Application>()
  const [editing, setEditing] = useState(false)
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let cancelled = false
    setError('')
    fetchApplication(analysisId)
      .then((a) => {
        if (!cancelled) {
          setApp(a)
          onStatus?.(a.status)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            'Application labels could not be loaded. Your report is still available below.',
          )
          onStatus?.('unknown')
        }
      })
    return () => {
      cancelled = true
    }
  }, [analysisId, onStatus, refreshKey])
  return (
    <section
      aria-label="Application context"
      className="mb-6 border-b border-slate-200 pb-6"
    >
      {app && (
        <>
          <p className="text-sm font-semibold text-teal-800">
            Application review
          </p>
          <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-slate-950">
            {applicationHeading(app)}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Source: {app.resumeFileName || 'Original submitted file'} ·{' '}
            {app.status === 'completed' ? 'Ready to review' : app.status}
          </p>
        </>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {app && !editing && (
        <button
          className={ui.results.link}
          type="button"
          onClick={() => {
            setCompany(app.companyName)
            setRole(app.targetRole)
            setEditing(true)
          }}
        >
          Edit company and role labels
        </button>
      )}
      {editing && (
        <form
          className="mt-4 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setSaving(true)
            setError('')
            try {
              const a = await saveApplicationLabels(analysisId, {
                companyName: company,
                targetRole: role,
              })
              setApp(a)
              setEditing(false)
              if (useAnalysisStore.getState().analysisId === analysisId)
                useAnalysisStore.setState({ applicationSaveError: undefined })
            } catch {
              setError(
                'Labels were not saved. You can retry here without running another analysis.',
              )
            } finally {
              setSaving(false)
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span>Company (optional)</span>
              <input
                className="w-full rounded border p-3"
                maxLength={120}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={saving}
              />
            </label>
            <label className="space-y-1">
              <span>Target position (optional)</span>
              <input
                className="w-full rounded border p-3"
                maxLength={120}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={saving}
              />
            </label>
          </div>
          <p className="text-sm text-slate-600">
            These labels identify this saved review. They do not change the
            submitted job description, resume or scores.
          </p>
          <div className="flex gap-3">
            <button className={ui.button.primary} disabled={saving}>
              {saving ? 'Saving…' : 'Save labels'}
            </button>
            <button
              className={ui.button.secondary}
              type="button"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
