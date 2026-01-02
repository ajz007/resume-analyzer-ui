import { create } from 'zustand'
import { analyzeResume } from '../api/endpoints'
import type { AnalysisResponse } from '../api/types'
import type { UploadedDoc } from '../api/documents'

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
    const { resumeFile, jdText, addToHistory } = get()

    if (!resumeFile || !jdText) {
      set({ status: 'error', error: 'Resume file and job description are required.' })
      return
    }

    set({ status: 'analyzing', error: undefined })

    try {
      const result = await analyzeResume(resumeFile, jdText)
      set({
        status: 'success',
        result,
        analysisId: result.analysisId,
      })
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
      const message = err instanceof Error ? err.message : 'Unknown error'
      set({ status: 'error', error: message })
    }
  },
}))
