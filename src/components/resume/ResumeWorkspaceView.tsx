import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ui } from '../../app/uiTokens'
import { createResumeItemId } from '../../api/resumes'
import type {
  ResumeAchievement,
  ResumeCertification,
  ResumeEducation,
  ResumeExperience,
  ResumeModel,
  ResumeProject,
  ResumeRecord,
} from '../../api/resumes'

export type ResumeSectionId =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'achievements'

type ResumeWorkspaceViewProps = {
  resume: ResumeRecord
  selectedSection?: ResumeSectionId
  saving?: boolean
  downloading?: boolean
  structuralErrors?: string[]
  onChange: (resume: ResumeRecord) => void
  onSave: () => void
  onDownloadDocx: () => void
}

const sections: { id: ResumeSectionId; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'achievements', label: 'Achievements' },
]

const emptyExperience = (): ResumeExperience => ({
  id: createResumeItemId('experience'),
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  bullets: [{ id: createResumeItemId('bullet'), text: '' }],
})

const emptyProject = (): ResumeProject => ({
  id: createResumeItemId('project'),
  name: '',
  role: '',
  description: '',
  bullets: [{ id: createResumeItemId('bullet'), text: '' }],
})

const emptyEducation = (): ResumeEducation => ({
  id: createResumeItemId('education'),
  school: '',
  degree: '',
  field: '',
  graduationDate: '',
  details: '',
})

const emptyCertification = (): ResumeCertification => ({
  id: createResumeItemId('certification'),
  name: '',
  issuer: '',
  date: '',
})

const emptyAchievement = (): ResumeAchievement => ({
  id: createResumeItemId('achievement'),
  text: '',
})

export const replaceSkill = (resume: ResumeModel, index: number, value: string): ResumeModel => ({
  ...resume,
  skills: resume.skills.map((skill, idx) => (idx === index ? value : skill)),
})

export const addSkill = (resume: ResumeModel): ResumeModel => ({
  ...resume,
  skills: [...resume.skills, ''],
})

export const removeSkill = (resume: ResumeModel, index: number): ResumeModel => ({
  ...resume,
  skills: resume.skills.filter((_, idx) => idx !== index),
})

export const replaceExperienceBullet = (
  resume: ResumeModel,
  experienceId: string,
  bulletId: string,
  value: string,
): ResumeModel => ({
  ...resume,
  experience: resume.experience.map((item) =>
    item.id === experienceId
      ? {
          ...item,
          bullets: item.bullets.map((bullet) =>
            bullet.id === bulletId ? { ...bullet, text: value } : bullet,
          ),
        }
      : item,
  ),
})

const Field = ({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) => (
  <label className="block space-y-1" htmlFor={id}>
    <span className="text-sm font-semibold text-gray-800">{label}</span>
    <input
      id={id}
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </label>
)

const TextAreaField = ({
  id,
  label,
  value,
  onChange,
  rows = 5,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) => (
  <label className="block space-y-1" htmlFor={id}>
    <span className="text-sm font-semibold text-gray-800">{label}</span>
    <textarea
      id={id}
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </label>
)

const SmallButton = ({
  children,
  onClick,
}: {
  children: string
  onClick: () => void
}) => (
  <button type="button" className="text-sm font-medium text-blue-700 hover:underline" onClick={onClick}>
    {children}
  </button>
)

const ResumeWorkspaceView = ({
  resume,
  selectedSection,
  saving = false,
  downloading = false,
  structuralErrors = [],
  onChange,
  onSave,
  onDownloadDocx,
}: ResumeWorkspaceViewProps) => {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<ResumeSectionId>(selectedSection ?? 'summary')
  const model = resume.resume

  const warnings = useMemo(
    () => resume.readinessWarnings.filter((warning) => warning.trim().length > 0),
    [resume.readinessWarnings],
  )

  const patchResume = (patch: Partial<ResumeModel>) =>
    onChange({ ...resume, resume: { ...model, ...patch } })

  const renderBullets = (
    ownerId: string,
    bullets: { id: string; text: string }[],
    onBulletChange: (bulletId: string, value: string) => void,
    onAdd: () => void,
    onRemove: (bulletId: string) => void,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800">Bullets</p>
        <SmallButton onClick={onAdd}>Add bullet</SmallButton>
      </div>
      {bullets.length === 0 ? <p className={ui.text.subtitle}>No bullets yet.</p> : null}
      {bullets.map((bullet, idx) => (
        <div key={bullet.id} className="flex gap-2">
          <textarea
            aria-label={`${ownerId} bullet ${idx + 1}`}
            className="min-h-20 flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={bullet.text}
            onChange={(event) => onBulletChange(bullet.id, event.target.value)}
          />
          <button
            type="button"
            className="h-10 rounded border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => onRemove(bullet.id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )

  const renderSummary = () => (
    <div className="space-y-4">
      <TextAreaField
        id="resume-summary"
        label="Professional summary"
        value={model.summary}
        onChange={(summary) => patchResume({ summary })}
        placeholder="2-4 lines focused on role, strengths, and evidence."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {(['name', 'email', 'phone', 'location', 'linkedin', 'website'] as const).map((field) => (
          <Field
            key={field}
            id={`contact-${field}`}
            label={field[0].toUpperCase() + field.slice(1)}
            value={model.contact[field] ?? ''}
            onChange={(value) => patchResume({ contact: { ...model.contact, [field]: value } })}
          />
        ))}
      </div>
    </div>
  )

  const renderSkills = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className={ui.text.subtitle}>Keep skills direct and searchable.</p>
        <SmallButton onClick={() => patchResume(addSkill(model))}>Add skill</SmallButton>
      </div>
      {model.skills.length === 0 ? <p className={ui.text.subtitle}>No skills yet.</p> : null}
      {model.skills.map((skill, idx) => (
        <div key={`${idx}-${skill}`} className="flex gap-2">
          <input
            aria-label={`Skill ${idx + 1}`}
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={skill}
            onChange={(event) => patchResume(replaceSkill(model, idx, event.target.value))}
          />
          <button
            type="button"
            className="rounded border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => patchResume(removeSkill(model, idx))}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )

  const renderExperience = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SmallButton onClick={() => patchResume({ experience: [...model.experience, emptyExperience()] })}>
          Add experience
        </SmallButton>
      </div>
      {model.experience.length === 0 ? <p className={ui.text.subtitle}>No experience entries yet.</p> : null}
      {model.experience.map((item) => (
        <section key={item.id} className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900">{item.title || 'Experience'}</h3>
            <button
              type="button"
              className="text-sm text-red-700 hover:underline"
              onClick={() => patchResume({ experience: model.experience.filter((entry) => entry.id !== item.id) })}
            >
              Remove
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field
              id={`${item.id}-title`}
              label="Title"
              value={item.title}
              onChange={(title) =>
                patchResume({
                  experience: model.experience.map((entry) =>
                    entry.id === item.id ? { ...entry, title } : entry,
                  ),
                })
              }
            />
            <Field
              id={`${item.id}-company`}
              label="Company"
              value={item.company}
              onChange={(company) =>
                patchResume({
                  experience: model.experience.map((entry) =>
                    entry.id === item.id ? { ...entry, company } : entry,
                  ),
                })
              }
            />
            <Field
              id={`${item.id}-start`}
              label="Start"
              value={item.startDate ?? ''}
              placeholder="YYYY-MM"
              onChange={(startDate) =>
                patchResume({
                  experience: model.experience.map((entry) =>
                    entry.id === item.id ? { ...entry, startDate } : entry,
                  ),
                })
              }
            />
            <Field
              id={`${item.id}-end`}
              label="End"
              value={item.endDate ?? ''}
              placeholder="YYYY-MM"
              onChange={(endDate) =>
                patchResume({
                  experience: model.experience.map((entry) =>
                    entry.id === item.id ? { ...entry, endDate } : entry,
                  ),
                })
              }
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={item.isCurrent === true}
              onChange={(event) =>
                patchResume({
                  experience: model.experience.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, isCurrent: event.target.checked, endDate: event.target.checked ? '' : entry.endDate }
                      : entry,
                  ),
                })
              }
            />
            Current role
          </label>
          {renderBullets(
            item.id,
            item.bullets,
            (bulletId, text) => patchResume(replaceExperienceBullet(model, item.id, bulletId, text)),
            () =>
              patchResume({
                experience: model.experience.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, bullets: [...entry.bullets, { id: createResumeItemId('bullet'), text: '' }] }
                    : entry,
                ),
              }),
            (bulletId) =>
              patchResume({
                experience: model.experience.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, bullets: entry.bullets.filter((bullet) => bullet.id !== bulletId) }
                    : entry,
                ),
              }),
          )}
        </section>
      ))}
    </div>
  )

  const renderProjects = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SmallButton onClick={() => patchResume({ projects: [...model.projects, emptyProject()] })}>
          Add project
        </SmallButton>
      </div>
      {model.projects.map((item) => (
        <section key={item.id} className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900">{item.name || 'Project'}</h3>
            <button
              type="button"
              className="text-sm text-red-700 hover:underline"
              onClick={() => patchResume({ projects: model.projects.filter((entry) => entry.id !== item.id) })}
            >
              Remove
            </button>
          </div>
          <Field
            id={`${item.id}-name`}
            label="Name"
            value={item.name}
            onChange={(name) =>
              patchResume({
                projects: model.projects.map((entry) => (entry.id === item.id ? { ...entry, name } : entry)),
              })
            }
          />
          <TextAreaField
            id={`${item.id}-description`}
            label="Description"
            value={item.description ?? ''}
            rows={3}
            onChange={(description) =>
              patchResume({
                projects: model.projects.map((entry) =>
                  entry.id === item.id ? { ...entry, description } : entry,
                ),
              })
            }
          />
          {renderBullets(
            item.id,
            item.bullets,
            (bulletId, text) =>
              patchResume({
                projects: model.projects.map((entry) =>
                  entry.id === item.id
                    ? {
                        ...entry,
                        bullets: entry.bullets.map((bullet) =>
                          bullet.id === bulletId ? { ...bullet, text } : bullet,
                        ),
                      }
                    : entry,
                ),
              }),
            () =>
              patchResume({
                projects: model.projects.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, bullets: [...entry.bullets, { id: createResumeItemId('bullet'), text: '' }] }
                    : entry,
                ),
              }),
            (bulletId) =>
              patchResume({
                projects: model.projects.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, bullets: entry.bullets.filter((bullet) => bullet.id !== bulletId) }
                    : entry,
                ),
              }),
          )}
        </section>
      ))}
      {model.projects.length === 0 ? <p className={ui.text.subtitle}>No projects yet.</p> : null}
    </div>
  )

  const renderEducation = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SmallButton onClick={() => patchResume({ education: [...model.education, emptyEducation()] })}>
          Add education
        </SmallButton>
      </div>
      {model.education.map((item) => (
        <section key={item.id} className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900">{item.school || 'Education'}</h3>
            <button
              type="button"
              className="text-sm text-red-700 hover:underline"
              onClick={() => patchResume({ education: model.education.filter((entry) => entry.id !== item.id) })}
            >
              Remove
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field
              id={`${item.id}-school`}
              label="School"
              value={item.school}
              onChange={(school) =>
                patchResume({
                  education: model.education.map((entry) =>
                    entry.id === item.id ? { ...entry, school } : entry,
                  ),
                })
              }
            />
            <Field
              id={`${item.id}-degree`}
              label="Degree"
              value={item.degree ?? ''}
              onChange={(degree) =>
                patchResume({
                  education: model.education.map((entry) =>
                    entry.id === item.id ? { ...entry, degree } : entry,
                  ),
                })
              }
            />
            <Field
              id={`${item.id}-field`}
              label="Field"
              value={item.field ?? ''}
              onChange={(field) =>
                patchResume({
                  education: model.education.map((entry) =>
                    entry.id === item.id ? { ...entry, field } : entry,
                  ),
                })
              }
            />
            <Field
              id={`${item.id}-graduation`}
              label="Graduation date"
              value={item.graduationDate ?? ''}
              placeholder="YYYY-MM"
              onChange={(graduationDate) =>
                patchResume({
                  education: model.education.map((entry) =>
                    entry.id === item.id ? { ...entry, graduationDate } : entry,
                  ),
                })
              }
            />
          </div>
        </section>
      ))}
      {model.education.length === 0 ? <p className={ui.text.subtitle}>No education entries yet.</p> : null}
    </div>
  )

  const renderCertifications = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SmallButton onClick={() => patchResume({ certifications: [...model.certifications, emptyCertification()] })}>
          Add certification
        </SmallButton>
      </div>
      {model.certifications.map((item) => (
        <div key={item.id} className="grid gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-3">
          <Field
            id={`${item.id}-name`}
            label="Name"
            value={item.name}
            onChange={(name) =>
              patchResume({
                certifications: model.certifications.map((entry) =>
                  entry.id === item.id ? { ...entry, name } : entry,
                ),
              })
            }
          />
          <Field
            id={`${item.id}-issuer`}
            label="Issuer"
            value={item.issuer ?? ''}
            onChange={(issuer) =>
              patchResume({
                certifications: model.certifications.map((entry) =>
                  entry.id === item.id ? { ...entry, issuer } : entry,
                ),
              })
            }
          />
          <div className="flex items-end gap-2">
            <Field
              id={`${item.id}-date`}
              label="Date"
              value={item.date ?? ''}
              placeholder="YYYY-MM"
              onChange={(date) =>
                patchResume({
                  certifications: model.certifications.map((entry) =>
                    entry.id === item.id ? { ...entry, date } : entry,
                  ),
                })
              }
            />
            <button
              type="button"
              className="mb-0.5 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() =>
                patchResume({ certifications: model.certifications.filter((entry) => entry.id !== item.id) })
              }
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      {model.certifications.length === 0 ? <p className={ui.text.subtitle}>No certifications yet.</p> : null}
    </div>
  )

  const renderAchievements = () => (
    <div className="space-y-3">
      <div className="flex justify-end">
        <SmallButton onClick={() => patchResume({ achievements: [...model.achievements, emptyAchievement()] })}>
          Add achievement
        </SmallButton>
      </div>
      {model.achievements.map((item, idx) => (
        <div key={item.id} className="flex gap-2">
          <textarea
            aria-label={`Achievement ${idx + 1}`}
            className="min-h-20 flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={item.text}
            onChange={(event) =>
              patchResume({
                achievements: model.achievements.map((entry) =>
                  entry.id === item.id ? { ...entry, text: event.target.value } : entry,
                ),
              })
            }
          />
          <button
            type="button"
            className="h-10 rounded border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => patchResume({ achievements: model.achievements.filter((entry) => entry.id !== item.id) })}
          >
            Remove
          </button>
        </div>
      ))}
      {model.achievements.length === 0 ? <p className={ui.text.subtitle}>No achievements yet.</p> : null}
    </div>
  )

  const sectionContent = {
    summary: renderSummary,
    skills: renderSkills,
    experience: renderExperience,
    projects: renderProjects,
    education: renderEducation,
    certifications: renderCertifications,
    achievements: renderAchievements,
  }[activeSection]

  return (
    <div className="space-y-5">
      <div className={ui.layout.header}>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-700">Resume Workspace</p>
          <h1 className={ui.text.h2}>{resume.title}</h1>
          <p className={ui.text.subtitle}>
            Edit structured resume sections, save changes, tailor for this job, or download DOCX.
          </p>
        </div>
        <span className="rounded-full border bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-800">
          {resume.status}
        </span>
      </div>

      {warnings.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-950">Readiness warnings</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {structuralErrors.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-950">Structural errors</h2>
          <p className="mt-1 text-sm text-red-800">Fix these before saving or exporting.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900">
            {structuralErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)_190px]">
        <aside className={`${ui.card.padded} h-fit space-y-1`}>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </aside>

        <main className={`${ui.card.paddedLg} min-w-0`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {sections.find((section) => section.id === activeSection)?.label}
            </h2>
          </div>
          {sectionContent()}
        </main>

        <aside className={`${ui.card.padded} h-fit space-y-3`}>
          <button type="button" className={`${ui.button.primary} w-full`} onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className={`${ui.button.secondary} w-full`}
            onClick={onDownloadDocx}
            disabled={downloading}
          >
            {downloading ? 'Preparing...' : 'Download DOCX'}
          </button>
          <button
            type="button"
            className={`${ui.button.secondary} w-full`}
            onClick={() => navigate(`/app/resumes/${resume.id}/tailor`)}
          >
            Tailor for Job
          </button>
          <button
            type="button"
            className="w-full rounded border border-blue-300 px-4 py-2 text-blue-700 hover:bg-blue-50"
            onClick={() => navigate('/app/analyzer')}
          >
            Run ATS Analysis
          </button>
        </aside>
      </div>
    </div>
  )
}

export default ResumeWorkspaceView
