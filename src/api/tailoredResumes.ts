import { apiDownload, apiRequest } from './client'
import type { UploadedDoc } from './documents'
import { triggerBrowserDownload } from './resumes'

type ExportChoices = { editIds: string[]; reviewVersion: number }
const path = (analysisId: string) => `/analyses/${encodeURIComponent(analysisId)}/tailored-resumes`
const exportRequest = (choices: ExportChoices) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(choices),
})

export function listTailoredResumes(analysisId: string) {
  return apiRequest<UploadedDoc[]>(path(analysisId))
}

export function saveTailoredResume(analysisId: string, choices: ExportChoices) {
  return apiRequest<UploadedDoc>(path(analysisId), exportRequest(choices))
}

export type ResumePreview = {
  text: string
  blocks?: { kind: 'title' | 'heading' | 'bullet' | 'paragraph'; text: string }[]
}

export function previewTailoredResume(analysisId: string, choices: ExportChoices) {
  return apiRequest<ResumePreview>(`${path(analysisId)}/preview`, exportRequest(choices))
}

export async function downloadTailoredResume(version: UploadedDoc) {
  const response = await apiDownload(`/documents/${encodeURIComponent(version.documentId)}/tailored-download`)
  triggerBrowserDownload(await response.blob(), version.fileName)
}
