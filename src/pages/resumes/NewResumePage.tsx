import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ui } from '../../app/uiTokens'
import AppPageMetadata from '../../components/seo/AppPageMetadata'
import {
  createBlankResumeModel,
  createResumeDraft,
  fetchResumes,
  pollResumeGeneration,
  startResumeGeneration,
  tailorResume,
  type GenerateResumeRequest,
  type ResumeGenerationResponse,
  type ResumeListItem,
} from '../../api/resumes'
import { markResumeAsSampleTemplate } from './resumeFlowState'
import { useToastStore } from '../../store/useToastStore'

export type CreationMode = 'tailor' | 'experience' | 'sample' | 'blank'

const initialNotes = {
  title: '',
  targetRole: '',
  seniority: '',
  jobDescription: '',
  experienceText: '',
  skillsText: '',
  educationText: '',
  additionalInstructions: '',
}

const creationOptions: {
  id: CreationMode
  label: string
  description: string
  cta: string
  recommended?: boolean
}[] = [
  {
    id: 'tailor',
    label: 'Tailor my resume for a job',
    description:
      'Select or upload your base resume, paste a job description, and get a tailored version with changes, gaps, and examples.',
    cta: 'Tailor resume',
    recommended: true,
  },
  {
    id: 'experience',
    label: 'Build from my experience',
    description:
      'Paste your career notes, LinkedIn summary, or project details and generate a structured resume draft.',
    cta: 'Build from experience',
  },
  {
    id: 'sample',
    label: 'See sample resume for a job',
    description:
      'Paste a job description to see what a strong resume for this role could look like. Use it as inspiration, not as your final resume.',
    cta: 'View sample',
  },
  {
    id: 'blank',
    label: 'Start blank',
    description: 'Create a structured resume manually.',
    cta: 'Start blank',
  },
]

export const getDefaultTailorResumeId = (savedResumes: ResumeListItem[]) =>
  savedResumes.length === 1 ? savedResumes[0].id : ''

export const buildGenerateResumeRequest = (
  mode: Extract<CreationMode, 'experience' | 'sample'>,
  notes: typeof initialNotes,
): GenerateResumeRequest => ({
  title: notes.title,
  targetRole: notes.targetRole,
  seniority: notes.seniority,
  generationMode: mode === 'sample' ? 'sample_from_job_description' : 'from_experience',
  jobDescription: notes.jobDescription,
  experienceText: notes.experienceText,
  skillsText: notes.skillsText,
  educationText: notes.educationText,
  additionalInstructions: notes.additionalInstructions,
})

type ResumeGenerationViewState = {
  generationId: string
  status: ResumeGenerationResponse['status']
  errorMessage?: string
  networkError?: string
  startedAtMs: number
}

const LONG_RUNNING_MS = 45_000

export const resumeWorkspacePath = (resumeId: string) => `/app/resumes/${resumeId}`

export const getResumeGenerationPrimaryMessage = (
  mode: Extract<CreationMode, 'experience' | 'sample'>,
  status: ResumeGenerationResponse['status'],
) => {
  if (status === 'queued') return 'Queued for generation...'
  if (status === 'failed') return 'Resume generation failed.'
  if (mode === 'sample') {
    return 'Creating a sample resume/template. Replace all examples with your real experience before applying.'
  }
  return 'Generating your resume from your experience...'
}

export const ResumeGenerationStatusCard = ({
  mode,
  generation,
  onRetry,
}: {
  mode: Extract<CreationMode, 'experience' | 'sample'>
  generation: ResumeGenerationViewState
  onRetry: () => void
}) => {
  const isSlow = Date.now() - generation.startedAtMs >= LONG_RUNNING_MS
  const isFailed = generation.status === 'failed'

  return (
    <div className={`${ui.card.paddedLg} max-w-3xl space-y-4`}>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-blue-700">Resume Workspace</p>
        <h1 className={ui.text.h2}>{isFailed ? 'Generation failed' : 'Generating your resume'}</h1>
        <p className={ui.text.subtitle}>{getResumeGenerationPrimaryMessage(mode, generation.status)}</p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <p>Generating your resume. This can take up to a minute.</p>
        {isSlow ? (
          <p className="mt-2">This is taking longer than expected. You can keep this page open or try again.</p>
        ) : null}
        {generation.networkError ? <p className="mt-2">{generation.networkError}</p> : null}
        {isFailed && generation.errorMessage ? <p className="mt-2">{generation.errorMessage}</p> : null}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <p className="font-medium text-gray-900">Generation ID</p>
        <p className="mt-1 break-all">{generation.generationId}</p>
      </div>

      {isFailed ? (
        <div className="flex gap-3">
          <button type="button" className={ui.button.primary} onClick={onRetry}>
            Retry generation
          </button>
        </div>
      ) : null}
    </div>
  )
}

const CreateFlowCards = ({
  mode,
  onModeChange,
}: {
  mode: CreationMode
  onModeChange: (mode: CreationMode) => void
}) => (
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    {creationOptions.map((option) => {
      const selected = mode === option.id
      return (
        <button
          key={option.id}
          type="button"
          aria-pressed={selected}
          className={`rounded-lg border p-4 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
          }`}
          onClick={() => onModeChange(option.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-semibold text-gray-900">{option.label}</p>
            {option.recommended ? (
              <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-900">
                Recommended
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-gray-600">{option.description}</p>
          <p className="mt-4 text-sm font-semibold text-blue-700">{option.cta}</p>
        </button>
      )
    })}
  </div>
)

const TailorBaseResumeSection = ({
  savedResumes,
  savedResumesLoading,
  selectedBaseResumeId,
  onBaseResumeChange,
  onModeChange,
  onUploadResume,
}: {
  savedResumes: ResumeListItem[]
  savedResumesLoading: boolean
  selectedBaseResumeId: string
  onBaseResumeChange: (resumeId: string) => void
  onModeChange: (mode: CreationMode) => void
  onUploadResume: () => void
}) => {
  if (savedResumesLoading) {
    return <p className={ui.text.subtitle}>Loading your saved resumes...</p>
  }

  if (savedResumes.length === 0) {
    return (
      <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-amber-950">Choose a base resume first</h2>
          <p className="text-sm text-amber-900">
            Tailoring needs a real base resume. Upload a resume for analysis, build from your experience, or
            start blank first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={ui.button.secondary} onClick={onUploadResume}>
            Upload resume for analysis
          </button>
          <button type="button" className={ui.button.secondary} onClick={() => onModeChange('experience')}>
            Build from experience
          </button>
          <button type="button" className={ui.button.secondary} onClick={() => onModeChange('blank')}>
            Start blank
          </button>
        </div>
      </div>
    )
  }

  if (savedResumes.length === 1) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-900">Base resume</p>
        <p className="mt-1 text-sm text-gray-700">
          {savedResumes[0].title} is selected automatically because it is your only saved resume.
        </p>
      </div>
    )
  }

  return (
    <label className="block space-y-1" htmlFor="base-resume">
      <span className="text-sm font-semibold text-gray-800">Base resume</span>
      <select
        id="base-resume"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        value={selectedBaseResumeId}
        onChange={(event) => onBaseResumeChange(event.target.value)}
      >
        <option value="">Select a saved resume</option>
        {savedResumes.map((resume) => (
          <option key={resume.id} value={resume.id}>
            {resume.title}
          </option>
        ))}
      </select>
    </label>
  )
}

export const NewResumeFormView = ({
  mode,
  notes,
  submitting = false,
  generation,
  savedResumes,
  savedResumesLoading = false,
  selectedBaseResumeId = '',
  onModeChange,
  onBaseResumeChange,
  onNoteChange,
  onSubmit,
  onCancel,
  onRetryGeneration,
  onUploadResume,
}: {
  mode: CreationMode
  notes: typeof initialNotes
  submitting?: boolean
  generation?: ResumeGenerationViewState | null
  savedResumes: ResumeListItem[]
  savedResumesLoading?: boolean
  selectedBaseResumeId?: string
  onModeChange: (mode: CreationMode) => void
  onBaseResumeChange: (resumeId: string) => void
  onNoteChange: (field: keyof typeof initialNotes, value: string) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  onRetryGeneration?: () => void
  onUploadResume: () => void
}) => {
  if (generation) {
    return (
      <div className="p-6">
        <AppPageMetadata title="Build Resume | Rethink Resume" description="Create a structured resume draft." />
        <ResumeGenerationStatusCard
          mode={mode === 'sample' ? 'sample' : 'experience'}
          generation={generation}
          onRetry={onRetryGeneration ?? (() => undefined)}
        />
      </div>
    )
  }

  const selectedOption = creationOptions.find((option) => option.id === mode) ?? creationOptions[0]
  const hasJobDescription = notes.jobDescription.trim().length > 0
  const canSubmitTailor = Boolean(selectedBaseResumeId) && hasJobDescription

  return (
    <form className="space-y-5 p-6" onSubmit={onSubmit}>
      <AppPageMetadata title="Build Resume | Rethink Resume" description="Create or tailor your resume." />
      <div className={ui.layout.header}>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-700">Resume Workspace</p>
          <h1 className={ui.text.h2}>Create or tailor your resume</h1>
          <p className={ui.text.subtitle}>
            Use your real experience to create a resume, tailor an existing resume to a job, or view a
            sample resume for inspiration.
          </p>
        </div>
      </div>

      <CreateFlowCards mode={mode} onModeChange={onModeChange} />

      <div className={`${ui.card.paddedLg} max-w-4xl space-y-4`}>
        {mode !== 'tailor' ? (
          <label className="block space-y-1" htmlFor="resume-title">
            <span className="text-sm font-semibold text-gray-800">Title</span>
            <input
              id="resume-title"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={notes.title}
              onChange={(event) => onNoteChange('title', event.target.value)}
              placeholder={mode === 'sample' ? 'Sample template - Backend Engineer' : 'Senior Frontend Engineer Resume'}
            />
          </label>
        ) : null}

        {mode === 'tailor' ? (
          <>
            <TailorBaseResumeSection
              savedResumes={savedResumes}
              savedResumesLoading={savedResumesLoading}
              selectedBaseResumeId={selectedBaseResumeId}
              onBaseResumeChange={onBaseResumeChange}
              onModeChange={onModeChange}
              onUploadResume={onUploadResume}
            />
            <label className="block space-y-1" htmlFor="tailor-job-description">
              <span className="text-sm font-semibold text-gray-800">Job description</span>
              <textarea
                id="tailor-job-description"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={8}
                value={notes.jobDescription}
                onChange={(event) => onNoteChange('jobDescription', event.target.value)}
                placeholder="Paste the job description here."
              />
            </label>
            <label className="block space-y-1" htmlFor="tailor-target-role">
              <span className="text-sm font-semibold text-gray-800">Optional target role</span>
              <input
                id="tailor-target-role"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={notes.targetRole}
                onChange={(event) => onNoteChange('targetRole', event.target.value)}
                placeholder="Senior Platform Engineer"
              />
            </label>
            <label className="block space-y-1" htmlFor="tailor-additional-instructions">
              <span className="text-sm font-semibold text-gray-800">Optional additional instructions</span>
              <textarea
                id="tailor-additional-instructions"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={4}
                value={notes.additionalInstructions}
                onChange={(event) => onNoteChange('additionalInstructions', event.target.value)}
                placeholder="Emphasize leadership, but do not overstate Kubernetes ownership."
              />
            </label>
          </>
        ) : null}

        {mode === 'experience' ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1" htmlFor="target-role">
                <span className="text-sm font-semibold text-gray-800">Target role</span>
                <input
                  id="target-role"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={notes.targetRole}
                  onChange={(event) => onNoteChange('targetRole', event.target.value)}
                  placeholder="Frontend Engineer"
                />
              </label>
              <label className="block space-y-1" htmlFor="seniority">
                <span className="text-sm font-semibold text-gray-800">Seniority</span>
                <input
                  id="seniority"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={notes.seniority}
                  onChange={(event) => onNoteChange('seniority', event.target.value)}
                  placeholder="Senior"
                />
              </label>
            </div>
            {[
              ['experienceText', 'Experience notes', 'Paste role history, accomplishments, metrics, and systems worked on.', 7],
              ['skillsText', 'Skills notes', 'List technical skills, tools, domains, and workflows.', 4],
              ['educationText', 'Education notes', 'Degrees, certifications, coursework, or training.', 4],
              ['jobDescription', 'Optional job description', 'Paste a job description if you want the draft targeted to a role.', 6],
              ['additionalInstructions', 'Additional instructions', 'Tone, constraints, role focus, or claims to avoid.', 4],
            ].map(([field, label, placeholder, rows]) => (
              <label key={field} className="block space-y-1" htmlFor={field}>
                <span className="text-sm font-semibold text-gray-800">{label}</span>
                <textarea
                  id={field}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  rows={Number(rows)}
                  value={notes[field as keyof typeof notes]}
                  onChange={(event) => onNoteChange(field as keyof typeof notes, event.target.value)}
                  placeholder={placeholder}
                />
              </label>
            ))}
            {hasJobDescription ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                We will use the job description to target the draft, but only your provided experience will be
                used as real resume content.
              </div>
            ) : null}
          </>
        ) : null}

        {mode === 'sample' ? (
          <>
            <label className="block space-y-1" htmlFor="sample-target-role">
              <span className="text-sm font-semibold text-gray-800">Target role</span>
              <input
                id="sample-target-role"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={notes.targetRole}
                onChange={(event) => onNoteChange('targetRole', event.target.value)}
                placeholder="Staff Backend Engineer"
              />
            </label>
            <label className="block space-y-1" htmlFor="sample-job-description">
              <span className="text-sm font-semibold text-gray-800">Job description</span>
              <textarea
                id="sample-job-description"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={8}
                value={notes.jobDescription}
                onChange={(event) => onNoteChange('jobDescription', event.target.value)}
                placeholder="Paste the job description here."
              />
            </label>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              This creates a sample resume/template for inspiration. It is not your completed resume. Replace all
              examples with your real experience before applying.
            </div>
          </>
        ) : null}

        {mode === 'blank' ? (
          <p className={ui.text.subtitle}>Start blank creates a minimal structured ResumeModel you can fill in manually.</p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            className={ui.button.primary}
            disabled={
              submitting ||
              (mode === 'tailor' && !canSubmitTailor) ||
              (mode === 'sample' && !hasJobDescription)
            }
          >
            {submitting ? 'Creating...' : selectedOption.cta}
          </button>
          <button type="button" className={ui.button.secondary} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}

const NewResumePage = () => {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const [mode, setMode] = useState<CreationMode>('tailor')
  const [notes, setNotes] = useState(initialNotes)
  const [submitting, setSubmitting] = useState(false)
  const [generation, setGeneration] = useState<ResumeGenerationViewState | null>(null)
  const [savedResumes, setSavedResumes] = useState<ResumeListItem[]>([])
  const [savedResumesLoading, setSavedResumesLoading] = useState(false)
  const [selectedBaseResumeId, setSelectedBaseResumeId] = useState('')
  const pollAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setSavedResumesLoading(true)
      try {
        const items = await fetchResumes()
        if (cancelled) return
        setSavedResumes(items)
        setSelectedBaseResumeId((current) => current || getDefaultTailorResumeId(items))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load saved resumes.'
        if (!cancelled) showToast({ type: 'error', title: 'Resume load failed', message })
      } finally {
        if (!cancelled) setSavedResumesLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [showToast])

  const updateNote = (field: keyof typeof notes, value: string) => {
    setNotes((current) => ({ ...current, [field]: value }))
  }

  const beginGeneratedResumeFlow = async (nextMode: Extract<CreationMode, 'experience' | 'sample'>) => {
    pollAbortRef.current?.abort()
    setSubmitting(true)
    setGeneration(null)
    try {
      const start = await startResumeGeneration(buildGenerateResumeRequest(nextMode, notes))
      const nextGeneration: ResumeGenerationViewState = {
        generationId: start.generationId,
        status: start.status,
        startedAtMs: Date.now(),
      }
      setGeneration(nextGeneration)

      const controller = new AbortController()
      pollAbortRef.current = controller
      const completed = await pollResumeGeneration(start.generationId, {
        signal: controller.signal,
        onUpdate: (response) => {
          setGeneration((current) =>
            current == null
              ? current
              : {
                  ...current,
                  status: response.status,
                  errorMessage: response.status === 'failed' ? response.errorMessage : undefined,
                  networkError: undefined,
                },
          )
        },
        onPollError: (error) => {
          setGeneration((current) =>
            current == null
              ? current
              : {
                  ...current,
                  networkError: `We hit a connection issue while checking progress. Retrying... (${error.message})`,
                },
          )
        },
      })

      if (nextMode === 'sample') {
        markResumeAsSampleTemplate(completed.resumeId)
      }

      navigate(resumeWorkspacePath(completed.resumeId), {
        state: { generationResult: completed, generationMode: nextMode },
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Could not create resume.'
      setGeneration((current) =>
        current == null
          ? current
          : {
              ...current,
              status: 'failed',
              errorMessage: message,
            },
      )
      if (generation == null) {
        showToast({ type: 'error', title: 'Resume creation failed', message })
      }
    } finally {
      setSubmitting(false)
      pollAbortRef.current = null
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'blank') {
        const resume = await createResumeDraft(notes.title || 'Untitled resume', createBlankResumeModel())
        navigate(resumeWorkspacePath(resume.id))
        return
      }

      if (mode === 'tailor') {
        if (!selectedBaseResumeId || !notes.jobDescription.trim()) return
        const tailored = await tailorResume(selectedBaseResumeId, {
          jobDescription: notes.jobDescription,
          targetRole: notes.targetRole,
          additionalInstructions: notes.additionalInstructions,
        })
        navigate(resumeWorkspacePath(tailored.id), { state: { tailorResult: tailored } })
        return
      }

      await beginGeneratedResumeFlow(mode)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create resume.'
      showToast({ type: 'error', title: mode === 'tailor' ? 'Tailoring failed' : 'Resume creation failed', message })
    } finally {
      if (mode === 'blank' || mode === 'tailor') {
        setSubmitting(false)
      }
    }
  }

  useEffect(() => () => pollAbortRef.current?.abort(), [])

  return (
    <NewResumeFormView
      mode={mode}
      notes={notes}
      submitting={submitting}
      generation={generation}
      savedResumes={savedResumes}
      savedResumesLoading={savedResumesLoading}
      selectedBaseResumeId={selectedBaseResumeId}
      onModeChange={setMode}
      onBaseResumeChange={setSelectedBaseResumeId}
      onNoteChange={updateNote}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/app/resumes')}
      onRetryGeneration={() => {
        if (mode === 'experience' || mode === 'sample') {
          void beginGeneratedResumeFlow(mode)
        }
      }}
      onUploadResume={() => navigate('/app/analyzer')}
    />
  )
}

export default NewResumePage
