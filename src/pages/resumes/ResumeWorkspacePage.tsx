import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ui } from '../../app/uiTokens'
import {
  downloadResumeDocx,
  fetchResume,
  saveResume,
  validateResumeModel,
  type ResumeGenerationCompletedResponse,
  type ResumeRecord,
  type TailorResumeResponse,
} from '../../api/resumes'
import ResumeWorkspaceView from '../../components/resume/ResumeWorkspaceView'
import AppPageMetadata from '../../components/seo/AppPageMetadata'
import { useToastStore } from '../../store/useToastStore'
import {
  getSampleTemplateWarnings,
  isSampleTemplateResume,
  markResumeAsSampleTemplate,
} from './resumeFlowState'

export const ResumeWorkspaceAlerts = ({
  generationResult,
  generationMode,
  tailorResult,
  sampleTemplateWarnings = [],
}: {
  generationResult?: ResumeGenerationCompletedResponse
  generationMode?: 'experience' | 'sample'
  tailorResult?: TailorResumeResponse
  sampleTemplateWarnings?: string[]
}) => (
  <>
    {generationMode === 'sample' ? (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-amber-950">Sample resume generated</h2>
          <p className="text-sm text-amber-900">Sample resume only - not ready to apply.</p>
        </div>
        {[...sampleTemplateWarnings].filter(Boolean).length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {[...sampleTemplateWarnings].filter(Boolean).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    ) : generationResult ? (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-amber-950">Resume generated</h2>
          <p className="text-sm text-amber-900">
            Review the generated content before using it. The guidance below came from the generation run.
          </p>
        </div>
        {[
          ...generationResult.requiresUserInput,
          ...generationResult.assumptions,
          ...generationResult.warnings,
          ...generationResult.readinessWarnings,
        ].filter(Boolean).length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {[
              ...generationResult.requiresUserInput,
              ...generationResult.assumptions,
              ...generationResult.warnings,
              ...generationResult.readinessWarnings,
            ]
              .filter(Boolean)
              .map((item) => (
                <li key={item}>{item}</li>
              ))}
          </ul>
        ) : null}
      </div>
    ) : null}
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
        {tailorResult.missingRequirements.length > 0 ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-blue-950">Missing requirements</p>
            <p className="mt-1 text-sm text-blue-900">Use this only if true for your experience.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-900">
              {tailorResult.missingRequirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {tailorResult.sampleExamples.length > 0 ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-blue-950">Examples to adapt</p>
            <p className="mt-1 text-sm text-blue-900">Use this only if true for your experience.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-900">
              {tailorResult.sampleExamples.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {tailorResult.requiresUserInput.length > 0 ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-blue-950">Needs your confirmation</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-900">
              {tailorResult.requiresUserInput.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    ) : null}
  </>
)

const ResumeWorkspacePage = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const showToast = useToastStore((state) => state.showToast)
  const tailorResult = (location.state as { tailorResult?: TailorResumeResponse } | null)?.tailorResult
  const generationResult = (location.state as { generationResult?: ResumeGenerationCompletedResponse } | null)?.generationResult
  const generationMode = (location.state as { generationMode?: 'experience' | 'sample' } | null)?.generationMode
  const [resume, setResume] = useState<ResumeRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [structuralErrors, setStructuralErrors] = useState<string[]>([])

  useEffect(() => {
    if (generationMode === 'sample' && generationResult?.resumeId) {
      markResumeAsSampleTemplate(generationResult.resumeId)
    }
  }, [generationMode, generationResult])

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

  const isSampleTemplate = isSampleTemplateResume({
    id: resume.id,
    title: resume.title,
  })
  const sampleTemplateWarnings =
    generationMode === 'sample' && generationResult
      ? [
          ...generationResult.requiresUserInput,
          ...generationResult.assumptions,
          ...generationResult.warnings,
          ...generationResult.readinessWarnings,
        ]
      : isSampleTemplate
        ? getSampleTemplateWarnings(resume)
        : []

  return (
    <div className="space-y-5">
      <AppPageMetadata title={`${resume.title} | Rethink Resume`} description="Edit and manage a structured resume." />
      <ResumeWorkspaceAlerts
        generationResult={generationResult}
        generationMode={generationMode === 'sample' || isSampleTemplate ? 'sample' : generationMode}
        tailorResult={tailorResult}
        sampleTemplateWarnings={sampleTemplateWarnings}
      />
      <ResumeWorkspaceView
        resume={resume}
        saving={saving}
        downloading={downloading}
        isSampleTemplate={isSampleTemplate}
        onChange={setResume}
        structuralErrors={structuralErrors}
        onSave={handleSave}
        onDownloadDocx={handleDownload}
      />
    </div>
  )
}

export default ResumeWorkspacePage
