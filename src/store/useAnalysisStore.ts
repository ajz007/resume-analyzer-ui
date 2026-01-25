import { create } from 'zustand'
import { analyzeDocument } from '../api/endpoints'
import type { ApiError } from '../api/client'
import type { AnalysisResponse } from '../api/types'
import type { UploadedDoc } from '../api/documents'
import { useUsageStore } from './useUsageStore'

export type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error'
export type AnalysisRunStatus = 'idle' | 'processing' | 'completed' | 'failed' | 'timed_out'

type AnalysisState = {
  resumeFile: File | null
  jdText: string
  status: AnalysisStatus
  lastStatus: AnalysisRunStatus
  lastErrorCode?: string
  lastSubmitAt?: number
  analysisId?: string
  result?: AnalysisResponse
  error?: string
  uploadedDoc?: UploadedDoc
  setResumeFile: (file: File | null) => void
  setJdText: (text: string) => void
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
  status: 'idle' as AnalysisStatus,
  lastStatus: 'idle' as AnalysisRunStatus,
  lastErrorCode: undefined,
  lastSubmitAt: undefined,
  analysisId: undefined,
  result: undefined,
  error: undefined,
  uploadedDoc: undefined,
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  ...initialState,

  setResumeFile: (file) => set({ resumeFile: file, error: undefined }),

  setJdText: (text) => set({ jdText: text }),

  setError: (message) => set({ error: message }),

  setUploadedDoc: (doc) => set({ uploadedDoc: doc }),

  resetJdOnly: () => set({ jdText: '', status: 'idle', error: undefined }),

  reset: () => set({ ...initialState }),

  submitAnalysis: async () => {
    const { uploadedDoc, jdText, addToHistory, status, lastStatus, lastErrorCode, lastSubmitAt } =
      get()
    const now = Date.now()
    if (status === 'analyzing' || lastStatus === 'processing') return
    if (lastSubmitAt && now - lastSubmitAt < 800) return

    if (!uploadedDoc || !jdText) {
      set({ status: 'error', error: 'Resume upload and job description are required.' })
      return
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
      const result = await analyzeDocument(uploadedDoc.documentId, jdText, {
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
      const message =
        errorCode === 'retry_required'
          ? 'Previous analysis failed — click Retry to run again.'
          : err instanceof Error
          ? err.message
          : 'Unknown error'
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
        lastErrorCode: errorCode,
        lastStatus: nextStatus,
      })
    }
  },
}))
