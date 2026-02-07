import { create } from 'zustand'
import { analyzeDocument } from '../api/endpoints'
import type { ApiError } from '../api/client'
import type { AnalysisResponse } from '../api/types'
import type { UploadedDoc } from '../api/documents'
import { useUsageStore } from './useUsageStore'
import { JD_MIN_CHARS } from '../app/config'
import { COPY } from '../constants/uiCopy'

export type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error'
export type AnalysisRunStatus = 'idle' | 'processing' | 'completed' | 'failed' | 'timed_out'
export type AnalysisMode = 'ATS' | 'JOB_MATCH'

type AnalysisState = {
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
  uploadedDoc?: UploadedDoc
  setResumeFile: (file: File | null) => void
  setJdText: (text: string) => void
  setAnalysisMode: (mode: AnalysisMode) => void
  submitAnalysis: () => Promise<void>
  setError: (message?: string) => void
  reset: () => void
  addToHistory?: (item: { analysisId: string; createdAt: string; matchScore: number }) => void
  setUploadedDoc: (doc?: UploadedDoc) => void
  resetJdOnly: () => void
}

const initialState = {
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
  uploadedDoc: undefined,
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  ...initialState,

  setResumeFile: (file) => set({ resumeFile: file, error: undefined }),

  setJdText: (text) => set({ jdText: text }),

  setAnalysisMode: (mode) => set({ analysisMode: mode }),

  setError: (message) => set({ error: message, errorDetail: undefined }),

  setUploadedDoc: (doc) => set({ uploadedDoc: doc }),

  resetJdOnly: () => set({ jdText: '', status: 'idle', error: undefined }),

  reset: () => set({ ...initialState }),

  submitAnalysis: async () => {
    const {
      uploadedDoc,
      jdText,
      analysisMode,
      addToHistory,
      status,
      lastStatus,
      lastErrorCode,
      lastSubmitAt,
    } = get()
    const now = Date.now()
    if (status === 'analyzing' || lastStatus === 'processing') return
    if (lastSubmitAt && now - lastSubmitAt < 800) return

    if (!uploadedDoc) {
      set({ status: 'error', error: COPY.form.errors.resumeMissing, errorDetail: undefined })
      return
    }

    if (analysisMode === 'JOB_MATCH') {
      if (!jdText.trim()) {
        set({ status: 'error', error: COPY.form.errors.jdMissing, errorDetail: undefined })
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
      lastStatus === 'failed' || lastStatus === 'timed_out' || lastErrorCode === 'retry_required'
    set({
      status: 'analyzing',
      lastStatus: 'processing',
      lastErrorCode: undefined,
      lastSubmitAt: now,
      error: undefined,
    })

    try {
      const result = await analyzeDocument(uploadedDoc.documentId, jdText, analysisMode, {
        retry: shouldRetry,
      })
      set({
        status: 'success',
        lastStatus: 'completed',
        lastErrorCode: undefined,
        result,
        analysisId: result.analysisId,
      })
      void useUsageStore.getState().fetch(true)
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
      const apiErr = err as ApiError
      const errorCode = typeof apiErr?.code === 'string' ? apiErr.code : undefined
      const isLimitReached =
        (typeof apiErr?.code === 'string' && apiErr.code === 'limit_reached') || apiErr?.status === 429
      if (isLimitReached) {
        void useUsageStore.getState().fetch(true)
      }
      const technicalDetail = err instanceof Error ? err.message : undefined
      const isNotFound =
        errorCode === 'document_not_found' ||
        errorCode === 'doc_not_found' ||
        apiErr?.status === 404 ||
        (typeof technicalDetail === 'string' && technicalDetail.toLowerCase().includes('not found'))
      const message =
        errorCode === 'retry_required' || apiErr?.status === 429
          ? COPY.errors.retrying
          : isNotFound
          ? COPY.errors.noResume
          : COPY.errors.generic
      const statusMessage = err instanceof Error ? err.message.toLowerCase() : ''
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
