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

// Boot-time fetch should be quiet: 404/401/403/429 are expected/benign and should not toast.
export async function getCurrentDocument(
  options: { silent?: boolean } = {},
): Promise<UploadedDoc | null> {
  try {
    return await apiRequest<UploadedDoc>(
      '/documents/current',
      {
        method: 'GET',
      },
      options.silent ? { suppressToastOnStatus: [401, 403, 404, 429] } : {},
    )
  } catch (err) {
    const apiErr = err as ApiError
    if (options.silent) {
      if ([401, 403, 404, 429].includes(apiErr?.status)) return null
      console.warn('Boot current document fetch failed', apiErr)
      return null
    }
    if (apiErr?.status === 404) return null
    throw err
  }
}
