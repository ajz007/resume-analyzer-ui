import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ui } from '../../app/uiTokens'
import { env } from '../../app/env'
import ToastHost from '../ToastHost'
import { claimGuestAnalyses, fetchAnalyses } from '../../api/endpoints'
import { useToastStore } from '../../store/useToastStore'
import { getAuthToken, isLoggedIn } from '../../auth/identity'
import { useHistoryStore } from '../../store/useHistoryStore'
import rethinkResumeLogo from '../../assets/brand/rethink-resume-logo.svg'

type NavItem = {
  label: string
  to: string
  featured?: boolean
}

const primaryNavItems: NavItem[] = [
  { label: 'AI Resume Builder', to: '/ai-resume-builder', featured: true },
  { label: 'ATS Checker', to: '/ats-resume-checker' },
  { label: 'Resume Analysis', to: '/app/analyzer' },
  { label: 'Early Access', to: '/pricing' },
]

const navLinkClass = ({ isActive, featured }: { isActive: boolean; featured?: boolean }) => {
  const base =
    'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2'

  if (featured) {
    return isActive
      ? `${base} bg-blue-700 text-white shadow-sm`
      : `${base} bg-blue-50 text-blue-800 hover:bg-blue-100`
  }

  return isActive
    ? `${base} bg-gray-100 text-gray-950`
    : `${base} text-gray-700 hover:bg-gray-50 hover:text-gray-950`
}

const authButtonClass =
  'inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2'

const AppShell = () => {
  const authStartUrl = useMemo(() => {
    const base = (env.apiBaseUrl || '').replace(/\/$/, '')
    return base ? `${base}/auth/google/start` : '/auth/google/start'
  }, [])
  const showToast = useToastStore((state) => state.showToast)
  const setHistoryItems = useHistoryStore((state) => state.setItems)
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const renderAuthControl = (mobile = false) =>
    !loggedIn ? (
      <button
        type="button"
        aria-label="Sign in with Google"
        className={`${authButtonClass} ${mobile ? 'w-full justify-center' : ''}`}
        onClick={() => window.open(authStartUrl, '_self')}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-bold text-blue-600">
          G
        </span>
        Sign in with Google
      </button>
    ) : (
      <button
        type="button"
        className={`rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 ${
          mobile ? 'w-full text-left' : ''
        }`}
        onClick={handleSignOut}
      >
        Sign out
      </button>
    )

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-100">
        <header className={ui.nav.header}>
          <div className={`${ui.layout.container} flex items-center justify-between gap-4 py-3`}>
            <NavLink to="/" className="inline-flex items-center">
              <img
                src={rethinkResumeLogo}
                alt="Rethink Resume"
                className="h-8 w-auto"
                loading="eager"
                decoding="async"
              />
            </NavLink>

            <div className="hidden items-center gap-4 md:flex">
              <nav aria-label="Primary navigation" className="flex items-center gap-1">
                {primaryNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      navLinkClass({ isActive, featured: item.featured })
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              {renderAuthControl()}
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 md:hidden"
              aria-label="Toggle navigation menu"
              aria-controls="mobile-primary-navigation"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-1.5" aria-hidden="true">
                <span
                  className={`block h-0.5 w-5 rounded bg-gray-800 transition-transform ${
                    mobileMenuOpen ? 'translate-y-2 rotate-45' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 rounded bg-gray-800 transition-opacity ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 rounded bg-gray-800 transition-transform ${
                    mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''
                  }`}
                />
              </span>
            </button>
          </div>

          <div
            id="mobile-primary-navigation"
            className={`overflow-hidden border-t border-gray-200 bg-white transition-[max-height,opacity] duration-200 md:hidden ${
              mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className={`${ui.layout.container} space-y-3 py-3`}>
              <nav aria-label="Primary navigation" className="grid gap-1">
                {primaryNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `${navLinkClass({ isActive, featured: item.featured })} w-full justify-start`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="border-t border-gray-200 pt-3">{renderAuthControl(true)}</div>
            </div>
          </div>
        </header>
        <main className={`${ui.layout.container} py-6 flex-1`}>
          <Outlet />
        </main>
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 text-sm text-gray-600">
            <NavLink to="/pricing" className={ui.nav.footerLink}>
              Early Access
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
