export type BackendSeverity = 'info' | 'warning' | 'critical' | 'low' | 'medium' | 'high'

export interface BackendMeta {
  analysisId?: string
  createdAt?: string
  analysisMode?: 'resume_only' | 'job_match'
  documentId?: string
  jobDescriptionProvided?: boolean
}

export interface BackendSummary {
  matchScore?: number
  overview?: string
  matchedKeywords?: string[]
}

export interface BackendScoreComponent {
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
  section?: string
  problem?: string
  suggestion?: string
  whyItMatters?: string
  evidence?: string
  requiresUserInput?: string[]
  priority?: number
}

export interface BackendATS {
  score?: number
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
  before?: string
  after?: string
  rationale?: string
  section?: string
  claimSupport?: 'supported' | 'placeholder'
  placeholdersNeeded?: string[]
  metricsSource?: string
}

export interface BackendRecommendation {
  id?: string
  title?: string
  summary?: string
  action?: string
  details?: string
  severity?: BackendSeverity
  category?: string
  order?: number
}

export interface BackendActionPlan {
  steps?: string[]
  quickWins?: string[]
  mediumEffort?: string[]
  deepFixes?: string[]
}

export interface BackendJobPriority {
  id?: string
  priority?: string
  importance?: string
  weight?: number
  evidenceExpected?: string
  resumeMatchStatus?: string
  whyItMatters?: string
}

export interface BackendJobRequirementProfile {
  isApplicable?: boolean
  primaryRole?: string
  seniority?: string
  roleType?: string
  recruiterIntentSummary?: string
  topPriorities?: BackendJobPriority[]
  hiddenExpectations?: unknown[]
  niceToHaveSignals?: unknown[]
}

export interface BackendRequirementScore {
  requirementId?: string
  requirement?: string
  weight?: number
  score?: number
  weightedContribution?: number
  matchStatus?: string
  evidence?: string
  gap?: string
}

export interface BackendJobMatchScoring {
  score?: number
  scoringStrategy?: string
  requirementScores?: BackendRequirementScore[]
  explanation?: string
}

export interface BackendAIScreeningBreakdownItem {
  id?: string
  label?: string
  score?: number
  weight?: number
  status?: string
  explanation?: string
  improvementFocus?: string
}

export interface BackendAIScreening {
  score?: number
  verdict?: {
    tier?: string
    title?: string
    summary?: string
    screeningRisk?: string
  }
  scoreBreakdown?: BackendAIScreeningBreakdownItem[]
  aiRecruiterVerdict?: {
    oneLineVerdict?: string
    mainConcern?: string
    strongestSignal?: string
    weakestSignal?: string
  }
}

export interface BackendFixThisFirstItem {
  priority?: number
  title?: string
  why?: string
  linkedRequirementId?: string
  expectedImpact?: string
  effort?: string
  action?: string
  requiresUserInput?: boolean
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
  finalScore?: number
  matchScore?: number
  jobRequirementProfile?: BackendJobRequirementProfile
  jobMatchScoring?: BackendJobMatchScoring
  aiScreening?: BackendAIScreening
  fixThisFirst?: BackendFixThisFirstItem[]
  issues?: BackendIssue[]
  bulletRewrites?: BackendBulletRewrite[]
  recommendations?: BackendRecommendation[]
  actionPlan?: BackendActionPlan | string[]
  missingInformation?: BackendMissingInformation
}
