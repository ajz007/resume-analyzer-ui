export type BackendSeverity = 'info' | 'warning' | 'critical' | 'low' | 'medium' | 'high'

export interface BackendMeta {
  analysisId?: string
  createdAt?: string
  analysisMode?: 'resume_only' | 'job_match'
  documentId?: string
}

export interface BackendSummary {
  matchScore?: number
  overview?: string
  matchedKeywords?: string[]
}

export interface BackendScoreComponent {
  id?: string
  title?: string
  score?: number
  weight?: number
  explanation?: string
}

export interface BackendScoreBreakdown {
  totalScore?: number
  overallScore?: number
  components?: BackendScoreComponent[]
}

export interface BackendScoreExplanation {
  totalScore?: number
  components?: BackendScoreComponent[]
}

export interface BackendIssue {
  id?: string
  title?: string
  severity?: BackendSeverity
  message?: string
  detail?: string
}

export interface BackendATS {
  scoreBreakdown?: BackendScoreBreakdown
  scoreReasoning?: string
  scoreExplanation?: BackendScoreExplanation | string
  missingKeywords?:
    | string[]
    | {
        fromJobDescription?: string[]
        industryCommon?: string[]
      }
  matchedKeywords?: string[]
  formattingIssues?: BackendIssue[]
}

export interface BackendBulletRewrite {
  original?: string
  rewrite?: string
  reason?: string
}

export interface BackendRecommendation {
  id?: string
  title?: string
  summary?: string
  details?: string
  severity?: BackendSeverity
  category?: string
  order?: number
}

export interface BackendActionPlan {
  steps?: string[]
}

export interface BackendMissingInformation {
  skills?: string[]
  keywords?: string[]
  notes?: string[]
}

export interface BackendAnalysisResult {
  meta?: BackendMeta
  summary?: BackendSummary
  ats?: BackendATS
  issues?: BackendIssue[]
  bulletRewrites?: BackendBulletRewrite[]
  recommendations?: BackendRecommendation[]
  actionPlan?: BackendActionPlan | string[]
  missingInformation?: BackendMissingInformation
}
