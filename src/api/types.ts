export type Severity = 'low' | 'medium' | 'high'
export type AnalysisMode = 'resume_only' | 'job_match'

export interface ScoreExplanationComponent {
  id?: string
  key?: string
  title?: string
  label?: string
  score?: number
  weight?: number
  explanation?: string
  helped?: string[]
  dragged?: string[]
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
  section?: string
  claimSupport?: 'supported' | 'placeholder'
  placeholdersNeeded?: string[]
  metricsSource?: string
}

export type RecommendationSeverity = 'info' | 'warning' | 'critical'

export interface RecommendationItem {
  id: string
  title: string
  summary: string
  action?: string
  details?: string
  severity: RecommendationSeverity
  category: string
  order: number
}

export interface IssueItem {
  section: string
  problem: string
  suggestion: string
  whyItMatters?: string
  requiresUserInput: string[]
  severity: string
  priority: number
}

export interface ActionPlan {
  quickWins: string[]
  mediumEffort: string[]
  deepFixes: string[]
}

export interface AnalysisResponse {
  analysisId: string
  createdAt: string
  finalScore?: number
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
  issues?: IssueItem[]
  actionPlan?: ActionPlan
  summary: string
  nextSteps: string[]
}

export interface UsageResponse {
  plan: string
  limit: number
  used: number
  resetsAt: string
}
