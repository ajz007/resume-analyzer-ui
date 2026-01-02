import { NavLink, Outlet } from 'react-router-dom'
import { ui } from '../../app/uiTokens'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${ui.nav.linkBase} ${isActive ? ui.nav.linkActive : ui.nav.linkInactive}`

const AppShell = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className={ui.nav.header}>
        <div className={`${ui.layout.container} py-3 flex items-center justify-between`}>
          <span className="text-lg font-bold text-gray-900">Resume Analyzer</span>
          <nav className="flex items-center gap-4 text-sm">
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
  )
}

export default AppShell
