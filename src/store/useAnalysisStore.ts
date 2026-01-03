import { create } from 'zustand'
import { analyzeDocument } from '../api/endpoints'
import type { ApiError } from '../api/client'
import type { AnalysisResponse } from '../api/types'
import type { UploadedDoc } from '../api/documents'
import { useUsageStore } from './useUsageStore'

export type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error'

type AnalysisState = {
  resumeFile: File | null
  jdText: string
  status: AnalysisStatus
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
    const { uploadedDoc, jdText, addToHistory } = get()

    if (!uploadedDoc || !jdText) {
      set({ status: 'error', error: 'Resume upload and job description are required.' })
      return
    }

    set({ status: 'analyzing', error: undefined })

    try {
      const result = await analyzeDocument(uploadedDoc.documentId, jdText)
      set({
        status: 'success',
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
      const isLimitReached =
        (typeof apiErr?.code === 'string' && apiErr.code === 'limit_reached') ||
        apiErr?.status === 429
      if (isLimitReached) {
        void useUsageStore.getState().fetch(true)
      }
      const message = err instanceof Error ? err.message : 'Unknown error'
      set({ status: 'error', error: message })
    }
  },
}))
