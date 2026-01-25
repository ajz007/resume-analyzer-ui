import ResumeForm from '../components/ResumeForm'
import UsageBadge from '../components/UsageBadge'
import UsageCard from '../components/right-rail/UsageCard'
import TipsCard from '../components/right-rail/TipsCard'
import ChecksCard from '../components/right-rail/ChecksCard'
import { env } from '../app/env'
import { ui } from '../app/uiTokens'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useUsageStore } from '../store/useUsageStore'
import { useEffect } from 'react'

const AnalyzerPage = () => {
  const { error: analysisError } = useAnalysisStore()
  const { error: usageError, fetch: fetchUsage, reset: resetUsage } = useUsageStore()
  const showBackendWarning = !env.useMockApi && (!!analysisError || !!usageError)

  useEffect(() => {
    let cancelled = false
    const runFetch = async () => {
      try {
        await fetchUsage({ silent: true })
      } catch {
        // swallow errors; toasts already handled at client layer
      }
    }

    void runFetch()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void runFetch()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const handleAuthUpdate = () => {
      resetUsage()
      void runFetch()
    }
    window.addEventListener('auth-updated', handleAuthUpdate)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('auth-updated', handleAuthUpdate)
    }
  }, [fetchUsage, resetUsage])

  return (
    <div className={ui.layout.stack}>
      <div className={ui.layout.header}>
        <div className="space-y-1">
          <h1 className={ui.text.h1}>AI Resume Analyzer</h1>
          <p className={ui.text.subtitle}>Match your resume against a job description.</p>
        </div>
        <div className={`${ui.text.smallLight} whitespace-nowrap`}>
          <UsageBadge />
        </div>
      </div>
      {showBackendWarning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Backend not connected yet. Enable mock mode (VITE_USE_MOCK_API=true) for demo.
        </div>
      )}
      <div className={ui.layout.gridMain}>
        <div className="lg:col-span-2 space-y-4">
          <ResumeForm />
        </div>
        <div className="hidden lg:flex flex-col gap-4">
          <UsageCard />
          <TipsCard />
          <ChecksCard />
        </div>
      </div>
    </div>
  )
}

export default AnalyzerPage
