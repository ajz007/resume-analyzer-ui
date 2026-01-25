import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ui } from '../../app/uiTokens'
import { env } from '../../app/env'
import ToastHost from '../ToastHost'
import { claimGuestAnalyses, fetchAnalyses } from '../../api/endpoints'
import { useToastStore } from '../../store/useToastStore'
import { getAuthToken, isLoggedIn } from '../../auth/identity'
import { useHistoryStore } from '../../store/useHistoryStore'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${ui.nav.linkBase} ${isActive ? ui.nav.linkActive : ui.nav.linkInactive}`

const AppShell = () => {
  const authStartUrl = useMemo(() => {
    const base = (env.apiBaseUrl || '').replace(/\/$/, '')
    return base ? `${base}/auth/google/start` : '/auth/google/start'
  }, [])
  const showToast = useToastStore((state) => state.showToast)
  const setHistoryItems = useHistoryStore((state) => state.setItems)
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())

  useEffect(() => {
    const url = new URL(window.location.href)
    const token = url.searchParams.get('token')
    if (token) {
      try {
        localStorage.setItem('auth_token', token)
      } catch {
        // ignore storage errors
      }
      setLoggedIn(true)
      window.dispatchEvent(new Event('auth-updated'))
      url.searchParams.delete('token')
      const newUrl = url.pathname + (url.search ? `?${url.searchParams.toString()}` : '') + url.hash
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    const claimKey = `guest_claimed_for_${token}`
    try {
      if (sessionStorage.getItem(claimKey)) return
      sessionStorage.setItem(claimKey, '1')
    } catch {
      // ignore storage errors
    }

    const claim = async () => {
      try {
        const response = await claimGuestAnalyses()
        if (typeof response.migratedCount === 'number' && response.migratedCount > 0) {
          showToast({
            type: 'success',
            title: 'Guest analyses imported',
            message: 'Imported your previous guest analyses.',
          })
        }
        const analyses = await fetchAnalyses({ limit: 20, offset: 0 })
        setHistoryItems(
          analyses.map((item) => ({
            analysisId: item.analysisId,
            createdAt: item.createdAt,
            matchScore: item.matchScore ?? 0,
          })),
        )
        window.dispatchEvent(new Event('guest-claim-complete'))
      } catch {
        // silent fail to avoid disrupting login flow
      }
    }

    void claim()
    setLoggedIn(true)
  }, [setHistoryItems, showToast])

  useEffect(() => {
    const handleAuthUpdate = () => setLoggedIn(isLoggedIn())
    window.addEventListener('auth-updated', handleAuthUpdate)
    return () => window.removeEventListener('auth-updated', handleAuthUpdate)
  }, [])

  const handleSignOut = () => {
    try {
      localStorage.removeItem('auth_token')
    } catch {
      // ignore storage errors
    }
    setLoggedIn(false)
    window.dispatchEvent(new Event('auth-updated'))
    window.location.href = '/app/analyzer'
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-100">
        <header className={ui.nav.header}>
          <div className={`${ui.layout.container} py-3 flex items-center justify-between`}>
            <span className="text-lg font-bold text-gray-900">Resume Analyzer</span>
            <div className="flex items-center gap-4 text-sm">
              <nav className="flex items-center gap-4">
                <NavLink to="/app/analyzer" className={navLinkClass}>
                  Analyzer
                </NavLink>
                <span className="text-gray-300 select-none">|</span>
                <NavLink to="/app/history" className={navLinkClass}>
                  History
                </NavLink>
                <span className="text-gray-300 select-none">|</span>
                <NavLink to="/pricing" className={navLinkClass}>
                  Pricing
                </NavLink>
              </nav>
              <div className="flex items-center gap-2">
                {!loggedIn ? (
                  <button
                    type="button"
                    aria-label="Sign in with Google"
                    className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
                    onClick={() => window.open(authStartUrl, '_self')}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600 border border-gray-200">
                      G
                    </span>
                    Sign in with Google
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-sm text-gray-700 hover:text-gray-900"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className={`${ui.layout.container} py-6 flex-1`}>
          <Outlet />
        </main>
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 text-sm text-gray-600">
            <NavLink to="/pricing" className={ui.nav.footerLink}>
              Pricing
            </NavLink>
            <span className="text-gray-300 select-none">|</span>
            <NavLink to="/privacy" className={ui.nav.footerLink}>
              Privacy
            </NavLink>
            <span className="text-gray-300 select-none">|</span>
            <NavLink to="/terms" className={ui.nav.footerLink}>
              Terms
            </NavLink>
          </div>
        </footer>
      </div>
      <ToastHost />
    </>
  )
}

export default AppShell
