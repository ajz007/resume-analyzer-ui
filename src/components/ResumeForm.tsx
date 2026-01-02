import type { FormEvent } from 'react'
import { useEffect, useRef } from 'react'
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

const formatFileSize = (bytes: number) => `${Math.round(bytes / 1024)} KB`

const ResumeForm = () => {
  const allowedMimeTypes = new Set(ALLOWED_RESUME_MIME_TYPES)
  const allowedExtensions = new Set(ALLOWED_RESUME_EXTENSIONS)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    resumeFile,
    jdText,
    status,
    error,
    setResumeFile,
    setJdText,
    submitAnalysis,
    setError,
    reset,
    uploadedDoc,
    setUploadedDoc,
  } = useAnalysisStore()
  const { addItem } = useHistoryStore()
  const { usage, fetch: fetchUsage } = useUsageStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!usage) {
      void fetchUsage()
    }
  }, [usage, fetchUsage])

  useEffect(() => {
    const loadCurrent = async () => {
      try {
        const doc = await getCurrentDocument()
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
  const jdTooShort = trimmedLength < JD_MIN_CHARS
  const jdLength = jdText.length

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
      setError('File size must be under 5MB.')
      return
    }

    setError(undefined)
    setResumeFile(file)
    try {
      const doc = await uploadDocument(file)
      setUploadedDoc(doc)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload resume.'
      setError(message)
      setResumeFile(null)
      setUploadedDoc(undefined)
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
        const message =
          firstRejection.errors[0]?.message ||
          'File was rejected. Please upload a PDF or DOC/DOCX under 5MB.'
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
    if (!resumeFile) {
      setError('Please upload a resume.')
      return
    }

    if (jdTooShort) {
      setError(`Please paste a longer job description (min ${JD_MIN_CHARS} chars).`)
      return
    }

    await submitWithHistory()
  }

  return (
    <form className="bg-white p-4 rounded-lg shadow-md space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="block mb-2 font-semibold" htmlFor="resume">
          Upload Resume (PDF/DOCX):
        </label>
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
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700">
              Drag and drop your resume here, or click to browse (PDF/DOCX, &lt;5MB)
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block mb-2 font-semibold" htmlFor="jd">
          Paste Job Description:
        </label>
        <textarea
          id="jd"
          className="w-full p-2 border rounded"
          rows={6}
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />
        <div className="flex items-center justify-between text-sm mt-1">
          <span className={jdTooShort ? 'text-gray-600' : 'text-green-700'}>
            {jdLength === 0
              ? `Minimum ${JD_MIN_CHARS} characters recommended.`
              : jdTooShort
              ? `Add ${Math.max(JD_MIN_CHARS - trimmedLength, 0)} more characters.`
              : 'Looks good.'}
          </span>
          <span className={jdTooShort ? 'text-gray-600' : 'text-green-700'}>
            {jdLength} / {JD_MIN_CHARS} characters
          </span>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
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
          disabled={loading || !resumeFile || jdTooShort || (usage ? usage.used >= usage.limit : false)}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
        >
          Reset
        </button>
      </div>
    </form>
  )
}

export default ResumeForm
