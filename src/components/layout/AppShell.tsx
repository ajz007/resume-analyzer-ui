import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { ui } from '../../app/uiTokens'
import { env } from '../../app/env'
import ToastHost from '../ToastHost'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${ui.nav.linkBase} ${isActive ? ui.nav.linkActive : ui.nav.linkInactive}`

const AppShell = () => {
  const authStartUrl = useMemo(() => {
    const base = (env.apiBaseUrl || '').replace(/\/$/, '')
    return base ? `${base}/auth/google/start` : '/auth/google/start'
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    const token = url.searchParams.get('token')
    if (token) {
      try {
        localStorage.setItem('auth_token', token)
      } catch {
        // ignore storage errors
      }
      url.searchParams.delete('token')
      const newUrl = url.pathname + (url.search ? `?${url.searchParams.toString()}` : '') + url.hash
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  const handleSignOut = () => {
    try {
      localStorage.removeItem('auth_token')
    } catch {
      // ignore storage errors
    }
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
                <button
                  type="button"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                  onClick={() => window.open(authStartUrl, '_self')}
                >
                  Sign in with Google
                </button>
                <span className="text-gray-300 select-none">|</span>
                <button
                  type="button"
                  className="text-sm text-gray-700 hover:text-gray-900"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
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
