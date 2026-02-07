import { env } from '../app/env'
import { apiRequest } from './client'
import type { AnalysisResponse, UsageResponse } from './types'
import type { BackendAnalysisResult } from './backendTypes'
import type { UploadedDoc } from './documents'
import { fromBackendResult } from '../analysis/adapters/fromBackend'

type AnalyzeStartResponse = { analysisId: string; status: string; pollAfterMs?: number }
type AnalyzeStatusResponse = {
  id: string
  status: string
  pollAfterMs?: number
  retryAfterMs?: number
  result?: BackendAnalysisResult
}
type ClaimGuestResponse = { migratedCount?: number }
type ListParams = { limit?: number; offset?: number }
type AnalysisListItem = Pick<AnalysisResponse, 'analysisId' | 'createdAt' | 'matchScore'> & {
  status?: string
  summary?: string
  finalScore?: number
  score?: number
  resumeFileName?: string
  jobDescription?: string
  result?: {
    finalScore?: number
    ats?: { score?: number }
  }
}
type AnalysesApiResponse = { items: AnalysisListItem[] } | AnalysisListItem[]

const mockAnalysis: AnalysisResponse = {
  analysisId: 'mock-123',
  createdAt: new Date().toISOString(),
  finalScore: 74,
  matchScore: 72,
  analysisMode: 'job_match',
  missingKeywords: ['Kubernetes', 'TypeScript'],
  weakKeywords: ['API design'],
  matchedKeywords: ['Python', 'AWS', 'REST APIs'],
  missingKeywordBuckets: {
    fromJobDescription: ['Kubernetes', 'TypeScript'],
    industryCommon: ['Docker', 'Terraform'],
  },
  recommendations: [
    {
      id: 'rec-1',
      title: 'Add missing Kubernetes experience',
      summary: 'Highlight any hands-on work with Kubernetes in recent projects.',
      details: 'Include the cluster size, workloads, or tools used to show depth.',
      severity: 'warning',
      category: 'Skills',
      order: 1,
    },
    {
      id: 'rec-2',
      title: 'Tighten resume length',
      summary: 'Consider reducing to two pages for faster screening.',
      details: 'Focus on the last 5-7 years and consolidate older roles.',
      severity: 'info',
      category: 'Structure',
      order: 2,
    },
  ],
  atsChecks: [
    { id: 'ats-format', title: 'Formatting', severity: 'low', message: 'Header looks OK' },
    { id: 'ats-length', title: 'Length', severity: 'medium', message: 'Resume is 3 pages' },
  ],
  bulletSuggestions: [
    {
      original: 'Improved system performance',
      suggested: 'Improved system performance by 25% by optimizing caching and DB indexes',
      reason: 'Quantify the impact with numbers',
    },
  ],
  actionPlan: {
    quickWins: ['Add missing Kubernetes exposure', 'Highlight TypeScript projects'],
    mediumEffort: ['Tighten resume to 2 pages'],
    deepFixes: ['Restructure experience section to emphasize cloud impact'],
  },
  summary: 'Overall alignment is moderate. Consider strengthening cloud and containerization keywords.',
  nextSteps: ['Add Kubernetes exposure', 'Tighten resume to 2 pages', 'Highlight TypeScript projects'],
}

const analyzeMock = async (
  documentId: string,
  jobDescription: string,
  mode: 'ATS' | 'JOB_MATCH',
): Promise<AnalysisResponse> => {
  const dynamicMock: AnalysisResponse = {
    ...mockAnalysis,
    analysisId: `mock-${Date.now()}`,
    summary: `${mockAnalysis.summary} Document: ${documentId}. JD length: ${jobDescription.length} chars.`,
    createdAt: new Date().toISOString(),
    analysisMode: mode === 'ATS' ? 'ats' : 'job_match',
  }

  return new Promise((resolve) => setTimeout(() => resolve(dynamicMock), 500))
}

const normalizeAnalysis = (analysis: AnalysisResponse): AnalysisResponse => ({
  ...analysis,
  analysisMode: analysis.analysisMode ?? 'job_match',
  finalScore: analysis.finalScore ?? analysis.matchScore ?? 0,
  missingKeywordBuckets: analysis.missingKeywordBuckets ?? {
    fromJobDescription: analysis.missingKeywords ?? [],
  },
  missingKeywords: analysis.missingKeywords ?? [],
  weakKeywords: analysis.weakKeywords ?? [],
  matchedKeywords: analysis.matchedKeywords ?? [],
  recommendations: analysis.recommendations ?? [],
  actionPlan: analysis.actionPlan ?? {
    quickWins: analysis.nextSteps ?? [],
    mediumEffort: [],
    deepFixes: [],
  },
  atsChecks: analysis.atsChecks ?? [],
  bulletSuggestions: analysis.bulletSuggestions ?? [],
  nextSteps: analysis.nextSteps ?? [],
})

const DEFAULT_POLL_MS = 20000
const MAX_BACKOFF_MS = 15_000
const HIDDEN_POLL_MS = 8000
const JITTER_MS = 200

const getJitteredDelay = (baseMs: number) => {
  const jitter = Math.round((Math.random() * 2 - 1) * JITTER_MS)
  return Math.max(0, baseMs + jitter)
}

const adjustForHidden = (baseMs: number) => {
  if (typeof document !== 'undefined' && document.hidden) {
    return Math.max(baseMs, HIDDEN_POLL_MS)
  }
  return baseMs
}

const pollAnalysisResult = async (
  analysisId: string,
  initialPollAfterMs?: number,
): Promise<AnalysisResponse> => {
  const start = Date.now()
  let backoffMs = DEFAULT_POLL_MS
  let nextDelayMs = initialPollAfterMs ?? DEFAULT_POLL_MS

  while (true) {
    if (Date.now() - start > 120_000) {
      throw new Error('Analysis timed out')
    }

    try {
      const statusBody = await apiRequest<AnalyzeStatusResponse>(
        `/analyses/${analysisId}`,
        { method: 'GET' },
        { suppressToastOnStatus: [429] },
      )

      if (statusBody.status === 'completed' && statusBody.result) {
        const adapted = fromBackendResult(statusBody.result)
        return normalizeAnalysis(adapted)
      }

      if (statusBody.status === 'failed') {
        throw new Error('Analysis failed')
      }

      backoffMs = DEFAULT_POLL_MS
      nextDelayMs = statusBody.pollAfterMs ?? DEFAULT_POLL_MS
    } catch (err) {
      const apiErr = err as { status?: number; retryAfterMs?: number; details?: unknown }
      if (apiErr?.status === 429) {
        const retryAfterMs =
          apiErr.retryAfterMs ??
          (typeof (apiErr.details as { retryAfterMs?: number })?.retryAfterMs === 'number'
            ? (apiErr.details as { retryAfterMs?: number }).retryAfterMs
            : undefined)
        if (typeof retryAfterMs === 'number' && retryAfterMs > 0) {
          nextDelayMs = retryAfterMs
        } else {
          backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS)
          nextDelayMs = backoffMs
        }
      } else {
        throw err
      }
    }

    const delay = adjustForHidden(nextDelayMs)
    await new Promise((resolve) => setTimeout(resolve, getJitteredDelay(delay)))
  }
}

export async function analyzeDocument(
  documentId: string,
  jobDescription: string,
  mode: 'ATS' | 'JOB_MATCH',
  options: { retry?: boolean } = {},
): Promise<AnalysisResponse> {
  if (env.useMockApi) {
    return analyzeMock(documentId, jobDescription, mode)
  }

  const startResponse = await apiRequest<AnalyzeStartResponse>(`/documents/${documentId}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.retry ? { 'X-Retry-Analysis': 'true' } : {}),
    },
    body: JSON.stringify({ mode, jobDescription: jobDescription ?? '' }),
  })

  return pollAnalysisResult(startResponse.analysisId, startResponse.pollAfterMs)
}

const mockUsage: UsageResponse = {
  plan: 'Starter',
  limit: 10,
  used: 3,
  resetsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
}

const mockDocuments: UploadedDoc[] = Array.from({ length: 3 }).map((_, idx) => ({
  documentId: `doc-${idx + 1}`,
  fileName: `Resume_${idx + 1}.pdf`,
  mimeType: 'application/pdf',
  sizeBytes: 120_000 + idx * 8_000,
  uploadedAt: new Date(Date.now() - idx * 60 * 60 * 1000).toISOString(),
}))

const mockAnalyses: AnalysisListItem[] = Array.from({ length: 5 }).map((_, idx) => ({
  analysisId: `mock-analysis-${idx + 1}`,
  createdAt: new Date(Date.now() - idx * 90 * 60 * 1000).toISOString(),
  matchScore: 60 + idx * 5,
  status: 'completed',
}))

const buildQuery = ({ limit, offset }: ListParams) => {
  const params = new URLSearchParams()
  if (typeof limit === 'number') params.set('limit', String(limit))
  if (typeof offset === 'number') params.set('offset', String(offset))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

const toSummaryString = (summary: unknown): string | undefined => {
  if (!summary) return undefined
  if (typeof summary === 'string') return summary
  if (typeof summary === 'object') {
    const record = summary as {
      overallAssessment?: string
      strengths?: string[]
      weaknesses?: string[]
    }
    if (record.overallAssessment) return record.overallAssessment
    const parts = [...(record.strengths ?? []), ...(record.weaknesses ?? [])].filter(Boolean)
    if (parts.length) return parts.join(' ')
  }
  return undefined
}

const normalizeAnalysisListItem = (item: AnalysisListItem, idx: number): AnalysisListItem => ({
  analysisId: item.analysisId ?? (item as { id?: string }).id ?? `analysis-${idx + 1}`,
  createdAt: item.createdAt ?? new Date().toISOString(),
  matchScore: item.matchScore ?? 0,
  status: item.status,
  summary: toSummaryString(item.summary),
  finalScore: item.finalScore,
  score: item.score,
  resumeFileName: item.resumeFileName,
  jobDescription: item.jobDescription,
  result: item.result,
})

export async function fetchUsage(options: { silent?: boolean } = {}): Promise<UsageResponse> {
  if (env.useMockApi) {
    return new Promise((resolve) => setTimeout(() => resolve(mockUsage), 300))
  }
  return apiRequest<UsageResponse>(
    '/usage',
    {
      method: 'GET',
    },
    options.silent ? { suppressToastOnStatus: [401, 403, 420, 429] } : {},
  )
}

export async function fetchDocuments(params: ListParams = {}): Promise<UploadedDoc[]> {
  if (env.useMockApi) {
    const sliceStart = params.offset ?? 0
    const sliceEnd = sliceStart + (params.limit ?? mockDocuments.length)
    return new Promise((resolve) => setTimeout(() => resolve(mockDocuments.slice(sliceStart, sliceEnd)), 200))
  }

  const query = buildQuery(params)
  return apiRequest<UploadedDoc[]>(`/documents${query}`, { method: 'GET' })
}

export async function fetchAnalyses(params: ListParams = {}): Promise<AnalysisListItem[]> {
  if (env.useMockApi) {
    const sliceStart = params.offset ?? 0
    const sliceEnd = sliceStart + (params.limit ?? mockAnalyses.length)
    return new Promise((resolve) =>
      setTimeout(() => resolve(mockAnalyses.slice(sliceStart, sliceEnd)), 200),
    )
  }

  const query = buildQuery(params)
  const response = await apiRequest<AnalysesApiResponse>(`/analyses${query}`, { method: 'GET' })
  const items = Array.isArray(response) ? response : response.items ?? []
  return items.map((item, idx) => normalizeAnalysisListItem(item, idx))
}

export async function fetchAnalysisResult(analysisId: string): Promise<AnalysisResponse | null> {
  if (env.useMockApi) {
    return {
      ...mockAnalysis,
      analysisId,
      createdAt: new Date().toISOString(),
    }
  }

  const statusBody = await apiRequest<AnalyzeStatusResponse>(`/analyses/${analysisId}`, {
    method: 'GET',
  })
  if (statusBody.status === 'completed' && statusBody.result) {
    const adapted = fromBackendResult(statusBody.result)
    return normalizeAnalysis(adapted)
  }
  return null
}

export async function claimGuestAnalyses(): Promise<ClaimGuestResponse> {
  return apiRequest<ClaimGuestResponse>('/account/claim-guest', {
    method: 'POST',
  })
}
