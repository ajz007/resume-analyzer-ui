import { saveApplicationLabels } from '../api/workspace'
import { create } from 'zustand'
import {
  ResumeParseError,
  analyzeDocument,
  getResumeParseFailure,
  type ResumeParseFailure,
} from '../api/endpoints'
import type { ApiError } from '../api/client'
import type { AnalysisResponse } from '../api/types'
import type { UploadedDoc } from '../api/documents'
import { useUsageStore } from './useUsageStore'
import { JD_MIN_CHARS } from '../app/config'
import { COPY } from '../constants/uiCopy'

export type AnalysisStatus =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'success'
  | 'error'
export type AnalysisRunStatus =
  | 'idle'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'timed_out'
export type AnalysisMode = 'ATS' | 'JOB_MATCH'

type AnalysisState = {
  companyName: string
  targetRole: string
  applicationSaveError?: string
  setApplicationLabels: (labels: {
    companyName: string
    targetRole: string
  }) => void
  resumeFile: File | null
  jdText: string
  analysisMode: AnalysisMode
  status: AnalysisStatus
  lastStatus: AnalysisRunStatus
  lastErrorCode?: string
  lastSubmitAt?: number
  analysisId?: string
  result?: AnalysisResponse
  error?: string
  errorDetail?: string
  parseFailure?: ResumeParseFailure
  uploadedDoc?: UploadedDoc
  setResumeFile: (file: File | null) => void
  setJdText: (text: string) => void
  setAnalysisMode: (mode: AnalysisMode) => void
  submitAnalysis: () => Promise<void>
  setError: (message?: string) => void
  reset: () => void
  addToHistory?: (item: {
    analysisId: string
    createdAt: string
    matchScore: number
  }) => void
  setUploadedDoc: (doc?: UploadedDoc) => void
  resetJdOnly: () => void
}

const initialState = {
  companyName: '',
  targetRole: '',
  applicationSaveError: undefined,
  resumeFile: null,
  jdText: '',
  analysisMode: 'JOB_MATCH' as AnalysisMode,
  status: 'idle' as AnalysisStatus,
  lastStatus: 'idle' as AnalysisRunStatus,
  lastErrorCode: undefined,
  lastSubmitAt: undefined,
  analysisId: undefined,
  result: undefined,
  error: undefined,
  errorDetail: undefined,
  parseFailure: undefined,
  uploadedDoc: undefined,
}

let submissionGeneration = 0

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  ...initialState,
  setApplicationLabels: (labels) => set(labels),

  setResumeFile: (file) =>
    set({ resumeFile: file, error: undefined, parseFailure: undefined }),

  setJdText: (text) => set({ jdText: text }),

  setAnalysisMode: (mode) => set({ analysisMode: mode }),

  setError: (message) =>
    set({ error: message, errorDetail: undefined, parseFailure: undefined }),

  setUploadedDoc: (doc) => set({ uploadedDoc: doc }),

  resetJdOnly: () => {
    submissionGeneration++
    set({
      companyName: '',
      targetRole: '',
      applicationSaveError: undefined,
      jdText: '',
      status: 'idle',
      lastStatus: 'idle',
      analysisId: undefined,
      result: undefined,
      lastSubmitAt: undefined,
      lastErrorCode: undefined,
      error: undefined,
      parseFailure: undefined,
    })
  },

  reset: () => {
    submissionGeneration++
    set({ ...initialState })
  },

  submitAnalysis: async () => {
    const {
      uploadedDoc,
      companyName,
      targetRole,
      jdText,
      analysisMode,
      addToHistory,
      status,
      lastStatus,
      lastErrorCode,
      lastSubmitAt,
    } = get()
    const now = Date.now()
    if (
      status === 'analyzing' ||
      lastStatus === 'processing' ||
      lastStatus === 'queued'
    )
      return
    if (lastSubmitAt && now - lastSubmitAt < 800) return

    if (!uploadedDoc) {
      set({
        status: 'error',
        error: COPY.form.errors.resumeMissing,
        errorDetail: undefined,
      })
      return
    }

    if (analysisMode === 'JOB_MATCH') {
      if (!jdText.trim()) {
        set({
          status: 'error',
          error: COPY.form.errors.jdMissing,
          errorDetail: undefined,
        })
        return
      }
      if (jdText.trim().length < JD_MIN_CHARS) {
        set({
          status: 'error',
          error: COPY.form.errors.jdTooShort,
          errorDetail: undefined,
        })
        return
      }
    }

    const shouldRetry =
      lastStatus === 'failed' ||
      lastStatus === 'timed_out' ||
      lastErrorCode === 'retry_required'
    const generation = ++submissionGeneration
    set({
      status: 'analyzing',
      lastStatus: 'idle',
      lastErrorCode: undefined,
      lastSubmitAt: now,
      error: undefined,
      parseFailure: undefined,
      result: undefined,
      analysisId: undefined,
    })

    try {
      const result = await analyzeDocument(
        uploadedDoc.documentId,
        jdText,
        analysisMode,
        {
          retry: shouldRetry,
          onStarted: async (id) => {
            if (generation !== submissionGeneration) return
            set({ analysisId: id, applicationSaveError: undefined })
            if (
              analysisMode === 'JOB_MATCH' &&
              (companyName.trim() || targetRole.trim())
            ) {
              try {
                await saveApplicationLabels(id, {
                  companyName: companyName.trim(),
                  targetRole: targetRole.trim(),
                })
              } catch {
                if (generation === submissionGeneration)
                  set({
                    applicationSaveError:
                      'Your review was started, but company and role labels were not saved. You can save them from the review without analyzing again.',
                  })
              }
            }
          },
          onStatus: (status) => {
            if (
              generation === submissionGeneration &&
              (status === 'queued' || status === 'processing')
            )
              set({ lastStatus: status })
          },
        },
      )
      if (generation !== submissionGeneration) return
      set({
        status: 'success',
        lastStatus: 'completed',
        lastErrorCode: undefined,
        result,
        analysisId: result.analysisId,
      })
      void useUsageStore.getState().fetch({ force: true })
      addToHistory?.({
        analysisId: result.analysisId,
        createdAt: result.createdAt,
        matchScore: result.matchScore,
      })

      try {
        const storageKey = `analysis:${result.analysisId}`
        localStorage.setItem(storageKey, JSON.stringify(result))
      } catch (storageErr) {
        console.warn('Failed to persist analysis to localStorage', storageErr)
      }
    } catch (err) {
      if (generation !== submissionGeneration) return
      const apiErr = err as ApiError
      const parseFailure =
        err instanceof ResumeParseError
          ? err.parseFailure
          : (getResumeParseFailure(apiErr?.details) ??
            getResumeParseFailure(apiErr))
      if (parseFailure) {
        set({
          status: 'error',
          error: undefined,
          errorDetail: undefined,
          parseFailure,
          lastErrorCode: parseFailure.code,
          lastStatus: 'failed',
        })
        return
      }

      const errorCode =
        typeof apiErr?.code === 'string' ? apiErr.code : undefined
      const isLimitReached =
        (typeof apiErr?.code === 'string' && apiErr.code === 'limit_reached') ||
        apiErr?.status === 429
      if (isLimitReached) {
        void useUsageStore.getState().fetch({ force: true })
      }
      const technicalDetail = err instanceof Error ? err.message : undefined
      const isNotFound =
        errorCode === 'document_not_found' ||
        errorCode === 'doc_not_found' ||
        apiErr?.status === 404 ||
        (typeof technicalDetail === 'string' &&
          technicalDetail.toLowerCase().includes('not found'))
      const message =
        errorCode === 'retry_required' || apiErr?.status === 429
          ? COPY.errors.retrying
          : isNotFound
            ? COPY.errors.noResume
            : COPY.errors.generic
      const statusMessage =
        err instanceof Error ? err.message.toLowerCase() : ''
      const nextStatus: AnalysisRunStatus =
        statusMessage.includes('timed out') || statusMessage.includes('timeout')
          ? 'timed_out'
          : errorCode === 'retry_required' || statusMessage.includes('failed')
            ? 'failed'
            : 'failed'
      set({
        status: 'error',
        error: message,
        errorDetail: technicalDetail,
        lastErrorCode: errorCode,
        lastStatus: nextStatus,
      })
    }
  },
}))
