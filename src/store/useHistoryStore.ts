import { create } from 'zustand'
import type { AnalysisResponse } from '../api/types'

export type HistoryItem = Pick<AnalysisResponse, 'analysisId' | 'createdAt' | 'matchScore'>

type HistoryState = {
  items: HistoryItem[]
  loading: boolean
  error?: string
  setItems: (items: HistoryItem[]) => void
  addItem: (item: HistoryItem) => void
  clearHistory: () => void
}

const STORAGE_KEY = 'history:v1'

const readFromStorage = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as HistoryItem[]
  } catch {
    return []
  }
}

const writeToStorage = (items: HistoryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore storage errors
  }
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: readFromStorage(),
  loading: false,
  error: undefined,
  setItems: (items) => {
    writeToStorage(items)
    set({ items })
  },
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.analysisId === item.analysisId)
      if (existing) return state
      const updated = [item, ...state.items]
      writeToStorage(updated)
      return { items: updated }
    }),
  clearHistory: () => {
    writeToStorage([])
    set({ items: [] })
  },
}))
