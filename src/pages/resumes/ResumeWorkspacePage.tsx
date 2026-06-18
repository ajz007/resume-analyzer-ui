import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ui } from '../../app/uiTokens'
import {
  downloadResumeDocx,
  fetchResume,
  saveResume,
  validateResumeModel,
  type ResumeRecord,
  type TailorResumeResponse,
} from '../../api/resumes'
import ResumeWorkspaceView from '../../components/resume/ResumeWorkspaceView'
import AppPageMetadata from '../../components/seo/AppPageMetadata'
import { useToastStore } from '../../store/useToastStore'

const ResumeWorkspacePage = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const showToast = useToastStore((state) => state.showToast)
  const tailorResult = (location.state as { tailorResult?: TailorResumeResponse } | null)?.tailorResult
  const [resume, setResume] = useState<ResumeRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [structuralErrors, setStructuralErrors] = useState<string[]>([])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const fetched = await fetchResume(id)
        if (!cancelled) setResume(fetched)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load resume.'
        if (!cancelled) showToast({ type: 'error', title: 'Resume load failed', message })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, showToast])

  const handleSave = async () => {
    if (!id || !resume) return
    const validation = validateResumeModel(resume.resume)
    setStructuralErrors(validation.structuralErrors)
    if (validation.structuralErrors.length > 0) {
      showToast({
        type: 'error',
        title: 'Fix structural errors',
        message: validation.structuralErrors[0],
      })
      return
    }

    setSaving(true)
    try {
      const saved = await saveResume(resume)
      setResume(saved)
      setStructuralErrors([])
      showToast({ type: 'success', title: 'Resume saved', message: 'Your workspace changes were saved.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save resume.'
      showToast({ type: 'error', title: 'Save failed', message })
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!id || !resume) return
    const validation = validateResumeModel(resume.resume)
    setStructuralErrors(validation.structuralErrors)
    if (validation.structuralErrors.length > 0) {
      showToast({
        type: 'error',
        title: 'Fix structural errors',
        message: validation.structuralErrors[0],
      })
      return
    }

    setDownloading(true)
    try {
      await downloadResumeDocx(id, resume.title)
      setStructuralErrors([])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not download DOCX.'
      showToast({ type: 'error', title: 'Download failed', message })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <div className={`${ui.card.base} p-8 text-center text-gray-700`}>Loading resume...</div>
  }

  if (!resume) {
    return (
      <div className={`${ui.card.base} p-8 text-center space-y-2`}>
        <h1 className="text-xl font-bold text-gray-900">Resume not found</h1>
        <p className={ui.text.subtitle}>Open a saved resume or create a new workspace draft.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <AppPageMetadata title={`${resume.title} | Rethink Resume`} description="Edit and manage a structured resume." />
      {tailorResult ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-blue-950">Tailored resume created</h2>
            <p className="text-sm text-blue-900">
              Source: {tailorResult.sourceResumeId || 'unknown'} / {tailorResult.sourceVersionId || 'unknown'}
            </p>
          </div>
          {tailorResult.changes.length > 0 ? (
            <div className="mt-3 space-y-2">
              {tailorResult.changes.map((change, idx) => (
                <div key={`${change.section ?? 'change'}-${idx}`} className="rounded border border-blue-100 bg-white p-3">
                  <p className="text-sm font-semibold text-gray-900">{change.section || `Change ${idx + 1}`}</p>
                  <p className="mt-1 text-sm text-gray-700">Reason: {change.reason || 'Not provided'}</p>
                  <p className="mt-1 text-sm text-gray-700">Risk: {change.risk || 'Review for accuracy.'}</p>
                </div>
              ))}
            </div>
          ) : null}
          {[...tailorResult.missingRequirements, ...tailorResult.warnings, ...tailorResult.readinessWarnings].length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-blue-900">
              {[...tailorResult.missingRequirements, ...tailorResult.warnings, ...tailorResult.readinessWarnings].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <ResumeWorkspaceView
        resume={resume}
        saving={saving}
        downloading={downloading}
        onChange={setResume}
        structuralErrors={structuralErrors}
        onSave={handleSave}
        onDownloadDocx={handleDownload}
      />
    </div>
  )
}

export default ResumeWorkspacePage
