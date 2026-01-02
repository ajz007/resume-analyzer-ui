export type Severity = 'low' | 'medium' | 'high'

export interface AtsCheck {
  id: string
  title: string
  severity: Severity
  message: string
}

export interface BulletSuggestion {
  original: string
  suggested: string
  reason: string
}

export interface AnalysisResponse {
  analysisId: string
  createdAt: string
  matchScore: number
  missingKeywords: string[]
  weakKeywords: string[]
  atsChecks: AtsCheck[]
  bulletSuggestions: BulletSuggestion[]
  summary: string
  nextSteps: string[]
}

export interface UsageResponse {
  plan: string
  limit: number
  used: number
  resetsAt: string
}
