const TOKEN_KEY = 'auth_token'
const GUEST_KEY = 'resume_analyzer_guest_id'
const LEGACY_GUEST_KEY = 'guest_id'

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore storage errors
  }
}

export function getAuthToken(): string | null {
  return safeGetItem(TOKEN_KEY)
}

export function isLoggedIn(): boolean {
  return getAuthToken() !== null
}

export function getOrCreateGuestId(): string {
  const existing = safeGetItem(GUEST_KEY)
  if (existing) return existing
  const legacy = safeGetItem(LEGACY_GUEST_KEY)
  if (legacy) {
    safeSetItem(GUEST_KEY, legacy)
    return legacy
  }
  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`
  safeSetItem(GUEST_KEY, generated)
  return generated
}

export const __identityKeys = { TOKEN_KEY, GUEST_KEY, LEGACY_GUEST_KEY }
