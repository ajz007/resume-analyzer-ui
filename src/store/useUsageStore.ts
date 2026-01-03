import { create } from 'zustand'
import type { UsageResponse } from '../api/types'
import { fetchUsage } from '../api/endpoints'

type UsageState = {
  usage: UsageResponse | null
  loading: boolean
  error?: string
  fetch: (force?: boolean) => Promise<void>
}

export const useUsageStore = create<UsageState>((set, get) => ({
  usage: null,
  loading: false,
  error: undefined,
  fetch: async (force = false) => {
    if (!force && get().usage) {
      return
    }
    set({ loading: true, error: undefined })
    try {
      const data = await fetchUsage()
      set({ usage: data, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch usage.'
      set({ error: message, loading: false })
    }
  },
}))
