import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { analyticsAvailable, analyticsChoice, recordPublicPage, setAnalyticsChoice } from './google'

export default function AnalyticsSettings() {
  const { pathname, search } = useLocation()
  const [choice, setChoice] = useState(analyticsChoice)
  const [showOptions, setShowOptions] = useState(false)
  const lastPage = useRef('')

  useEffect(() => {
    if (!analyticsAvailable || choice !== 'yes') return
    setAnalyticsChoice(true)
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
    <aside aria-label="Analytics preferences" className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <p>Allow optional analytics to help us understand how people find and use Rethink Resume? <Link to="/privacy" className="underline">Privacy</Link></p>
      <div className="mt-2 flex flex-wrap gap-4">
        <button type="button" className="underline" onClick={() => decide(true)}>Allow analytics</button>
        <button type="button" className="underline" onClick={() => decide(false)}>Skip analytics</button>
      </div>
    </aside>
  )
}
