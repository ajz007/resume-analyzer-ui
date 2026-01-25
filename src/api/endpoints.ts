import { env } from '../app/env'
import { apiRequest } from './client'
import type { AnalysisResponse, UsageResponse } from './types'
import type { BackendAnalysisResult } from './backendTypes'
import type { UploadedDoc } from './documents'
import { fromBackendResult } from '../analysis/adapters/fromBackend'

type AnalyzeStartResponse = { analysisId: string; status: string }
type AnalyzeStatusResponse = { id: string; status: string; result?: BackendAnalysisResult }
type ListParams = { limit?: number; offset?: number }
type AnalysisListItem = Pick<AnalysisResponse, 'analysisId' | 'createdAt' | 'matchScore'> & {
  status?: string
}
type AnalysesApiResponse = { items: AnalysisListItem[] } | AnalysisListItem[]

const mockAnalysis: AnalysisResponse = {
  analysisId: 'mock-123',
  createdAt: new Date().toISOString(),
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
  summary: 'Overall alignment is moderate. Consider strengthening cloud and containerization keywords.',
  nextSteps: ['Add Kubernetes exposure', 'Tighten resume to 2 pages', 'Highlight TypeScript projects'],
}

const analyzeMock = async (documentId: string, jobDescription: string): Promise<AnalysisResponse> => {
  const dynamicMock: AnalysisResponse = {
    ...mockAnalysis,
    analysisId: `mock-${Date.now()}`,
    summary: `${mockAnalysis.summary} Document: ${documentId}. JD length: ${jobDescription.length} chars.`,
    createdAt: new Date().toISOString(),
  }

  return new Promise((resolve) => setTimeout(() => resolve(dynamicMock), 500))
}

const normalizeAnalysis = (analysis: AnalysisResponse): AnalysisResponse => ({
  ...analysis,
  analysisMode: analysis.analysisMode ?? 'job_match',
  missingKeywordBuckets: analysis.missingKeywordBuckets ?? {
    fromJobDescription: analysis.missingKeywords ?? [],
  },
  missingKeywords: analysis.missingKeywords ?? [],
  weakKeywords: analysis.weakKeywords ?? [],
  matchedKeywords: analysis.matchedKeywords ?? [],
  recommendations: analysis.recommendations ?? [],
  atsChecks: analysis.atsChecks ?? [],
  bulletSuggestions: analysis.bulletSuggestions ?? [],
  nextSteps: analysis.nextSteps ?? [],
})

const pollAnalysisResult = async (analysisId: string): Promise<AnalysisResponse> => {
  const start = Date.now()
  let intervalMs = 500

  while (true) {
    if (Date.now() - start > 30_000) {
      throw new Error('Analysis timed out')
    }

    const statusBody = await apiRequest<AnalyzeStatusResponse>(`/analyses/${analysisId}`, {
      method: 'GET',
    })

    if (statusBody.status === 'completed' && statusBody.result) {
      const adapted = fromBackendResult(statusBody.result)
      return normalizeAnalysis(adapted)
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    intervalMs = Math.min(intervalMs * 2, 2000)
  }
}

export async function analyzeDocument(documentId: string, jobDescription: string): Promise<AnalysisResponse> {
  if (env.useMockApi) {
    return analyzeMock(documentId, jobDescription)
  }

  const startResponse = await apiRequest<AnalyzeStartResponse>(`/documents/${documentId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription }),
  })

  return pollAnalysisResult(startResponse.analysisId)
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

const normalizeAnalysisListItem = (item: AnalysisListItem, idx: number): AnalysisListItem => ({
  analysisId: item.analysisId ?? (item as { id?: string }).id ?? `analysis-${idx + 1}`,
  createdAt: item.createdAt ?? new Date().toISOString(),
  matchScore: item.matchScore ?? 0,
  status: item.status,
})

export async function fetchUsage(): Promise<UsageResponse> {
  if (env.useMockApi) {
    return new Promise((resolve) => setTimeout(() => resolve(mockUsage), 300))
  }
  return apiRequest<UsageResponse>('/usage', {
    method: 'GET',
  })
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
