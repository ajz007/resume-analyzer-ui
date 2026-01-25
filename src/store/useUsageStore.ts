import { create } from 'zustand'
import type { UsageResponse } from '../api/types'
import { fetchUsage } from '../api/endpoints'
import type { ApiError } from '../api/client'

type UsageState = {
  usage: UsageResponse | null
  loading: boolean
  error?: string
  errorStatus?: number
  fetchedAt?: number
  nextAllowedFetchAt?: number
  fetch: (options?: { force?: boolean; silent?: boolean }) => Promise<void>
  reset: () => void
}

export const useUsageStore = create<UsageState>((set, get) => ({
  usage: null,
  loading: false,
  error: undefined,
  errorStatus: undefined,
  fetchedAt: undefined,
  nextAllowedFetchAt: undefined,
  fetch: async (options = {}) => {
    const { force = false, silent = true } = options
    const state = get()
    const now = Date.now()
    if (!force && state.fetchedAt && now - state.fetchedAt < 60_000) {
      return
    }
    if (!force && state.nextAllowedFetchAt && now < state.nextAllowedFetchAt) {
      return
    }
    if (state.loading) return
    set({ loading: true, error: undefined, errorStatus: undefined })
    try {
      const data = await fetchUsage({ silent })
      set({ usage: data, loading: false, fetchedAt: Date.now(), errorStatus: undefined })
    } catch (err) {
      const apiErr = err as ApiError
      const status = apiErr?.status
      let nextAllowedFetchAt: number | undefined
      if (status === 420 || status === 429) {
        const retryAfterMs = apiErr?.retryAfterMs ?? 60_000
        nextAllowedFetchAt = Date.now() + retryAfterMs
      }
      const message = err instanceof Error ? err.message : 'Failed to fetch usage.'
      set({
        error: message,
        errorStatus: status,
        loading: false,
        nextAllowedFetchAt,
      })
    }
  },
  reset: () =>
    set({
      usage: null,
      loading: false,
      error: undefined,
      errorStatus: undefined,
      fetchedAt: undefined,
      nextAllowedFetchAt: undefined,
    }),
}))
