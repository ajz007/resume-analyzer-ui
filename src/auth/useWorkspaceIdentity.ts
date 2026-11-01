import { useEffect, useState } from 'react'
import { getAuthToken } from './identity'

// Token changes include switching accounts, not just signing in or out.
export function useWorkspaceIdentity() {
  const [token, setToken] = useState(getAuthToken)
  useEffect(() => {
    const update = () => setToken(getAuthToken())
    window.addEventListener('auth-updated', update)
    return () => window.removeEventListener('auth-updated', update)
  }, [])
  return token
}
