export type Severity = 'low' | 'medium' | 'high'
export type AnalysisMode = 'resume_only' | 'job_match'

export interface ScoreExplanationComponent {
  id?: string
  title?: string
  score?: number
  weight?: number
  explanation?: string
}

export interface ScoreExplanationPayload {
  totalScore?: number
  components?: ScoreExplanationComponent[]
}

export interface MissingKeywordBuckets {
  fromJobDescription?: string[]
  industryCommon?: string[]
}

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

export type RecommendationSeverity = 'info' | 'warning' | 'critical'

export interface RecommendationItem {
  id: string
  title: string
  summary: string
  details?: string
  severity: RecommendationSeverity
  category: string
  order: number
}

export interface AnalysisResponse {
  analysisId: string
  createdAt: string
  matchScore: number
  analysisMode?: AnalysisMode
  scoreExplanation?: ScoreExplanationPayload
  missingKeywordBuckets?: MissingKeywordBuckets
  missingKeywords: string[]
  weakKeywords: string[]
  matchedKeywords?: string[]
  atsChecks: AtsCheck[]
  bulletSuggestions: BulletSuggestion[]
  recommendations?: RecommendationItem[]
  summary: string
  nextSteps: string[]
}

export interface UsageResponse {
  plan: string
  limit: number
  used: number
  resetsAt: string
}
