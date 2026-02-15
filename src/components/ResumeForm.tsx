import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { uploadDocument, getCurrentDocument } from '../api/documents'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useHistoryStore } from '../store/useHistoryStore'
import { useUsageStore } from '../store/useUsageStore'
import {
  ALLOWED_RESUME_EXTENSIONS,
  ALLOWED_RESUME_MIME_TYPES,
  JD_MIN_CHARS,
  MAX_RESUME_FILE_BYTES,
} from '../app/config'
import { COPY } from '../constants/uiCopy'

const formatFileSize = (bytes: number) => `${Math.round(bytes / 1024)} KB`
const formatFileLimit = (bytes: number) => `${Math.round(bytes / (1024 * 1024))}MB`

type ResumeFormProps = {
  analysisMode: 'ATS' | 'JOB_MATCH'
}

const ResumeForm = ({ analysisMode }: ResumeFormProps) => {
  const allowedMimeTypes = new Set(ALLOWED_RESUME_MIME_TYPES)
  const allowedExtensions = new Set(ALLOWED_RESUME_EXTENSIONS)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | undefined>(undefined)

  const {
    jdText,
    status,
    error,
    errorDetail,
    lastStatus,
    lastErrorCode,
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
  const trimmedLength = jdText.trim().length
  const requiresJd = analysisMode === 'JOB_MATCH'
  const jdTooShort = requiresJd && trimmedLength < JD_MIN_CHARS
  const jdLength = jdText.length
  const shouldRetry =
    lastStatus === 'failed' || lastStatus === 'timed_out' || lastErrorCode === 'retry_required'
  const baseAnalyzeLabel =
    analysisMode === 'ATS' ? COPY.form.ats.cta : COPY.form.jobMatch.cta
  const analyzeLabel = loading
    ? COPY.form.analyzing.title
    : shouldRetry
    ? 'Retry analysis'
    : baseAnalyzeLabel

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
                <span aria-hidden>✅</span>
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
          {errorDetail && (
            <details className="text-xs text-red-700">
              <summary className="cursor-pointer">{COPY.form.detailsLabel}</summary>
              <p className="mt-1">{errorDetail}</p>
            </details>
          )}
        </div>
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

      {loading && (
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-gray-900">{COPY.form.analyzing.title}</p>
          <ul className="list-disc list-inside">
            {COPY.form.analyzing.steps.common.map((step) => (
              <li key={step}>{step}</li>
            ))}
            <li>
              {analysisMode === 'ATS'
                ? COPY.form.analyzing.steps.ats
                : COPY.form.analyzing.steps.jobMatch}
            </li>
          </ul>
          <p className="text-xs text-gray-500">{COPY.form.analyzing.footer}</p>
        </div>
      )}
    </form>
  )
}

export default ResumeForm
