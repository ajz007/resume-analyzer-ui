import type { FormEvent, Ref } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { uploadDocument, getCurrentDocument } from '../api/documents'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useHistoryStore } from '../store/useHistoryStore'
import { useUsageStore } from '../store/useUsageStore'
import { ui } from '../app/uiTokens'
import {
  ALLOWED_RESUME_EXTENSIONS,
  ALLOWED_RESUME_MIME_TYPES,
  JD_MIN_CHARS,
  MAX_RESUME_FILE_BYTES,
} from '../app/config'
import { COPY } from '../constants/uiCopy'
import AlertCard from './AlertCard'

const formatFileSize = (bytes: number) => `${Math.round(bytes / 1024)} KB`
const formatFileLimit = (bytes: number) => `${Math.round(bytes / (1024 * 1024))}MB`

type ResumeFormProps = {
  analysisMode: 'ATS' | 'JOB_MATCH'
}

const jobMatchProgressSteps = [
  'Upload received',
  'Reading resume content',
  'Identifying job priorities',
  'Comparing resume evidence with role requirements',
  'Preparing recommendations and rewrite suggestions',
  'Finalizing report',
]

const atsProgressSteps = [
  'Upload received',
  'Reading resume content',
  'Checking structure and formatting',
  'Finding ATS readability issues',
  'Preparing recommendations',
  'Finalizing report',
]

const jobMatchStatusMessages = [
  'Reading your resume structure...',
  'Extracting skills and experience...',
  'Identifying what the job is really asking for...',
  'Comparing resume evidence against role requirements...',
  'Finding top gaps to improve match...',
  'Preparing suggested resume updates...',
  'Finalizing your report...',
]

const atsStatusMessages = [
  'Reading your resume structure...',
  'Checking section clarity...',
  'Looking for formatting and parsing risks...',
  'Reviewing keyword coverage...',
  'Preparing ATS recommendations...',
  'Finalizing your report...',
]

const getCurrentProgressStep = (elapsedSeconds: number, runStatus?: string) => {
  if (runStatus === 'queued') return elapsedSeconds < 5 ? 0 : 1
  if (elapsedSeconds < 10) return 1
  if (elapsedSeconds < 25) return 2
  if (elapsedSeconds < 45) return 3
  if (elapsedSeconds < 70) return 4
  return 5
}

const formatElapsed = (seconds: number) => `Elapsed: ${seconds}s`

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
}: AnalysisProgressCardProps) => {
  const progressSteps = analysisMode === 'ATS' ? atsProgressSteps : jobMatchProgressSteps
  const progressMessages = analysisMode === 'ATS' ? atsStatusMessages : jobMatchStatusMessages
  const currentProgressStep = getCurrentProgressStep(elapsedSeconds, runStatus)
  const rotatingMessage = progressMessages[Math.floor(elapsedSeconds / 6) % progressMessages.length]
  const progressDescription =
    analysisMode === 'ATS'
      ? 'We\u2019re checking readability, structure, formatting, and ATS parsing risk.'
      : 'We\u2019re checking ATS readability, job requirements, proof gaps, and AI shortlist signals.'

  return (
    <div
      ref={rootRef}
      className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-gray-700 space-y-3"
      aria-live="polite"
    >
      {complete ? (
        <>
          <p className="font-semibold text-gray-900">Report ready. Opening your results...</p>
          <p className="text-sm text-gray-600">Your analysis is complete.</p>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-gray-900">Analyzing your resume</p>
              <span className="text-xs font-medium text-blue-700">{formatElapsed(elapsedSeconds)}</span>
            </div>
            <p className="text-sm text-gray-700">{progressDescription}</p>
            <p className="text-sm text-blue-700">{rotatingMessage}</p>
          </div>

          <ol className="space-y-2">
            {progressSteps.map((step, index) => {
              const state =
                index < currentProgressStep
                  ? 'completed'
                  : index === currentProgressStep
                  ? 'current'
                  : 'upcoming'
              return (
                <li key={step} className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full border ${
                      state === 'completed'
                        ? 'border-blue-500 bg-blue-500'
                        : state === 'current'
                        ? 'border-blue-500 bg-white ring-2 ring-blue-100'
                        : 'border-gray-300 bg-white'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={
                      state === 'upcoming'
                        ? 'text-gray-500'
                        : state === 'current'
                        ? 'font-medium text-gray-900'
                        : 'text-gray-700'
                    }
                  >
                    {step}
                  </span>
                </li>
              )
            })}
          </ol>

          {elapsedSeconds > 120 ? (
            <p className="text-xs text-gray-600">
              This can occasionally take longer for larger resumes or detailed job descriptions. You can keep this page
              open while we continue checking.
            </p>
          ) : elapsedSeconds > 60 ? (
            <p className="text-xs text-gray-600">
              This is taking a little longer than usual, but the analysis is still running. Please keep this page open.
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}

const ResumeForm = ({ analysisMode }: ResumeFormProps) => {
  const allowedMimeTypes = new Set(ALLOWED_RESUME_MIME_TYPES)
  const allowedExtensions = new Set(ALLOWED_RESUME_EXTENSIONS)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const progressRef = useRef<HTMLDivElement | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | undefined>(undefined)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const {
    jdText,
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

  useEffect(() => {
    const loadCurrent = async () => {
      try {
        const doc = await getCurrentDocument({ silent: true })
        if (doc) setUploadedDoc(doc)
      } catch {
        // silent fail in demo mode
      }
    }
    void loadCurrent()
  }, [setUploadedDoc])

  // wire store to push to history on successful analyze
  const submitWithHistory = async () => {
    useAnalysisStore.setState({ addToHistory: addItem })
    await submitAnalysis()
    const latestId = useAnalysisStore.getState().analysisId
    if (latestId) {
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
    lastStatus === 'failed' || lastStatus === 'timed_out' || lastErrorCode === 'retry_required'
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

  useEffect(() => {
    if (!analysisActive) {
      setElapsedSeconds(0)
      return
    }

    const startedAt = lastSubmitAt ?? Date.now()
    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)))
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
      progressRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [analysisActive])

  const handleUploadAnotherResume = () => {
    setResumeFile(null)
    setUploadedDoc(undefined)
    setError(undefined)
    setUploadStatus(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
    fileInputRef.current?.click()
  }

  const validateAndSetFile = async (file: File | null) => {
    if (!file) {
      setResumeFile(null)
      setUploadedDoc(undefined)
      setError(undefined)
      return
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isTypeAllowed = allowedMimeTypes.has(file.type) || allowedExtensions.has(fileExt)

    if (!isTypeAllowed) {
      setResumeFile(null)
      setUploadedDoc(undefined)
      setError('Please upload a PDF or DOC/DOCX file.')
      return
    }

    if (file.size > MAX_RESUME_FILE_BYTES) {
      setResumeFile(null)
      setUploadedDoc(undefined)
      setError(`File size must be under ${formatFileLimit(MAX_RESUME_FILE_BYTES)}.`)
      return
    }

    setError(undefined)
    setResumeFile(file)
    setUploadStatus(undefined)
    try {
      const doc = await uploadDocument(file, (statusMessage) => {
        setUploadStatus(statusMessage)
      })
      setUploadedDoc(doc)
      setUploadStatus(undefined)
    } catch (err) {
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    maxSize: MAX_RESUME_FILE_BYTES,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
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
    <form className="bg-white p-4 rounded-lg shadow-md space-y-4" onSubmit={onSubmit}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">
          {analysisMode === 'ATS' ? COPY.form.ats.header : COPY.form.jobMatch.header}
        </h2>
        <p className="text-sm text-gray-600">
          {analysisMode === 'ATS' ? COPY.form.ats.description : COPY.form.jobMatch.description}
        </p>
      </div>
      <div>
        <label className="block mb-1 font-semibold" htmlFor="resume">
          {COPY.form.uploadLabel}
        </label>
        <p className="text-xs text-gray-500 mb-2">
          {COPY.form.uploadHelper.replace('{maxSize}', formatFileLimit(MAX_RESUME_FILE_BYTES))}
        </p>
        <div
          {...getRootProps({
            className: `w-full border-2 border-dashed rounded p-4 text-center cursor-pointer ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`,
          })}
        >
          <input
            {...inputProps}
            ref={(node) => {
              fileInputRef.current = node
              const ref = inputProps.ref
              if (typeof ref === 'function') {
                ref(node)
              } else if (ref) {
                // @ts-expect-error react-dropzone may supply a mutable ref
                ref.current = node
              }
            }}
          />
          {uploadedDoc ? (
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-800">
                <span aria-hidden>Uploaded:</span>
                <span className="font-semibold truncate">{uploadedDoc.fileName}</span>
              </div>
              <p className="text-xs text-gray-600">Size: {formatFileSize(uploadedDoc.sizeBytes)}</p>
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
        {uploadStatus && <div className="text-sm text-gray-600 mt-2">{uploadStatus}</div>}
      </div>

      {analysisMode === 'JOB_MATCH' ? (
        <div>
          <label className="block mb-1 font-semibold" htmlFor="jd">
            {COPY.form.jobMatch.jdLabel}
          </label>
          <p className="text-xs text-gray-500 mb-2">{COPY.form.jobMatch.jdHelper}</p>
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

      {error && (
        <div className="text-red-600 text-sm space-y-2">
          <p>{error}</p>
          {status === 'error' && (lastStatus === 'failed' || lastStatus === 'timed_out') ? (
            <p>The analysis could not be completed. Please try again.</p>
          ) : null}
          {errorDetail && (
            <details className="text-xs text-red-700">
              <summary className="cursor-pointer">{COPY.form.detailsLabel}</summary>
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
                We couldn&apos;t reliably extract enough text to analyze your resume.
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
                Many Applicant Tracking Systems (ATS) may experience similar difficulties
                processing these formats.
              </p>
            </div>
          }
        >

          <div className="border-t border-amber-200 pt-3 space-y-1">
            <p className="font-semibold text-amber-950">ATS Compatibility Warning</p>
            <p>
              If our parser cannot reliably extract text from your resume, some ATS platforms may
              also struggle to process it.
            </p>
          </div>

            <div className="space-y-2 pb-2">
            <p className="font-semibold text-amber-950">Try one of these options:</p>
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
      {usage && usage.used >= usage.limit && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          You&apos;ve reached your analysis limit. Upgrade your plan to continue.{' '}
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            className="text-red-800 underline"
          >
            View pricing
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={
            loading ||
            lastStatus === 'processing' ||
            !uploadedDoc ||
            jdTooShort ||
            (usage ? usage.used >= usage.limit : false)
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
          className="text-blue-700 underline text-sm"
          disabled={loading}
        >
          {analysisMode === 'ATS' ? COPY.form.ats.switch : COPY.form.jobMatch.switch}
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
