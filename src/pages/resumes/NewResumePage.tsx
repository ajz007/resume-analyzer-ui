import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ui } from '../../app/uiTokens'
import AppPageMetadata from '../../components/seo/AppPageMetadata'
import {
  createBlankResumeModel,
  createResumeDraft,
  generateResumeFromNotes,
  type GenerateResumeRequest,
  type ResumeRecord,
} from '../../api/resumes'
import { useToastStore } from '../../store/useToastStore'

type CreationMode = 'notes' | 'job_description' | 'blank'

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
}[] = [
  {
    id: 'notes',
    label: 'Start from notes',
    description: 'Paste your experience and generate a structured ATS-friendly resume.',
  },
  {
    id: 'job_description',
    label: 'Start from job description',
    description: 'Create a role-targeted resume template based on a job description.',
  },
  {
    id: 'blank',
    label: 'Start blank',
    description: 'Build manually from a minimal structured draft.',
  },
]

export const buildGenerateResumeRequest = (
  mode: CreationMode,
  notes: typeof initialNotes,
): GenerateResumeRequest => ({
  title: notes.title,
  targetRole: notes.targetRole,
  seniority: notes.seniority,
  generationMode: mode === 'job_description' ? 'from_job_description' : 'from_notes',
  jobDescription: mode === 'job_description' ? notes.jobDescription : '',
  experienceText: notes.experienceText,
  skillsText: notes.skillsText,
  educationText: notes.educationText,
  additionalInstructions: notes.additionalInstructions,
})

const GenerationMessages = ({ result }: { result: ResumeRecord }) => {
  const items = [
    ...result.requiresUserInput,
    ...result.assumptions,
    ...result.warnings,
    ...result.readinessWarnings,
  ].filter(Boolean)
  if (items.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h2 className="text-sm font-semibold text-amber-950">Generation notes</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export const NewResumeFormView = ({
  mode,
  notes,
  submitting = false,
  generatedResult,
  onModeChange,
  onNoteChange,
  onSubmit,
  onCancel,
}: {
  mode: CreationMode
  notes: typeof initialNotes
  submitting?: boolean
  generatedResult?: ResumeRecord | null
  onModeChange: (mode: CreationMode) => void
  onNoteChange: (field: keyof typeof initialNotes, value: string) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
}) => {
  const hasJobDescription = notes.jobDescription.trim().length > 0
  const hasExperienceForJd = notes.experienceText.trim().length > 0

  return (
    <form className="space-y-5 p-6" onSubmit={onSubmit}>
      <AppPageMetadata title="Build Resume | Rethink Resume" description="Create a structured resume draft." />
      <div className={ui.layout.header}>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-700">Resume Workspace</p>
          <h1 className={ui.text.h2}>Create your resume</h1>
          <p className={ui.text.subtitle}>
            Start from your experience, a job description, or a blank structured draft.
          </p>
        </div>
      </div>

      {generatedResult ? <GenerationMessages result={generatedResult} /> : null}

      <div className="grid gap-3 md:grid-cols-3">
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
              <p className="text-base font-semibold text-gray-900">{option.label}</p>
              <p className="mt-1 text-sm text-gray-600">{option.description}</p>
            </button>
          )
        })}
      </div>

      <div className={`${ui.card.paddedLg} max-w-4xl`}>
        <label className="block space-y-1" htmlFor="resume-title">
          <span className="text-sm font-semibold text-gray-800">Title</span>
          <input
            id="resume-title"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={notes.title}
            onChange={(event) => onNoteChange('title', event.target.value)}
            placeholder="Senior Frontend Engineer Resume"
          />
        </label>

        {mode !== 'blank' ? (
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
        ) : null}

        {mode === 'notes' ? (
          <>
            {[
              ['experienceText', 'Experience notes', 'Paste role history, accomplishments, metrics, and systems worked on.'],
              ['skillsText', 'Skills notes', 'List technical skills, tools, domains, and workflows.'],
              ['educationText', 'Education notes', 'Degrees, certifications, coursework, or training.'],
              ['additionalInstructions', 'Additional instructions', 'Tone, constraints, role focus, or claims to avoid.'],
            ].map(([field, label, placeholder]) => (
              <label key={field} className="block space-y-1" htmlFor={field}>
                <span className="text-sm font-semibold text-gray-800">{label}</span>
                <textarea
                  id={field}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  rows={field === 'experienceText' ? 7 : 4}
                  value={notes[field as keyof typeof notes]}
                  onChange={(event) => onNoteChange(field as keyof typeof notes, event.target.value)}
                  placeholder={placeholder}
                />
              </label>
            ))}
          </>
        ) : null}

        {mode === 'job_description' ? (
          <>
            <label className="block space-y-1" htmlFor="jobDescription">
              <span className="text-sm font-semibold text-gray-800">Job description</span>
              <textarea
                id="jobDescription"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={8}
                value={notes.jobDescription}
                onChange={(event) => onNoteChange('jobDescription', event.target.value)}
                placeholder="Paste the job description here."
              />
            </label>
            <label className="block space-y-1" htmlFor="jobExperienceText">
              <span className="text-sm font-semibold text-gray-800">Optional experience notes</span>
              <textarea
                id="jobExperienceText"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={5}
                value={notes.experienceText}
                onChange={(event) => onNoteChange('experienceText', event.target.value)}
                placeholder="Add real experience to generate a more complete draft."
              />
            </label>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {hasJobDescription && !hasExperienceForJd ? (
                <p>
                  We will create a role-targeted resume template from this job description.
                  Add your real experience before applying.
                </p>
              ) : (
                <p>
                  Add experience notes with the job description to generate a more complete structured draft.
                </p>
              )}
            </div>
          </>
        ) : null}

        {mode === 'blank' ? (
          <p className={ui.text.subtitle}>
            Start blank creates a minimal structured draft you can fill in manually.
          </p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            className={ui.button.primary}
            disabled={submitting || (mode === 'job_description' && !hasJobDescription)}
          >
            {submitting
              ? 'Creating...'
              : mode === 'blank'
              ? 'Create blank draft'
              : mode === 'job_description'
              ? 'Generate role-targeted draft'
              : 'Generate Resume'}
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
  const [mode, setMode] = useState<CreationMode>('notes')
  const [notes, setNotes] = useState(initialNotes)
  const [submitting, setSubmitting] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<ResumeRecord | null>(null)

  const updateNote = (field: keyof typeof notes, value: string) => {
    setNotes((current) => ({ ...current, [field]: value }))
  }

  const handleGenerate = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const resume =
        mode === 'blank'
          ? await createResumeDraft(notes.title || 'Untitled resume', createBlankResumeModel())
          : await generateResumeFromNotes(buildGenerateResumeRequest(mode, notes))
      setGeneratedResult(resume)
      navigate(`/app/resumes/${resume.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create resume.'
      showToast({ type: 'error', title: 'Resume creation failed', message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <NewResumeFormView
      mode={mode}
      notes={notes}
      submitting={submitting}
      generatedResult={generatedResult}
      onModeChange={setMode}
      onNoteChange={updateNote}
      onSubmit={handleGenerate}
      onCancel={() => navigate('/app/resumes')}
    />
  )
}

export default NewResumePage
