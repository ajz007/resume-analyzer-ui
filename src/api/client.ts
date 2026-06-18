import { env } from '../app/env'
import { useToastStore } from '../store/useToastStore'
import { getAuthToken, getOrCreateGuestId } from '../auth/identity'

export type ApiError = {
  code: string
  message: string
  status: number
  details?: unknown
  retryAfterMs?: number
}

const baseUrl = (env.apiBaseUrl || '').replace(/\/$/, '')
const apiVersionPrefix = '/api/v1'

export const joinUrl = (base: string, path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (base.endsWith(apiVersionPrefix) && normalizedPath.startsWith(apiVersionPrefix)) {
    return `${base}${normalizedPath.slice(apiVersionPrefix.length)}`
  }
  return `${base}${normalizedPath}`
}

export const buildUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (!baseUrl) {
    throw new Error('API base URL is not configured. Set VITE_API_BASE_URL or enable mock mode.')
  }
  return joinUrl(baseUrl, path)
}

type ApiRequestOptions = {
  suppressToast?: boolean
  suppressToastOnStatus?: number[]
}

const buildAuthHeaders = (initHeaders?: HeadersInit) => {
  const headers = new Headers(initHeaders ?? {})
  const token = getAuthToken()
  const guestId = getOrCreateGuestId()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('X-Guest-Id', guestId)
  return headers
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  const url = buildUrl(path)
  let response: Response

  const headers = buildAuthHeaders(init.headers)

  try {
    response = await fetch(url, { ...init, headers })
  } catch (err) {
    useToastStore
      .getState()
      .showToast({
        type: 'error',
        title: 'Network error',
        message: 'Please check your connection and try again.',
      })
    throw err
  }

  let parsed: unknown = null
  try {
    parsed = await response.clone().json()
  } catch {
    parsed = await response.text()
  }

  if (!response.ok) {
    const errBody = parsed as Record<string, unknown>
    const bodyError = errBody?.error as Record<string, unknown> | undefined
    const messageFromBody =
      (bodyError?.message as string | undefined) ??
      (errBody?.message as string | undefined) ??
      `HTTP ${response.status}`

    const suppressToast =
      options.suppressToast ||
      (Array.isArray(options.suppressToastOnStatus) &&
        options.suppressToastOnStatus.includes(response.status))

    if (!suppressToast) {
      useToastStore
        .getState()
        .showToast({
          type: 'error',
          title: 'Request failed',
          message: messageFromBody,
        })
    }

    const retryAfterHeader = response.headers.get('Retry-After')
    let retryAfterMs: number | undefined
    if (retryAfterHeader) {
      const seconds = Number(retryAfterHeader)
      if (Number.isFinite(seconds)) {
        retryAfterMs = Math.max(0, seconds * 1000)
      } else {
        const parsedDate = Date.parse(retryAfterHeader)
        if (!Number.isNaN(parsedDate)) {
          retryAfterMs = Math.max(0, parsedDate - Date.now())
        }
      }
    }

    const error: ApiError = {
      code: typeof errBody?.code === 'string' ? errBody.code : 'unknown_error',
      message:
        typeof errBody?.message === 'string'
          ? errBody.message
          : typeof messageFromBody === 'string'
          ? messageFromBody
          : `Request failed with status ${response.status}`,
      status: response.status,
      details: errBody?.details ?? parsed,
      retryAfterMs,
    }
    throw error
  }

  return parsed as T
}

export async function apiDownload(path: string, init: RequestInit = {}): Promise<Response> {
  const url = buildUrl(path)
  let response: Response

  try {
    response = await fetch(url, { ...init, headers: buildAuthHeaders(init.headers) })
  } catch (err) {
    useToastStore
      .getState()
      .showToast({
        type: 'error',
        title: 'Network error',
        message: 'Please check your connection and try again.',
      })
    throw err
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`
    try {
      const parsed = await response.clone().json()
      const record = parsed as Record<string, unknown>
      const nested = record.error as Record<string, unknown> | undefined
      message =
        (nested?.message as string | undefined) ??
        (record.message as string | undefined) ??
        message
    } catch {
      // keep fallback message
    }

    useToastStore
      .getState()
      .showToast({
        type: 'error',
        title: 'Request failed',
        message,
      })

    throw {
      code: 'download_failed',
      message,
      status: response.status,
    } satisfies ApiError
  }

  return response
}
