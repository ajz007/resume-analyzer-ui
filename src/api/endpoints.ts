import { env } from '../app/env'
import { apiRequest } from './client'
import type { AnalysisResponse, UsageResponse } from './types'

const mockAnalysis: AnalysisResponse = {
  analysisId: 'mock-123',
  createdAt: new Date().toISOString(),
  matchScore: 72,
  missingKeywords: ['Kubernetes', 'TypeScript'],
  weakKeywords: ['API design'],
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

const analyzeMock = async (file: File, jobDescription: string): Promise<AnalysisResponse> => {
  const dynamicMock: AnalysisResponse = {
    ...mockAnalysis,
    analysisId: `mock-${Date.now()}`,
    summary: `${mockAnalysis.summary} Resume file: ${file.name}. JD length: ${jobDescription.length} chars.`,
    createdAt: new Date().toISOString(),
  }

  return new Promise((resolve) => setTimeout(() => resolve(dynamicMock), 500))
}

export async function analyzeResume(file: File, jobDescription: string): Promise<AnalysisResponse> {
  if (env.useMockApi) {
    return analyzeMock(file, jobDescription)
  }

  const formData = new FormData()
  formData.append('resume', file)
  formData.append('jobDescription', jobDescription)

  return apiRequest<AnalysisResponse>('/v1/analyze', {
    method: 'POST',
    body: formData,
  })
}

const mockUsage: UsageResponse = {
  plan: 'Starter',
  limit: 10,
  used: 3,
  resetsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
}

export async function fetchUsage(): Promise<UsageResponse> {
  if (env.useMockApi) {
    return new Promise((resolve) => setTimeout(() => resolve(mockUsage), 300))
  }
  return apiRequest<UsageResponse>('/v1/usage', {
    method: 'GET',
  })
}
