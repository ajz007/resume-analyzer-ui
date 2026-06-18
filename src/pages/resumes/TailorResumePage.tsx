import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ui } from '../../app/uiTokens'
import {
  fetchResume,
  tailorResume,
  type ResumeRecord,
  type TailorResumeResponse,
} from '../../api/resumes'
import AppPageMetadata from '../../components/seo/AppPageMetadata'
import { useToastStore } from '../../store/useToastStore'

export const TailorResultPanel = ({
  result,
  onOpen,
}: {
  result: TailorResumeResponse
  onOpen?: () => void
}) => {
  const requiresUserInput = result.requiresUserInput ?? []
  const assumptions = result.assumptions ?? []

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
    <section className={`${ui.card.paddedLg} min-w-0`}>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-gray-900">Generated tailored resume</h2>
        <p className={ui.text.subtitle}>{result.title}</p>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">Summary</p>
          <p className="mt-1 text-sm leading-6 text-gray-700">{result.resume.summary || 'No summary.'}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Skills</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.resume.skills.map((skill) => (
              <span key={skill} className="rounded-full border bg-gray-50 px-3 py-1 text-sm text-gray-800">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-800">Changes</p>
          {result.changes.length === 0 ? <p className={ui.text.subtitle}>No changes returned.</p> : null}
          {result.changes.map((change, idx) => (
            <article key={`${change.section ?? 'change'}-${idx}`} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{change.section || `Change ${idx + 1}`}</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Before</p>
                  <p className="mt-1 text-sm text-gray-800">{change.before || 'Not provided'}</p>
                </div>
                <div className="rounded bg-blue-50 p-3">
                  <p className="text-xs font-semibold uppercase text-blue-700">After</p>
                  <p className="mt-1 text-sm text-gray-900">{change.after || 'Not provided'}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Reason</p>
                  <p className="mt-1 text-sm text-gray-800">{change.reason || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Risk</p>
                  <p className="mt-1 text-sm text-gray-800">{change.risk || 'Review for accuracy.'}</p>
                </div>
              </div>
              {change.requiresUserInput?.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Requires user input</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-800">
                    {change.requiresUserInput.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {change.assumptions?.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Assumptions</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-800">
                    {change.assumptions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {change.warnings?.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Warnings</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-800">
                    {change.warnings.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>

    <aside className="space-y-4">
      <div className={ui.card.padded}>
        <button type="button" className={`${ui.button.primary} w-full`} onClick={onOpen}>
          Open tailored resume
        </button>
        <p className="mt-2 text-sm text-gray-600">
          Source: {result.sourceResumeId || 'unknown'} / {result.sourceVersionId || 'unknown'}
        </p>
      </div>
      <div className={ui.card.padded}>
        <h2 className="text-sm font-semibold text-gray-900">Missing requirements</h2>
        {result.missingRequirements.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {result.missingRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-600">No missing requirements returned.</p>
        )}
      </div>
      <div className={ui.card.padded}>
        <h2 className="text-sm font-semibold text-gray-900">Warnings</h2>
        {result.warnings.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {result.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-600">No warnings returned.</p>
        )}
      </div>
      <div className={ui.card.padded}>
        <h2 className="text-sm font-semibold text-gray-900">Requires user input</h2>
        {requiresUserInput.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {requiresUserInput.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-600">No user input requests returned.</p>
        )}
      </div>
      <div className={ui.card.padded}>
        <h2 className="text-sm font-semibold text-gray-900">Assumptions</h2>
        {assumptions.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-600">No assumptions returned.</p>
        )}
      </div>
    </aside>
    </div>
  )
}

const TailorResumePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const [baseResume, setBaseResume] = useState<ResumeRecord | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<TailorResumeResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const load = async () => {
      try {
        const fetched = await fetchResume(id)
        if (!cancelled) setBaseResume(fetched)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load resume.'
        if (!cancelled) showToast({ type: 'error', title: 'Resume load failed', message })
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, showToast])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!id || !jobDescription.trim()) return
    setLoading(true)
    try {
      const tailored = await tailorResume(id, jobDescription)
      setResult(tailored)
      navigate(`/app/resumes/${tailored.id}`, { state: { tailorResult: tailored } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not tailor resume.'
      showToast({ type: 'error', title: 'Tailoring failed', message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 p-6">
      <AppPageMetadata title="Tailor Resume | Rethink Resume" description="Tailor a resume to a job description." />
      <div className={ui.layout.header}>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-700">Resume Workspace</p>
          <h1 className={ui.text.h2}>Tailor for this job</h1>
          <p className={ui.text.subtitle}>
            Paste a job description and review the generated tailored resume before saving.
          </p>
        </div>
        <button type="button" className={ui.button.secondary} onClick={() => navigate(`/app/resumes/${id}`)}>
          Back to workspace
        </button>
      </div>

      <form className={`${ui.card.paddedLg} max-w-4xl`} onSubmit={handleSubmit}>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">{baseResume?.title ?? 'Resume'}</h2>
          <p className={ui.text.subtitle}>The generated version should be reviewed for accuracy before saving.</p>
        </div>
        <label className="block space-y-1" htmlFor="job-description">
          <span className="text-sm font-semibold text-gray-800">Job description</span>
          <textarea
            id="job-description"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            rows={10}
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the JD here."
          />
        </label>
        <button type="submit" className={ui.button.primary} disabled={loading || !jobDescription.trim()}>
          {loading ? 'Tailoring...' : 'Tailor for this job'}
        </button>
      </form>

      {result ? (
        <TailorResultPanel result={result} onOpen={() => navigate(`/app/resumes/${result.id}`)} />
      ) : null}
    </div>
  )
}

export default TailorResumePage
