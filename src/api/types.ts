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
  evidence?: string
  requiresUserInput: string[]
  severity: string
  priority?: number
}

export interface ActionPlan {
  quickWins: string[]
  mediumEffort: string[]
  deepFixes: string[]
}

export interface JobPriority {
  id: string
  priority: string
  importance: string
  weight: number
  evidenceExpected: string
  resumeMatchStatus: string
  whyItMatters: string
}

export interface JobRequirementProfile {
  isApplicable: boolean
  primaryRole?: string
  seniority?: string
  roleType?: string
  recruiterIntentSummary?: string
  topPriorities?: JobPriority[]
  hiddenExpectations?: unknown[]
  niceToHaveSignals?: unknown[]
}

export interface RequirementScore {
  requirementId: string
  requirement: string
  weight: number
  score: number
  weightedContribution?: number
  matchStatus: string
  evidence?: string
  gap?: string
}

export interface JobMatchScoring {
  score: number
  scoringStrategy?: string
  requirementScores?: RequirementScore[]
  explanation?: string
}

export interface AIScreeningBreakdownItem {
  id: string
  label: string
  score: number
  weight: number
  status: string
  explanation?: string
  improvementFocus?: string
}

export interface AIScreeningVerdict {
  tier: string
  title?: string
  summary?: string
  screeningRisk?: string
}

export interface AIRecruiterVerdict {
  oneLineVerdict?: string
  mainConcern?: string
  strongestSignal?: string
  weakestSignal?: string
}

export interface AIScreening {
  score: number
  verdict?: AIScreeningVerdict
  scoreBreakdown?: AIScreeningBreakdownItem[]
  aiRecruiterVerdict?: AIRecruiterVerdict
}

export interface ATSScore {
  score?: number
}

export interface FixThisFirstItem {
  priority: number
  title: string
  why: string
  linkedRequirementId?: string
  expectedImpact: string
  effort: string
  action: string
  requiresUserInput?: boolean
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
  jobRequirementProfile?: JobRequirementProfile
  jobMatchScoring?: JobMatchScoring
  aiScreening?: AIScreening
  ats?: ATSScore
  fixThisFirst?: FixThisFirstItem[]
  summary: string
  nextSteps: string[]
}

export interface UsageResponse {
  plan: string
  limit: number
  used: number
  remaining?: number
  authenticated?: boolean
  resetsAt: string
}

export interface ShareLinkResponse {
  shareUrl: string
  token: string
  shareId: string
}

export interface SharedAnalysisResponse {
  id: string
  mode?: string
  status: string
  startedAt?: string
  completedAt?: string
  result: AnalysisResponse | null
}
