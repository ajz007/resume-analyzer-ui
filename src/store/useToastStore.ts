import { create } from 'zustand'

export type ToastType = 'error' | 'success' | 'info'

export type Toast = {
  id: string
  type: ToastType
  title?: string
  message: string
  createdAt: number
  ttlMs: number
}

type ShowToastInput = {
  type: ToastType
  title?: string
  message: string
  ttlMs?: number
}

type ToastStoreState = {
  toasts: Toast[]
  showToast: (toast: ShowToastInput) => string
  dismissToast: (id: string) => void
  clearToasts: () => void
}

const defaultTtlByType: Record<ToastType, number> = {
  error: 6000,
  success: 3500,
  info: 3500,
}

const genId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],

  showToast: ({ type, title, message, ttlMs }) => {
    const id = genId()
    const now = Date.now()
    const toast: Toast = {
      id,
      type,
      title,
      message,
      createdAt: now,
      ttlMs: ttlMs ?? defaultTtlByType[type],
    }
    set((state) => ({ toasts: [...state.toasts, toast] }))
    return id
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}))
