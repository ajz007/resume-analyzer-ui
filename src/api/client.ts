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

const buildUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (!baseUrl) {
    throw new Error('API base URL is not configured. Set VITE_API_BASE_URL or enable mock mode.')
  }
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

type ApiRequestOptions = {
  suppressToast?: boolean
  suppressToastOnStatus?: number[]
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  const url = buildUrl(path)
  let response: Response

  const headers = new Headers(init.headers ?? {})
  const token = getAuthToken()
  const guestId = getOrCreateGuestId()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('X-Guest-Id', guestId)

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
