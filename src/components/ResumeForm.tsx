import type { FormEvent, Ref } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { uploadDocument, getCurrentDocument } from '../api/documents'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useHistoryStore } from '../store/useHistoryStore'
import { useUsageStore } from '../store/useUsageStore'
import { ui } from '../app/uiTokens'
import { env } from '../app/env'
import {
  ALLOWED_RESUME_EXTENSIONS,
  ALLOWED_RESUME_MIME_TYPES,
  JD_MIN_CHARS,
  MAX_RESUME_FILE_BYTES,
} from '../app/config'
import { COPY } from '../constants/uiCopy'
import { isLoggedIn } from '../auth/identity'
import {
  getAnalyzerQuotaMessage,
  getLimitReachedCopy,
  resolveUsage,
} from '../usage/quota'
import AlertCard from './AlertCard'
import SavedUploads from './SavedUploads'
import { fetchPrimaryResume } from '../api/workspace'

const formatFileSize = (bytes: number) => `${Math.round(bytes / 1024)} KB`
const formatFileLimit = (bytes: number) =>
  `${Math.round(bytes / (1024 * 1024))}MB`

type ResumeFormProps = {
  analysisMode: 'ATS' | 'JOB_MATCH'
}

export const ResumeQuotaNotice = ({
  usage,
  loggedIn,
  onSignIn,
}: {
  usage: ReturnType<typeof useUsageStore.getState>['usage']
  loggedIn: boolean
  onSignIn: () => void
}) => {
  const resolvedUsage = resolveUsage(usage, loggedIn)
  const limitReached =
    typeof resolvedUsage.used === 'number' &&
    resolvedUsage.used >= resolvedUsage.limit
  const quotaMessage = getAnalyzerQuotaMessage(usage, loggedIn)
  const limitReachedCopy = getLimitReachedCopy(usage, loggedIn)

  return (
    <div
      className={`rounded-lg border px-3 py-3 text-sm ${
        limitReached
          ? 'border-red-200 bg-red-50 text-red-900'
          : 'border-teal-100 bg-teal-50/60 text-gray-700'
      }`}
    >
      {limitReached ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="font-semibold">{limitReachedCopy.title}</p>
            <p>{limitReachedCopy.description}</p>
          </div>
          {limitReachedCopy.showSignIn ? (
            <button
              type="button"
              onClick={onSignIn}
              className={ui.button.primary}
            >
              Sign in with Google
            </button>
          ) : null}
        </div>
      ) : (
        <p>{quotaMessage}</p>
      )}
    </div>
  )
}

type AnalysisProgressCardProps = {
  analysisMode: 'ATS' | 'JOB_MATCH'
  elapsedSeconds: number
  runStatus?: string
  complete?: boolean
  rootRef?: Ref<HTMLDivElement>
}
export const AnalysisProgressCard = ({
  analysisMode,
  elapsedSeconds,
  runStatus,
  complete = false,
  rootRef,
}: AnalysisProgressCardProps) => (
  <section
    ref={rootRef}
    className="rounded-lg border border-teal-200 bg-teal-50 p-5 text-slate-800"
    aria-live="polite"
  >
    {complete ? (
      <>
        <p className="font-semibold">Report ready. Opening your results...</p>
        <p>Your analysis is complete.</p>
      </>
    ) : (
      <>
        <p className="font-semibold">
          {runStatus === 'queued'
            ? 'Your review is in the queue'
            : runStatus === 'processing'
              ? 'Analyzing your resume'
              : 'Starting your review request'}
        </p>
        <p className="mt-2">
          {analysisMode === 'ATS'
            ? 'We’re checking readability, structure, formatting, and ATS parsing risk.'
            : 'We’re checking ATS readability, job requirements, proof gaps, and AI shortlist signals.'}
        </p>
        <p className="mt-3 text-sm">
          Status:{' '}
          {runStatus === 'queued'
            ? 'Queued'
            : runStatus === 'processing'
              ? 'Processing'
              : 'Submitting request'}{' '}
          · Elapsed: {elapsedSeconds}s
        </p>
        {elapsedSeconds > 60 && (
          <p className="mt-3 text-sm">
            This is taking a little longer than usual. No completion estimate is
            available.
          </p>
        )}
        <p className="mt-2 text-sm">
          You can return to Applications while this request continues. You do
          not need to submit it again.
        </p>
      </>
    )}
  </section>
)

const ResumeForm = ({ analysisMode }: ResumeFormProps) => {
  const allowedMimeTypes = new Set(ALLOWED_RESUME_MIME_TYPES)
  const allowedExtensions = new Set(ALLOWED_RESUME_EXTENSIONS)
  const selectionEpoch = useRef(0)
  const progressRef = useRef<HTMLDivElement | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | undefined>(
    undefined,
  )
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const {
    jdText,
    companyName,
    targetRole,
    setApplicationLabels,
    applicationSaveError,
    status,
    error,
    errorDetail,
    parseFailure,
    lastStatus,
    lastErrorCode,
    lastSubmitAt,
    setResumeFile,
    setJdText,
    setAnalysisMode,
    submitAnalysis,
    setError,
    reset,
    uploadedDoc,
    setUploadedDoc,
  } = useAnalysisStore()
  const { addItem } = useHistoryStore()
  const { usage } = useUsageStore()
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const authStartUrl = useMemo(() => {
    const base = (env.apiBaseUrl || '').replace(/\/$/, '')
    return base ? `${base}/auth/google/start` : '/auth/google/start'
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const doc = await fetchPrimaryResume()
        if (
          !cancelled &&
          selectionEpoch.current === 0 &&
          doc &&
          !useAnalysisStore.getState().uploadedDoc
        )
          setUploadedDoc(doc)
      } catch {
        try {
          const doc = await getCurrentDocument({ silent: true })
          if (
            !cancelled &&
            selectionEpoch.current === 0 &&
            doc &&
            !useAnalysisStore.getState().uploadedDoc
          )
            setUploadedDoc(doc)
        } catch {
          /* Existing upload remains usable. */
        }
      }
    }
    void load()
    window.addEventListener('guest-claim-complete', load)
    return () => {
      cancelled = true
      window.removeEventListener('guest-claim-complete', load)
    }
  }, [setUploadedDoc])

  // wire store to push to history on successful analyze
  const submitWithHistory = async () => {
    useAnalysisStore.setState({ addToHistory: addItem })
    const pending = submitAnalysis()
    const submittedAt = useAnalysisStore.getState().lastSubmitAt
    await pending
    const current = useAnalysisStore.getState()
    const latestId = current.analysisId
    if (
      latestId &&
      current.status === 'success' &&
      current.lastSubmitAt === submittedAt
    ) {
      navigate(`/app/results/${latestId}`)
    }
  }

  const loading = status === 'analyzing'
  const analysisActive = loading || lastStatus === 'processing'
  const analysisComplete = status === 'success'
  const trimmedLength = jdText.trim().length
  const requiresJd = analysisMode === 'JOB_MATCH'
  const jdTooShort = requiresJd && trimmedLength < JD_MIN_CHARS
  const jdLength = jdText.length
  const shouldRetry =
    lastStatus === 'failed' ||
    lastStatus === 'timed_out' ||
    lastErrorCode === 'retry_required'
  const baseAnalyzeLabel =
    analysisMode === 'ATS' ? COPY.form.ats.cta : COPY.form.jobMatch.cta
  const analyzeLabel = loading
    ? 'Analyzing...'
    : shouldRetry
      ? 'Retry analysis'
      : baseAnalyzeLabel
  const displayedElapsedSeconds =
    analysisActive && lastSubmitAt
      ? Math.max(elapsedSeconds, Math.floor((Date.now() - lastSubmitAt) / 1000))
      : elapsedSeconds
  const resolvedUsage = resolveUsage(usage, loggedIn)
  const limitReached =
    typeof resolvedUsage.used === 'number' &&
    resolvedUsage.used >= resolvedUsage.limit

  useEffect(() => {
    if (!analysisActive) {
      setElapsedSeconds(0)
      return
    }

    const startedAt = lastSubmitAt ?? Date.now()
    const updateElapsed = () => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      )
    }

    updateElapsed()
    const timer = window.setInterval(updateElapsed, 1000)
    return () => window.clearInterval(timer)
  }, [analysisActive, lastSubmitAt])

  useEffect(() => {
    if (!analysisActive || !progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
    if (!isVisible) {
      progressRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [analysisActive])

  const handleUploadAnotherResume = () => {
    selectionEpoch.current++
    setResumeFile(null)
    setUploadedDoc(undefined)
    setError(undefined)
    setUploadStatus(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
    fileInputRef.current?.click()
  }

  const validateAndSetFile = async (file: File | null) => {
    const epoch = ++selectionEpoch.current
    if (!file) {
      setResumeFile(null)
      setUploadedDoc(undefined)
      setError(undefined)
      return
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isTypeAllowed =
      allowedMimeTypes.has(file.type) || allowedExtensions.has(fileExt)

    if (!isTypeAllowed) {
      setResumeFile(null)
      setUploadedDoc(undefined)
      setError('Please upload a PDF or DOC/DOCX file.')
      return
    }

    if (file.size > MAX_RESUME_FILE_BYTES) {
      setResumeFile(null)
      setUploadedDoc(undefined)
      setError(
        `File size must be under ${formatFileLimit(MAX_RESUME_FILE_BYTES)}.`,
      )
      return
    }

    setError(undefined)
    setUploadedDoc(undefined)
    setResumeFile(file)
    setUploadStatus(undefined)
    try {
      const doc = await uploadDocument(file, (statusMessage) => {
        setUploadStatus(statusMessage)
      })
      if (epoch !== selectionEpoch.current) return
      setUploadedDoc(doc)
      setUploadStatus(undefined)
    } catch (err) {
      if (epoch !== selectionEpoch.current) return
      const message =
        err instanceof Error
          ? err.message
          : typeof (err as { message?: unknown })?.message === 'string'
            ? String((err as { message?: unknown }).message)
            : 'Failed to upload resume.'
      setError(message)
      setResumeFile(null)
      setUploadedDoc(undefined)
      setUploadStatus(undefined)
    }
  }

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    inputRef: fileInputRef,
  } = useDropzone({
    noClick: !!uploadedDoc,
    disabled: analysisActive,
    multiple: false,
    maxSize: MAX_RESUME_FILE_BYTES,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
    },
    onDrop: async (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        const firstRejection = fileRejections[0]
        const code = firstRejection.errors[0]?.code
        const message =
          code === 'file-too-large'
            ? `File size must be under ${formatFileLimit(MAX_RESUME_FILE_BYTES)}.`
            : firstRejection.errors[0]?.message ||
              `File was rejected. Please upload a PDF or DOC/DOCX under ${formatFileLimit(
                MAX_RESUME_FILE_BYTES,
              )}.`
        setError(message)
        setResumeFile(null)
        setUploadedDoc(undefined)
        return
      }
      const file = acceptedFiles[0] ?? null
      await validateAndSetFile(file ?? null)
    },
  })
  const inputProps = getInputProps({
    id: 'resume',
    accept:
      '.pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!uploadedDoc) {
      setError(COPY.form.errors.resumeMissing)
      return
    }

    if (analysisMode === 'JOB_MATCH') {
      if (!jdText.trim()) {
        setError(COPY.form.errors.jdMissing)
        return
      }
      if (jdTooShort) {
        setError(COPY.form.errors.jdTooShort)
        return
      }
    }

    await submitWithHistory()
  }

  return (
    <form
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7 space-y-6"
      onSubmit={onSubmit}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">
          {analysisMode === 'ATS'
            ? COPY.form.ats.header
            : COPY.form.jobMatch.header}
        </h2>
        <p className="text-sm text-gray-600">
          {analysisMode === 'ATS'
            ? COPY.form.ats.description
            : COPY.form.jobMatch.description}
        </p>
      </div>
      {loggedIn && (
        <details>
          <summary className="min-h-11 py-2 font-medium text-teal-800">
            Choose from saved uploads
          </summary>
          <SavedUploads picker disabled={analysisActive} />
        </details>
      )}
      <div>
        <label className="block mb-1 font-semibold" htmlFor="resume">
          {COPY.form.uploadLabel}
        </label>
        <p className="text-xs text-gray-500 mb-2">
          {COPY.form.uploadHelper.replace(
            '{maxSize}',
            formatFileLimit(MAX_RESUME_FILE_BYTES),
          )}
        </p>
        <div
          {...getRootProps({
            className: `w-full border-2 border-dashed rounded p-4 text-center cursor-pointer ${
              isDragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300'
            }`,
          })}
        >
          <input {...inputProps} />
          {uploadedDoc ? (
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-800">
                <span aria-hidden>Uploaded:</span>
                <span className="font-semibold truncate">
                  {uploadedDoc.fileName}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Size: {formatFileSize(uploadedDoc.sizeBytes)}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  className="border border-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </button>
                <button
                  type="button"
                  className="border border-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => {
                    selectionEpoch.current++
                    setResumeFile(null)
                    setUploadedDoc(undefined)
                    setError(undefined)
                    setUploadStatus(undefined)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700">
              Drag and drop your resume here, or click to browse (PDF/DOCX, &lt;
              {formatFileLimit(MAX_RESUME_FILE_BYTES)})
            </p>
          )}
        </div>
        {uploadStatus && (
          <div className="text-sm text-gray-600 mt-2">{uploadStatus}</div>
        )}
      </div>

      {analysisMode === 'JOB_MATCH' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="min-w-0 space-y-1">
              <span>Company (optional)</span>
              <input
                className="w-full rounded-lg border border-slate-300 p-3"
                maxLength={120}
                value={companyName}
                disabled={analysisActive}
                onChange={(e) =>
                  setApplicationLabels({
                    companyName: e.target.value,
                    targetRole,
                  })
                }
              />
            </label>
            <label className="min-w-0 space-y-1">
              <span>Target position (optional)</span>
              <input
                className="w-full rounded-lg border border-slate-300 p-3"
                maxLength={120}
                value={targetRole}
                disabled={analysisActive}
                onChange={(e) =>
                  setApplicationLabels({
                    companyName,
                    targetRole: e.target.value,
                  })
                }
              />
            </label>
          </div>
          <p className="text-sm text-slate-600">
            Confirm these labels to find this review by company or position
            later.
          </p>
          <label className="block mb-1 font-semibold" htmlFor="jd">
            {COPY.form.jobMatch.jdLabel}
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {COPY.form.jobMatch.jdHelper}
          </p>
          <textarea
            id="jd"
            className="w-full p-2 border rounded"
            rows={6}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder={COPY.form.jobMatch.jdPlaceholder}
          />
          <div className="flex items-center justify-between text-sm mt-1">
            <span className={jdTooShort ? 'text-gray-600' : 'text-green-700'}>
              {jdTooShort
                ? COPY.form.jobMatch.jdCounterShort.replace(
                    '{remaining}',
                    String(Math.max(JD_MIN_CHARS - trimmedLength, 0)),
                  )
                : COPY.form.jobMatch.jdCounterOk}
            </span>
            <span className={jdTooShort ? 'text-gray-600' : 'text-green-700'}>
              {jdLength} / {JD_MIN_CHARS} characters
            </span>
          </div>
        </div>
      ) : null}

      {applicationSaveError && (
        <p role="alert" className="text-amber-900">
          {applicationSaveError}
        </p>
      )}
      {error && (
        <div className="text-red-600 text-sm space-y-2">
          <p>{error}</p>
          {status === 'error' &&
          (lastStatus === 'failed' || lastStatus === 'timed_out') ? (
            <p>The analysis could not be completed. Please try again.</p>
          ) : null}
          {errorDetail && (
            <details className="text-xs text-red-700">
              <summary className="cursor-pointer">
                {COPY.form.detailsLabel}
              </summary>
              <p className="mt-1">{errorDetail}</p>
            </details>
          )}
        </div>
      )}
      {parseFailure && (
        <AlertCard
          severity="warning"
          title="Resume format may not be ATS-friendly"
          description={
            <div className="space-y-3">
              <p>
                We couldn&apos;t reliably extract enough text to analyze your
                resume.
              </p>
              <div>
                <p>This commonly happens with:</p>
                <ul className="mt-1 list-disc pl-5 space-y-1">
                  <li>Canva-generated resumes</li>
                  <li>Image-based PDFs</li>
                  <li>Multi-column layouts</li>
                  <li>Graphic-heavy designs</li>
                </ul>
              </div>
              <p>
                Many Applicant Tracking Systems (ATS) may experience similar
                difficulties processing these formats.
              </p>
            </div>
          }
        >
          <div className="border-t border-amber-200 pt-3 space-y-1">
            <p className="font-semibold text-amber-950">
              ATS Compatibility Warning
            </p>
            <p>
              If our parser cannot reliably extract text from your resume, some
              ATS platforms may also struggle to process it.
            </p>
          </div>

          <div className="space-y-2 pb-2">
            <p className="font-semibold text-amber-950">
              Try one of these options:
            </p>
            <ul className="space-y-1">
              {[
                'Upload a DOCX version',
                'Upload a text-based PDF',
                'Use a simpler ATS-friendly layout',
              ].map((item) => (
                <li className="flex gap-2" key={item}>
                  <span aria-hidden className="font-semibold text-green-700">
                    +
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className={ui.button.primary}
            onClick={handleUploadAnotherResume}
            disabled={loading}
          >
            Upload another resume
          </button>
        </AlertCard>
      )}
      <ResumeQuotaNotice
        usage={usage}
        loggedIn={loggedIn}
        onSignIn={() => window.open(authStartUrl, '_self')}
      />

      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <button
          type="submit"
          className={ui.button.primary}
          disabled={
            loading ||
            lastStatus === 'processing' ||
            !uploadedDoc ||
            jdTooShort ||
            limitReached
          }
        >
          {analyzeLabel}
        </button>
        <button
          type="button"
          onClick={reset}
          className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() =>
            setAnalysisMode(analysisMode === 'ATS' ? 'JOB_MATCH' : 'ATS')
          }
          className="text-teal-700 underline text-sm"
          disabled={loading}
        >
          {analysisMode === 'ATS'
            ? COPY.form.ats.switch
            : COPY.form.jobMatch.switch}
        </button>
      </div>

      {(analysisActive || analysisComplete) && (
        <AnalysisProgressCard
          analysisMode={analysisMode}
          elapsedSeconds={displayedElapsedSeconds}
          runStatus={lastStatus}
          complete={analysisComplete}
          rootRef={progressRef}
        />
      )}
    </form>
  )
}

export default ResumeForm
