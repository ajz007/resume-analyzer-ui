type AppEnv = {
  apiBaseUrl: string
  useMockApi: boolean
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
// Default to mock API when unset to keep dev usable without backend.
const useMockApi = String(import.meta.env.VITE_USE_MOCK_API ?? 'true').toLowerCase() === 'true'

if (!apiBaseUrl) {
  console.warn('VITE_API_BASE_URL is not set. API calls may fail.')
}

export const env: AppEnv = {
  apiBaseUrl: apiBaseUrl ?? '',
  useMockApi,
}

export type { AppEnv }
