import ResumeForm from '../components/ResumeForm'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useUsageStore } from '../store/useUsageStore'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppPageMetadata from '../components/seo/AppPageMetadata'

const AnalyzerPage = () => {
  const [searchParams] = useSearchParams()
  const { analysisMode, setAnalysisMode } = useAnalysisStore()
  const { fetch: fetchUsage, reset: resetUsage } = useUsageStore()

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'ats') {
      setAnalysisMode('ATS')
    }
    if (mode === 'job-match') {
      setAnalysisMode('JOB_MATCH')
    }
  }, [searchParams, setAnalysisMode])

  useEffect(() => {
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
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('auth-updated', handleAuthUpdate)
    }
  }, [fetchUsage, resetUsage])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AppPageMetadata
        title="Review an application | Rethink Resume"
        description="Use your resume and a target job to review truthful application improvements."
      />
      <header>
        <p className="text-sm font-semibold text-teal-800">
          Start an application review
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          {analysisMode === 'ATS'
            ? 'Check your resume’s readability'
            : 'Your resume. One target job.'}
        </h1>
        <p className="mt-3 text-slate-600">
          Reuse a saved upload or add a new file. Start with improvements
          supported by your experience.
        </p>
      </header>
      <ResumeForm analysisMode={analysisMode} />
    </div>
  )
}
export default AnalyzerPage
