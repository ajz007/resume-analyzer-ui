import { env } from '../app/env'
import { apiDownload, apiRequest } from './client'

export type ResumeStatus = 'draft' | 'generated' | 'tailored' | 'archived'

export type ResumeBullet = {
  id: string
  text: string
}

export type ResumeExperience = {
  id: string
  company: string
  title: string
  location?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
  bullets: ResumeBullet[]
}

export type ResumeProject = {
  id: string
  name: string
  role?: string
  description?: string
  bullets: ResumeBullet[]
}

export type ResumeEducation = {
  id: string
  school: string
  degree?: string
  field?: string
  graduationDate?: string
  details?: string
}

export type ResumeCertification = {
  id: string
  name: string
  issuer?: string
  date?: string
}

export type ResumeAchievement = {
  id: string
  text: string
}

export type ResumeContact = {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  website?: string
}

export type ResumeModel = {
  contact: ResumeContact
  summary: string
  skills: string[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  education: ResumeEducation[]
  certifications: ResumeCertification[]
  achievements: ResumeAchievement[]
}

export type ResumeRecord = {
  id: string
  title: string
  status: ResumeStatus
  currentVersionId: string
  resume: ResumeModel
  readinessWarnings: string[]
  requiresUserInput: string[]
  assumptions: string[]
  warnings: string[]
  createdAt: string
  updatedAt: string
}

export type ResumeListItem = {
  id: string
  title: string
  status: ResumeStatus
  originType?: string
  sourceResumeId?: string
  createdAt: string
  updatedAt: string
}

export type GenerateResumeRequest = {
  title: string
  targetRole: string
  seniority: string
  generationMode: 'from_notes' | 'from_job_description' | 'blank'
  jobDescription: string
  experienceText: string
  skillsText: string
  educationText: string
  additionalInstructions: string
}

export type TailorChange = {
  before: string
  after: string
  reason: string
  risk?: string
  section?: string
  requiresUserInput?: string[]
  assumptions?: string[]
  warnings?: string[]
}

export type TailorResumeResponse = ResumeRecord & {
  sourceResumeId: string
  sourceVersionId: string
  changes: TailorChange[]
  missingRequirements: string[]
}

type ListResponse = { items?: unknown[] } | unknown[]

const nowIso = () => new Date().toISOString()

export const createResumeItemId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`
}

const validStatuses = new Set<ResumeStatus>(['draft', 'generated', 'tailored', 'archived'])
const datePattern = /^\d{4}-(0[1-9]|1[0-2])$/

export type ResumeValidationResult = {
  structuralErrors: string[]
}

const parseResumeStatus = (value: unknown): ResumeStatus => {
  if (typeof value === 'string' && validStatuses.has(value as ResumeStatus)) {
    return value as ResumeStatus
  }
  throw new Error(`Invalid resume status: ${String(value ?? '') || 'missing'}.`)
}

export const resumeDocxPath = (id: string) => `/api/v1/resumes/${id}/export/docx`

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)

const asOptionalString = (value: unknown) => (typeof value === 'string' ? value : undefined)

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const requiredString = (value: unknown, field: string) => {
  if (typeof value === 'string' && value.trim().length > 0) return value
  throw new Error(`Malformed resume response: missing ${field}.`)
}

const normalizeBullets = (value: unknown): ResumeBullet[] => {
  if (!Array.isArray(value)) return []
  return value.map((item, idx) => {
    if (typeof item === 'string') return { id: `bullet-${idx + 1}`, text: item }
    const record = asRecord(item)
    return {
      id: asString(record.id, `bullet-${idx + 1}`),
      text: asString(record.text),
    }
  })
}

const normalizeExperience = (value: unknown): ResumeExperience[] =>
  Array.isArray(value)
    ? value.map((item, idx) => {
        const record = asRecord(item)
        return {
          id: asString(record.id, `experience-${idx + 1}`),
          company: asString(record.company),
          title: asString(record.title),
          location: asString(record.location),
          startDate: asString(record.startDate),
          endDate: asString(record.endDate),
          isCurrent: record.isCurrent === true,
          bullets: normalizeBullets(record.bullets),
        }
      })
    : []

const normalizeProjects = (value: unknown): ResumeProject[] =>
  Array.isArray(value)
    ? value.map((item, idx) => {
        const record = asRecord(item)
        return {
          id: asString(record.id, `project-${idx + 1}`),
          name: asString(record.name),
          role: asString(record.role),
          description: asString(record.description),
          bullets: normalizeBullets(record.bullets),
        }
      })
    : []

const normalizeEducation = (value: unknown): ResumeEducation[] =>
  Array.isArray(value)
    ? value.map((item, idx) => {
        const record = asRecord(item)
        return {
          id: asString(record.id, `education-${idx + 1}`),
          school: asString(record.school),
          degree: asString(record.degree),
          field: asString(record.field),
          graduationDate: asString(record.graduationDate),
          details: asString(record.details),
        }
      })
    : []

const normalizeCertifications = (value: unknown): ResumeCertification[] =>
  Array.isArray(value)
    ? value.map((item, idx) => {
        const record = asRecord(item)
        return {
          id: asString(record.id, `certification-${idx + 1}`),
          name: asString(record.name),
          issuer: asString(record.issuer),
          date: asString(record.date),
        }
      })
    : []

const normalizeAchievements = (value: unknown): ResumeAchievement[] =>
  Array.isArray(value)
    ? value.map((item, idx) => {
        if (typeof item === 'string') return { id: `achievement-${idx + 1}`, text: item }
        const record = asRecord(item)
        return {
          id: asString(record.id, `achievement-${idx + 1}`),
          text: asString(record.text),
        }
      })
    : []

export const createBlankResumeModel = (): ResumeModel => ({
  contact: {},
  summary: '',
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  achievements: [],
})

export const createLocalResumeRecord = (title = 'Untitled resume'): ResumeRecord => ({
  id: createResumeItemId('resume'),
  title,
  status: 'draft',
  currentVersionId: '',
  resume: createBlankResumeModel(),
  readinessWarnings: ['Add a summary.', 'Add contact details.', 'Add at least one experience or project.'],
  requiresUserInput: [],
  assumptions: [],
  warnings: [],
  createdAt: nowIso(),
  updatedAt: nowIso(),
})

export const normalizeResumeModel = (payload: unknown): ResumeModel => {
  const content = asRecord(payload)
  const contact = asRecord(content.contact)
  return {
    contact: {
      name: asString(contact.name),
      email: asString(contact.email),
      phone: asString(contact.phone),
      location: asString(contact.location),
      linkedin: asString(contact.linkedin),
      website: asString(contact.website),
    },
    summary: asString(content.summary),
    skills: asStringArray(content.skills),
    experience: normalizeExperience(content.experience),
    projects: normalizeProjects(content.projects),
    education: normalizeEducation(content.education),
    certifications: normalizeCertifications(content.certifications),
    achievements: normalizeAchievements(content.achievements),
  }
}

export const normalizeResumeRecord = (payload: unknown): ResumeRecord => {
  const record = asRecord(payload)
  return {
    id: requiredString(record.id, 'id'),
    title: asString(record.title, 'Untitled resume'),
    status: parseResumeStatus(record.status ?? 'draft'),
    currentVersionId: asString(record.currentVersionId),
    resume: normalizeResumeModel(record.resume),
    readinessWarnings: asStringArray(record.readinessWarnings),
    requiresUserInput: asStringArray(record.requiresUserInput),
    assumptions: asStringArray(record.assumptions),
    warnings: asStringArray(record.warnings),
    createdAt: asString(record.createdAt, nowIso()),
    updatedAt: asString(record.updatedAt, nowIso()),
  }
}

const normalizeResumeListItem = (payload: unknown): ResumeListItem => {
  const record = asRecord(payload)
  return {
    id: requiredString(record.id, 'id'),
    title: asString(record.title, 'Untitled resume'),
    status: parseResumeStatus(record.status ?? 'draft'),
    originType: asOptionalString(record.originType),
    sourceResumeId: asOptionalString(record.sourceResumeId),
    createdAt: asString(record.createdAt, nowIso()),
    updatedAt: asString(record.updatedAt, nowIso()),
  }
}

const addDuplicateIdErrors = (ids: string[], label: string, errors: string[]) => {
  const seen = new Set<string>()
  ids.forEach((id) => {
    if (!id.trim()) {
      errors.push(`${label} contains a missing id.`)
      return
    }
    if (seen.has(id)) errors.push(`${label} contains duplicate id "${id}".`)
    seen.add(id)
  })
}

const addDateError = (value: string | undefined, label: string, errors: string[]) => {
  if (value && !datePattern.test(value)) {
    errors.push(`${label} must use YYYY-MM format.`)
  }
}

export const validateResumeModel = (resume: ResumeModel): ResumeValidationResult => {
  const structuralErrors: string[] = []

  addDuplicateIdErrors(resume.experience.map((item) => item.id), 'Experience', structuralErrors)
  addDuplicateIdErrors(resume.projects.map((item) => item.id), 'Projects', structuralErrors)
  addDuplicateIdErrors(resume.education.map((item) => item.id), 'Education', structuralErrors)
  addDuplicateIdErrors(resume.certifications.map((item) => item.id), 'Certifications', structuralErrors)
  addDuplicateIdErrors(resume.achievements.map((item) => item.id), 'Achievements', structuralErrors)

  resume.experience.forEach((item, idx) => {
    addDateError(item.startDate, `Experience ${idx + 1} start date`, structuralErrors)
    if (!item.isCurrent) addDateError(item.endDate, `Experience ${idx + 1} end date`, structuralErrors)
    if (item.isCurrent && item.endDate) {
      structuralErrors.push(`Experience ${idx + 1} end date must be empty when current job is selected.`)
    }
    addDuplicateIdErrors(item.bullets.map((bullet) => bullet.id), `Experience ${idx + 1} bullets`, structuralErrors)
  })
  resume.projects.forEach((item, idx) => {
    addDuplicateIdErrors(item.bullets.map((bullet) => bullet.id), `Project ${idx + 1} bullets`, structuralErrors)
  })
  resume.education.forEach((item, idx) => {
    addDateError(item.graduationDate, `Education ${idx + 1} graduation date`, structuralErrors)
  })
  resume.certifications.forEach((item, idx) => {
    addDateError(item.date, `Certification ${idx + 1} date`, structuralErrors)
  })

  return { structuralErrors }
}

const mockRecord: ResumeRecord = {
  id: 'mock-resume-1',
  title: 'Senior Frontend Engineer Resume',
  status: 'draft',
  currentVersionId: 'mock-version-1',
  resume: {
    contact: {
      name: 'Alex Morgan',
      email: 'alex@example.com',
      location: 'Remote',
      linkedin: 'linkedin.com/in/alexmorgan',
    },
    summary:
      'Frontend engineer focused on React, design systems, and performance improvements for SaaS products.',
    skills: ['React', 'TypeScript', 'Accessibility', 'Performance'],
    experience: [
      {
        id: 'exp-1',
        company: 'Acme Software',
        title: 'Senior Frontend Engineer',
        location: 'Remote',
        startDate: '2021-01',
        endDate: '',
        isCurrent: true,
        bullets: [
          { id: 'exp-1-b1', text: 'Improved dashboard load time by 32% by splitting bundles and caching key requests.' },
          { id: 'exp-1-b2', text: 'Led component library migration used by six product teams.' },
        ],
      },
    ],
    projects: [],
    education: [{ id: 'edu-1', school: 'State University', degree: 'BS', field: 'Computer Science' }],
    certifications: [],
    achievements: [],
  },
  readinessWarnings: ['Several bullets lack measurable impact.'],
  requiresUserInput: [],
  assumptions: [],
  warnings: [],
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
}

const mockResumes: ResumeRecord[] = [mockRecord]

export async function fetchResumes(): Promise<ResumeListItem[]> {
  if (env.useMockApi) {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve(
            mockResumes.map((record) => ({
              id: record.id,
              title: record.title,
              status: record.status,
              originType: record.status === 'tailored' ? 'tailored' : 'manual',
              sourceResumeId: undefined,
              createdAt: record.createdAt,
              updatedAt: record.updatedAt,
            })),
          ),
        200,
      ),
    )
  }

  const response = await apiRequest<ListResponse>('/api/v1/resumes', { method: 'GET' })
  const items = Array.isArray(response) ? response : response.items ?? []
  return items.map(normalizeResumeListItem)
}

export async function fetchResume(id: string): Promise<ResumeRecord> {
  if (env.useMockApi) {
    const found = mockResumes.find((record) => record.id === id)
    if (!found) {
      return new Promise((_, reject) => setTimeout(() => reject(new Error('Resume not found.')), 200))
    }
    return new Promise((resolve) => setTimeout(() => resolve(found), 200))
  }

  return normalizeResumeRecord(await apiRequest<unknown>(`/api/v1/resumes/${id}`, { method: 'GET' }))
}

export async function createResumeDraft(title: string, resume: ResumeModel): Promise<ResumeRecord> {
  if (env.useMockApi) {
    const created: ResumeRecord = {
      id: createResumeItemId('resume'),
      title,
      status: 'draft',
      currentVersionId: createResumeItemId('version'),
      resume,
      readinessWarnings: ['Add a summary.', 'Add contact details.', 'Add at least one experience or project.'],
      requiresUserInput: [],
      assumptions: [],
      warnings: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    mockResumes.unshift(created)
    return new Promise((resolve) => setTimeout(() => resolve(created), 200))
  }

  return normalizeResumeRecord(
    await apiRequest<unknown>('/api/v1/resumes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, resume }),
    }),
  )
}

export async function generateResumeFromNotes(request: GenerateResumeRequest): Promise<ResumeRecord> {
  if (env.useMockApi) {
    const generatedModel: ResumeModel = {
      ...createBlankResumeModel(),
      summary:
        request.generationMode === 'from_job_description' && !request.experienceText.trim()
          ? `${request.seniority} ${request.targetRole} resume template based on the pasted job description.`
          : `${request.seniority} ${request.targetRole} with experience across ${request.skillsText || 'core role skills'}.`,
      skills: request.skillsText
        .split(/[,;\n]/)
        .map((skill) => skill.trim())
        .filter(Boolean),
      experience: request.experienceText
        ? [
            {
              id: createResumeItemId('experience'),
              company: '',
              title: request.targetRole,
              bullets: request.experienceText
                .split('\n')
                .map((text) => ({ id: createResumeItemId('bullet'), text: text.trim() }))
                .filter((item) => item.text),
            },
          ]
        : [],
      education: request.educationText
        ? [{ id: createResumeItemId('education'), school: request.educationText }]
        : [],
    }
    const generated: ResumeRecord = {
      id: createResumeItemId('resume'),
      title: request.title || 'Generated resume',
      status: 'generated',
      currentVersionId: createResumeItemId('version'),
      resume: generatedModel,
      readinessWarnings: request.experienceText ? [] : ['Add at least one experience or project.'],
      requiresUserInput:
        request.generationMode === 'from_job_description' && !request.experienceText.trim()
          ? ['Add your real experience before applying.']
          : ['Review generated claims before using this resume.'],
      assumptions:
        request.generationMode === 'from_job_description'
          ? ['Role targeting is based on the pasted job description.']
          : [],
      warnings: ['Confirm all generated claims are supported by your experience.'],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    mockResumes.unshift(generated)
    return new Promise((resolve) => setTimeout(() => resolve(generated), 300))
  }

  return normalizeResumeRecord(
    await apiRequest<unknown>('/api/v1/resumes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }),
  )
}

export async function saveResume(record: ResumeRecord): Promise<ResumeRecord> {
  const validation = validateResumeModel(record.resume)
  if (validation.structuralErrors.length > 0) {
    throw new Error(validation.structuralErrors.join(' '))
  }

  if (env.useMockApi) {
    const saved = { ...record, updatedAt: nowIso() }
    const idx = mockResumes.findIndex((item) => item.id === record.id)
    if (idx >= 0) mockResumes[idx] = saved
    return new Promise((resolve) => setTimeout(() => resolve(saved), 200))
  }

  return normalizeResumeRecord(
    await apiRequest<unknown>(`/api/v1/resumes/${record.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentVersionId: record.currentVersionId,
        resume: record.resume,
      }),
    }),
  )
}

export async function tailorResume(id: string, jobDescription: string): Promise<TailorResumeResponse> {
  if (env.useMockApi) {
    const base = await fetchResume(id)
    const tailored: TailorResumeResponse = {
      id: createResumeItemId('resume'),
      title: `${base.title} - tailored`,
      status: 'tailored',
      currentVersionId: createResumeItemId('version'),
      sourceResumeId: base.id,
      sourceVersionId: base.currentVersionId,
      resume: {
        ...base.resume,
        summary: `${base.resume.summary} Tailored for the pasted job description.`,
      },
      changes: [
        {
          section: 'Summary',
          before: base.resume.summary,
          after: `${base.resume.summary} Tailored for the pasted job description.`,
          reason: 'Mirrors the target role language from the job description.',
          risk: 'Review for accuracy before saving.',
          requiresUserInput: ['Confirm that all generated claims are supported by your actual work.'],
        },
      ],
      missingRequirements: jobDescription.toLowerCase().includes('kubernetes') ? ['Kubernetes'] : [],
      warnings: ['Confirm all generated claims are supported by your experience.'],
      readinessWarnings: [],
      requiresUserInput: ['Confirm that all generated claims are supported by your actual work.'],
      assumptions: ['Tailoring is based only on the pasted job description and saved resume content.'],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    mockResumes.unshift(tailored)
    return new Promise((resolve) => setTimeout(() => resolve(tailored), 300))
  }

  const record = asRecord(
    await apiRequest<unknown>(`/api/v1/resumes/${id}/tailor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription }),
    }),
  )

  return {
    ...normalizeResumeRecord(record),
    sourceResumeId: asString(record.sourceResumeId),
    sourceVersionId: asString(record.sourceVersionId),
    changes: Array.isArray(record.changes)
      ? record.changes.map((item) => {
          const change = asRecord(item)
          return {
            section: asString(change.section),
            before: asString(change.before),
            after: asString(change.after),
            reason: asString(change.reason),
            risk: asString(change.risk),
            requiresUserInput: asStringArray(change.requiresUserInput),
            assumptions: asStringArray(change.assumptions),
            warnings: asStringArray(change.warnings),
          }
        })
      : [],
    missingRequirements: asStringArray(record.missingRequirements),
  }
}

const getFilenameFromContentDisposition = (header: string | null): string | undefined => {
  if (!header) return undefined
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (encoded?.[1]) return decodeURIComponent(encoded[1])
  const match = /filename="?([^"]+)"?/i.exec(header)
  return match?.[1]
}

const isDocxResponse = (contentType: string | null) => {
  if (!contentType) return true
  const lower = contentType.toLowerCase()
  return (
    lower.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
    lower.includes('application/octet-stream')
  )
}

export async function downloadResumeDocx(id: string, title = 'resume'): Promise<void> {
  if (env.useMockApi) {
    const blob = new Blob(['Mock DOCX content'], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    triggerBrowserDownload(blob, `${title.replace(/\s+/g, '-').toLowerCase()}.docx`)
    return
  }

  const response = await apiDownload(resumeDocxPath(id), { method: 'POST' })
  if (!isDocxResponse(response.headers.get('Content-Type'))) {
    throw new Error('DOCX export returned an unexpected response type.')
  }
  const blob = await response.blob()
  const filename =
    getFilenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
    `${title.replace(/\s+/g, '-').toLowerCase()}.docx`
  triggerBrowserDownload(blob, filename)
}

export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
