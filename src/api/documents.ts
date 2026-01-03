import { apiRequest, type ApiError } from './client'

export type UploadedDoc = {
  documentId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
}

export async function uploadDocument(file: File): Promise<UploadedDoc> {
  const form = new FormData()
  form.append('file', file)

  return apiRequest<UploadedDoc>('/documents', {
    method: 'POST',
    body: form,
  })
}

export async function getCurrentDocument(): Promise<UploadedDoc | null> {
  try {
    return await apiRequest<UploadedDoc>('/documents/current', {
      method: 'GET',
    })
  } catch (err) {
    const apiErr = err as ApiError
    if (apiErr?.status === 404) return null
    throw err
  }
}
