import { env } from '../app/env'
import { apiRequest, type ApiError } from './client'

export type UploadedDoc = {
  documentId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
}

type PresignResponse = {
  uploadUrl: string
  s3Key: string
}

type UploadMetadata = {
  fileName: string
  mimeType: string
  sizeBytes: number
}

type PresignRequest = {
  fileName: string
  contentType: string
  sizeBytes: number
}

type UploadStatusHandler = (status: string) => void

export async function uploadDocumentMultipart(file: File): Promise<UploadedDoc> {
  const form = new FormData()
  form.append('file', file)

  return apiRequest<UploadedDoc>('/documents', {
    method: 'POST',
    body: form,
  })
}

async function uploadDocumentS3(
  file: File,
  onStatus?: UploadStatusHandler,
): Promise<UploadedDoc> {
  const contentType = file.type || 'application/octet-stream'
  const metadata: UploadMetadata = {
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  }
  const presignRequest: PresignRequest = {
    fileName: file.name,
    contentType,
    sizeBytes: file.size,
  }

  const presign = await apiRequest<PresignResponse>('/uploads/presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(presignRequest),
  })

  if (!presign?.uploadUrl || !presign?.s3Key) {
    throw new Error('Upload initialization failed. Please try again.')
  }

  onStatus?.('Uploading to storage...')
  const uploadResponse = await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  })

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload to storage. Please try again.')
  }

  onStatus?.('Registering document...')
  return apiRequest<UploadedDoc>('/documents/from-s3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      s3Key: presign.s3Key,
      originalFileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    }),
  })
}

export async function uploadDocument(
  file: File,
  onStatus?: UploadStatusHandler,
): Promise<UploadedDoc> {
  if (env.uploadMode === 's3') {
    return uploadDocumentS3(file, onStatus)
  }
  return uploadDocumentMultipart(file)
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
