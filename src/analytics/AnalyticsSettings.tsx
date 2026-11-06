import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { analyticsAvailable, analyticsChoice, recordPublicPage, restoreAnalyticsChoice, setAnalyticsChoice } from './google'

export default function AnalyticsSettings() {
  const { pathname, search } = useLocation()
  const [choice, setChoice] = useState(analyticsChoice)
  const [showOptions, setShowOptions] = useState(false)
  const lastPage = useRef('')

  useEffect(() => {
    if (!analyticsAvailable) return
    restoreAnalyticsChoice()
    if (analyticsChoice() !== 'yes' && choice !== 'yes') return
    const page = pathname + search
    if (page === lastPage.current) return
    lastPage.current = page
    recordPublicPage(pathname)
  }, [choice, pathname, search])

  if (!analyticsAvailable) return null

  const decide = (allowed: boolean) => {
    setAnalyticsChoice(allowed)
    if (!allowed) lastPage.current = ''
    setChoice(allowed ? 'yes' : 'no')
    setShowOptions(false)
  }

  if (choice !== null && !showOptions) {
    return <button type="button" className="text-sm underline" onClick={() => setShowOptions(true)}>Analytics settings</button>
  }

  return (
    <aside aria-label="Analytics preferences" className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm">
      <h2 className="font-semibold text-slate-900">Optional analytics</h2>
      <p className="mt-1 text-slate-700">Help us understand how people find and use Rethink Resume. You can use the site either way.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="rounded-md border border-slate-400 bg-white px-3 py-2 font-medium text-slate-900 hover:bg-slate-100 focus-visible:outline-2" onClick={() => decide(true)}>Allow analytics</button>
        <button type="button" className="rounded-md border border-slate-400 bg-white px-3 py-2 font-medium text-slate-900 hover:bg-slate-100 focus-visible:outline-2" onClick={() => decide(false)}>Skip analytics</button>
        <Link to="/privacy" className="px-2 underline">Privacy</Link>
      </div>
    </aside>
  )
}
