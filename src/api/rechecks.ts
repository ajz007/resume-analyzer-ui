import { apiRequest } from './client'

export type Recheck = { analysisId: string; documentId: string; status: string; score?: number }
export type ApplicationRechecks = { originalAnalysisId: string; rechecks: Recheck[] }

const path = (id: string) => `/analyses/${encodeURIComponent(id)}/rechecks`

export function fetchRechecks(id: string) {
  return apiRequest<ApplicationRechecks>(path(id), {}, { suppressToast: true })
}

export function startRecheck(id: string, documentId: string, retry: boolean) {
  return apiRequest<{ analysisId: string }>(path(id), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, retry }),
  }, { suppressToast: true })
}
