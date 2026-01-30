type AppEnv = {
  apiBaseUrl: string
  useMockApi: boolean
  uploadMode: 'multipart' | 's3'
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
// Default to mock API when unset to keep dev usable without backend.
const useMockApi = String(import.meta.env.VITE_USE_MOCK_API ?? 'true').toLowerCase() === 'true'
const rawUploadMode = String(import.meta.env.VITE_UPLOAD_MODE ?? 'multipart').toLowerCase()
const uploadMode: AppEnv['uploadMode'] = rawUploadMode === 's3' ? 's3' : 'multipart'

if (!apiBaseUrl) {
  console.warn('VITE_API_BASE_URL is not set. API calls may fail.')
}
if (rawUploadMode !== 'multipart' && rawUploadMode !== 's3') {
  console.warn(`Invalid VITE_UPLOAD_MODE "${rawUploadMode}", defaulting to multipart.`)
}

export const env: AppEnv = {
  apiBaseUrl: apiBaseUrl ?? '',
  useMockApi,
  uploadMode,
}

export type { AppEnv }
