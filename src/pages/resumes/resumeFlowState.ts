import type { ResumeListItem, ResumeRecord } from '../../api/resumes'

const SAMPLE_TEMPLATE_IDS_KEY = 'rethink-resume.sample-template-ids'

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const readSampleTemplateIds = (): string[] => {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(SAMPLE_TEMPLATE_IDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

const writeSampleTemplateIds = (ids: string[]) => {
  if (!isBrowser()) return
  window.localStorage.setItem(SAMPLE_TEMPLATE_IDS_KEY, JSON.stringify(Array.from(new Set(ids))))
}

export const markResumeAsSampleTemplate = (resumeId: string) => {
  if (!resumeId) return
  writeSampleTemplateIds([...readSampleTemplateIds(), resumeId])
}

const titleLooksLikeSampleTemplate = (title: string) => title.trim().toLowerCase().startsWith('sample template')

export const isSampleTemplateResume = ({
  id,
  title,
  originType,
}: {
  id: string
  title: string
  originType?: string
}) =>
  originType === 'sample template' ||
  titleLooksLikeSampleTemplate(title) ||
  readSampleTemplateIds().includes(id)

export const getResumeOriginType = (resume: Pick<ResumeListItem, 'id' | 'title' | 'originType'>) =>
  isSampleTemplateResume(resume) ? 'sample template' : resume.originType

export const getSampleTemplateWarnings = (resume: ResumeRecord) => {
  const warnings = [
    'Sample resume only - not ready to apply.',
    ...resume.requiresUserInput,
    ...resume.assumptions,
    ...resume.warnings,
    ...resume.readinessWarnings,
  ].filter((item, index, items) => item.trim().length > 0 && items.indexOf(item) === index)

  return warnings
}
