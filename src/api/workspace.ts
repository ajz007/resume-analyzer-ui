import { apiRequest } from './client'
import { env } from '../app/env'
import { fetchDocuments } from './endpoints'
import type { UploadedDoc } from './documents'

export type ApplicationLabels = { companyName: string; targetRole: string }
export type Application = ApplicationLabels & {
  analysisId: string
  documentId: string
  resumeFileName: string
  jobExcerpt: string
  mode: string
  status: string
  createdAt: string
}
export type PrimaryResume = UploadedDoc & { isPrimary: boolean }
let mockPrimary: PrimaryResume | null = null

export async function fetchPrimaryResume(): Promise<PrimaryResume | null> {
  if (env.useMockApi)
    return (
      mockPrimary ??
      (await fetchDocuments({ limit: 1 })).map((d) => ({
        ...d,
        isPrimary: false,
      }))[0] ??
      null
    )
  try {
    return await apiRequest<PrimaryResume>(
      '/workspace/primary-resume',
      {},
      { suppressToastOnStatus: [401, 403, 404] },
    )
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}
export async function setPrimaryResume(
  document: UploadedDoc,
): Promise<PrimaryResume> {
  if (env.useMockApi) return (mockPrimary = { ...document, isPrimary: true })
  return apiRequest<PrimaryResume>('/workspace/primary-resume', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId: document.documentId }),
  })
}
export async function fetchApplications(
  params: { q?: string; limit?: number; offset?: number } = {},
): Promise<Application[]> {
  if (env.useMockApi) return []
  const q = new URLSearchParams({
    limit: String(params.limit ?? 20),
    offset: String(params.offset ?? 0),
  })
  if (params.q?.trim()) q.set('q', params.q.trim())
  return apiRequest<Application[]>(`/applications?${q}`)
}
export async function fetchApplication(id: string): Promise<Application> {
  if (env.useMockApi)
    return {
      analysisId: id,
      documentId: 'doc-1',
      resumeFileName: '',
      jobExcerpt: '',
      mode: 'job_match',
      status: 'completed',
      createdAt: new Date().toISOString(),
      companyName: '',
      targetRole: '',
    }
  return apiRequest<Application>(`/applications/${encodeURIComponent(id)}`)
}
export async function saveApplicationLabels(
  id: string,
  labels: ApplicationLabels,
): Promise<Application> {
  if (env.useMockApi) return { ...(await fetchApplication(id)), ...labels }
  return apiRequest<Application>(`/applications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(labels),
  })
}
export function applicationHeading(
  a: Pick<Application, 'companyName' | 'targetRole' | 'jobExcerpt' | 'mode'>,
): string {
  if (a.companyName || a.targetRole)
    return `${a.companyName || 'Company not specified'} · ${a.targetRole || 'Role not specified'}`
  if (a.mode === 'resume_only' || a.mode === 'ats')
    return 'Resume readability review'
  return (
    a.jobExcerpt
      ?.split('\n')
      .find((line) => line.trim())
      ?.trim() || 'Job-specific application review'
  )
}
