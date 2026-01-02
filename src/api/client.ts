import { env } from '../app/env'

export type ApiError = {
  code: string
  message: string
  status: number
  details?: unknown
}

const baseUrl = (env.apiBaseUrl || '').replace(/\/$/, '')

const buildUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (!baseUrl) {
    throw new Error('API base URL is not configured. Set VITE_API_BASE_URL or enable mock mode.')
  }
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = buildUrl(path)
  const response = await fetch(url, init)

  let parsed: unknown = null
  try {
    parsed = await response.clone().json()
  } catch {
    parsed = await response.text()
  }

  if (!response.ok) {
    const errBody = parsed as Record<string, unknown>
    const error: ApiError = {
      code: typeof errBody?.code === 'string' ? errBody.code : 'unknown_error',
      message:
        typeof errBody?.message === 'string'
          ? errBody.message
          : `Request failed with status ${response.status}`,
      status: response.status,
      details: errBody?.details ?? parsed,
    }
    throw error
  }

  return parsed as T
}
