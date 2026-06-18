import { useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { env } from '../../app/env'
import { ui } from '../../app/uiTokens'
import { isLoggedIn } from '../../auth/identity'
import SeoMetadata from '../seo/SeoMetadata'

type RequireLoginProps = {
  title?: string
  description?: string
}

const RequireLogin = ({
  title = 'Sign in to access your resume workspace',
  description = 'Connect your account to create, edit, tailor, and download your saved resumes.',
}: RequireLoginProps) => {
  const location = useLocation()
  const loggedIn = isLoggedIn()
  const authStartUrl = useMemo(() => {
    const base = (env.apiBaseUrl || '').replace(/\/$/, '')
    return base ? `${base}/auth/google/start` : '/auth/google/start'
  }, [])

  if (loggedIn) {
    return <Outlet />
  }

  return (
    <div className="space-y-6 p-6">
      <SeoMetadata
        title="Sign In Required | Rethink Resume"
        description="Sign in to continue to the resume workspace."
        canonicalUrl={`https://rethinkresume.com${location.pathname}`}
        robots="noindex, nofollow"
      />
      <div className={`${ui.card.base} mx-auto max-w-2xl space-y-4 p-8 text-center`}>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-950">{title}</h1>
          <p className={ui.text.subtitle}>{description}</p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => window.open(authStartUrl, '_self')}
            className={ui.button.primary}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  )
}

export default RequireLogin
