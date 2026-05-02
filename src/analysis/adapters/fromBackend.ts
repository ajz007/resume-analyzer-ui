import type {
  BackendAnalysisResult,
  BackendIssue,
  BackendSeverity,
  BackendRecommendation,
  BackendSummary,
  BackendScoreExplanation,
} from '../../api/backendTypes'
import type {
  AnalysisResponse,
  ActionPlan,
  AIScreening,
  AtsCheck,
  FixThisFirstItem,
  IssueItem,
  JobMatchScoring,
  JobRequirementProfile,
  MissingKeywordBuckets,
  RecommendationItem,
  ScoreExplanationPayload,
  Severity,
} from '../../api/types'

const mapSeverity = (severity?: BackendSeverity): Severity => {
  if (severity === 'high' || severity === 'critical') return 'high'
  if (severity === 'medium' || severity === 'warning') return 'medium'
  return 'low'
}

const pickSummaryText = (summary?: BackendSummary) => {
  if (!summary) return ''
  return summary.overview ?? ''
}

const mapIssueToCheck = (issue: BackendIssue, index: number): AtsCheck => ({
  id: issue.id ?? `ats-issue-${index + 1}`,
  title: issue.title ?? 'ATS check',
  severity: mapSeverity(issue.severity),
  message: issue.message ?? issue.detail ?? 'No details provided.',
})

const toArray = <T>(value?: T[] | null): T[] => (Array.isArray(value) ? value : [])

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

const computeFromBreakdown = (explanation?: BackendScoreExplanation | string) => {
  if (!explanation || typeof explanation === 'string') return undefined
  if (typeof explanation.totalScore === 'number') {
    return clamp(Math.round(explanation.totalScore))
  }
  const components = toArray(explanation.components)
  if (!components.length) return undefined
  const totalWeight = components.reduce((sum, component) => sum + (component.weight ?? 0), 0)
  if (totalWeight > 0) {
    const weighted = components.reduce(
      (sum, component) => sum + (component.score ?? 0) * (component.weight ?? 0),
      0,
    )
    return clamp(Math.round(weighted))
  }
  const avg =
    components.reduce((sum, component) => sum + (component.score ?? 0), 0) / components.length
  return clamp(Math.round(avg))
}

const getFinalScore = (result: BackendAnalysisResult) => {
  const raw = result.ats?.score
  if (typeof raw === 'number') return clamp(Math.round(raw))
  const breakdownScore = computeFromBreakdown(result.ats?.scoreExplanation)
  if (typeof breakdownScore === 'number') return breakdownScore
  return 0
}

const getMatchScore = (result: BackendAnalysisResult) => {
  if (typeof result.jobMatchScoring?.score === 'number') {
    return clamp(Math.round(result.jobMatchScoring.score))
  }
  if (typeof result.matchScore === 'number') {
    return clamp(Math.round(result.matchScore))
  }
  const summary = result.summary as
    | {
        matchScore?: number
        matchPercentage?: number
        score?: number
      }
    | undefined
  const summaryScore =
    typeof summary?.matchScore === 'number'
      ? summary.matchScore
      : typeof summary?.matchPercentage === 'number'
      ? summary.matchPercentage
      : typeof summary?.score === 'number'
      ? summary.score
      : undefined

  const breakdownScore =
    result.ats?.scoreBreakdown?.totalScore ?? result.ats?.scoreBreakdown?.overallScore

  if (typeof summaryScore === 'number') return clamp(Math.round(summaryScore))
  if (typeof breakdownScore === 'number') return clamp(Math.round(breakdownScore))

  const jdProvided = result.meta?.jobDescriptionProvided === true
  if (!jdProvided) return 0

  const missingKeywords = result.ats?.missingKeywords
  const missingCount = Array.isArray(missingKeywords)
    ? missingKeywords.length
    : (missingKeywords?.fromJobDescription ?? []).length
  return clamp(100 - missingCount * 4)
}

const toActionPlan = (actionPlan?: BackendAnalysisResult['actionPlan']): ActionPlan => {
  if (!actionPlan) return { quickWins: [], mediumEffort: [], deepFixes: [] }
  if (Array.isArray(actionPlan)) {
    return { quickWins: actionPlan, mediumEffort: [], deepFixes: [] }
  }
  const quickWins = toArray(actionPlan.quickWins)
  const mediumEffort = toArray(actionPlan.mediumEffort)
  const deepFixes = toArray(actionPlan.deepFixes)
  if (!quickWins.length && !mediumEffort.length && !deepFixes.length) {
    return { quickWins: toArray(actionPlan.steps), mediumEffort: [], deepFixes: [] }
  }
  return { quickWins, mediumEffort, deepFixes }
}

const getActionPlanSteps = (actionPlan?: BackendAnalysisResult['actionPlan']) => {
  if (!actionPlan) return []
  if (Array.isArray(actionPlan)) return actionPlan
  return toArray(actionPlan.steps)
}

const getWeakKeywords = (result: BackendAnalysisResult) => {
  const info = result.missingInformation
  return toArray(info?.skills).length ? toArray(info?.skills) : toArray(info?.keywords)
}

const mapScoreExplanation = (
  explanation?: BackendScoreExplanation | string,
): ScoreExplanationPayload | undefined => {
  if (!explanation || typeof explanation === 'string') return undefined
  return {
    totalScore: explanation.totalScore,
    components: toArray(explanation.components).map((component) => ({
      id: component.key ?? component.id,
      key: component.key,
      title: component.title,
      label: component.label,
      score: component.score,
      weight: component.weight,
      explanation: component.explanation,
      helped: toArray(component.helped),
      dragged: toArray(component.dragged),
    })),
  }
}

const mapRecommendation = (item: BackendRecommendation, index: number): RecommendationItem => {
  const severity = mapSeverity(item.severity)
  return {
    id: item.id ?? `rec-${index + 1}`,
    title: item.title ?? 'Recommendation',
    summary: item.summary ?? item.action ?? item.details ?? 'Consider this improvement.',
    action: item.action,
    details: item.details,
    severity: severity === 'high' ? 'critical' : severity === 'medium' ? 'warning' : 'info',
    category: item.category ?? 'General',
    order: typeof item.order === 'number' ? item.order : index + 1,
  }
}

const mapIssueToUi = (issue: BackendIssue): IssueItem => ({
  section: issue.section ?? issue.title ?? 'General',
  problem: issue.problem ?? issue.message ?? 'Issue noted.',
  suggestion: issue.suggestion ?? issue.detail ?? 'Consider addressing this issue.',
  whyItMatters: issue.whyItMatters,
  evidence: issue.evidence,
  requiresUserInput: Array.isArray(issue.requiresUserInput) ? issue.requiresUserInput : [],
  severity: typeof issue.severity === 'string' ? issue.severity : 'info',
  priority: typeof issue.priority === 'number' ? issue.priority : undefined,
})

const mapJobRequirementProfile = (
  profile?: BackendAnalysisResult['jobRequirementProfile'],
): JobRequirementProfile | undefined => {
  if (!profile) return undefined
  return {
    isApplicable: profile.isApplicable === true,
    primaryRole: profile.primaryRole,
    seniority: profile.seniority,
    roleType: profile.roleType,
    recruiterIntentSummary: profile.recruiterIntentSummary,
    topPriorities: toArray(profile.topPriorities).map((item, index) => ({
      id: item.id ?? `priority-${index + 1}`,
      priority: item.priority ?? 'Requirement',
      importance: item.importance ?? 'MEDIUM',
      weight: typeof item.weight === 'number' ? item.weight : 0,
      evidenceExpected: item.evidenceExpected ?? '',
      resumeMatchStatus: item.resumeMatchStatus ?? 'UNKNOWN',
      whyItMatters: item.whyItMatters ?? '',
    })),
    hiddenExpectations: toArray(profile.hiddenExpectations),
    niceToHaveSignals: toArray(profile.niceToHaveSignals),
  }
}

const mapJobMatchScoring = (
  scoring?: BackendAnalysisResult['jobMatchScoring'],
): JobMatchScoring | undefined => {
  if (!scoring) return undefined
  return {
    score: typeof scoring.score === 'number' ? clamp(Math.round(scoring.score)) : 0,
    scoringStrategy: scoring.scoringStrategy,
    explanation: scoring.explanation,
    requirementScores: toArray(scoring.requirementScores).map((item, index) => ({
      requirementId: item.requirementId ?? `requirement-${index + 1}`,
      requirement: item.requirement ?? 'Requirement',
      weight: typeof item.weight === 'number' ? item.weight : 0,
      score: typeof item.score === 'number' ? clamp(Math.round(item.score)) : 0,
      weightedContribution: item.weightedContribution,
      matchStatus: item.matchStatus ?? 'UNKNOWN',
      evidence: item.evidence,
      gap: item.gap,
    })),
  }
}

const mapAIScreening = (screening?: BackendAnalysisResult['aiScreening']): AIScreening | undefined => {
  if (!screening) return undefined
  return {
    score: typeof screening.score === 'number' ? clamp(Math.round(screening.score)) : 0,
    verdict: screening.verdict
      ? {
          tier: screening.verdict.tier ?? '',
          title: screening.verdict.title,
          summary: screening.verdict.summary,
          screeningRisk: screening.verdict.screeningRisk,
        }
      : undefined,
    scoreBreakdown: toArray(screening.scoreBreakdown).map((item, index) => ({
      id: item.id ?? `screening-${index + 1}`,
      label: item.label ?? item.id ?? 'Screening signal',
      score: typeof item.score === 'number' ? clamp(Math.round(item.score)) : 0,
      weight: typeof item.weight === 'number' ? item.weight : 0,
      status: item.status ?? 'OK',
      explanation: item.explanation,
      improvementFocus: item.improvementFocus,
    })),
    aiRecruiterVerdict: screening.aiRecruiterVerdict,
  }
}

const mapFixThisFirst = (items?: BackendAnalysisResult['fixThisFirst']): FixThisFirstItem[] =>
  toArray(items).map((item, index) => ({
    priority: typeof item.priority === 'number' ? item.priority : index + 1,
    title: item.title ?? 'Fix this first',
    why: item.why ?? '',
    linkedRequirementId: item.linkedRequirementId,
    expectedImpact: item.expectedImpact ?? 'MEDIUM',
    effort: item.effort ?? 'MEDIUM',
    action: item.action ?? '',
    requiresUserInput: item.requiresUserInput,
  }))

export const fromBackendResult = (result: BackendAnalysisResult): AnalysisResponse => {
  const analysisId = result.meta?.analysisId ?? 'analysis-unknown'
  const createdAt = result.meta?.createdAt ?? new Date().toISOString()

  const missingKeywords = toArray(
    Array.isArray(result.ats?.missingKeywords) ? result.ats?.missingKeywords : [],
  )
  const missingKeywordBuckets: MissingKeywordBuckets | undefined =
    result.ats?.missingKeywords && !Array.isArray(result.ats?.missingKeywords)
      ? {
          fromJobDescription: toArray(result.ats.missingKeywords.fromJobDescription),
          industryCommon: toArray(result.ats.missingKeywords.industryCommon),
        }
      : undefined
  const matchedKeywords =
    toArray(result.ats?.matchedKeywords).length > 0
      ? toArray(result.ats?.matchedKeywords)
      : toArray(result.summary?.matchedKeywords)

  const atsChecks = toArray(result.ats?.formattingIssues).map(mapIssueToCheck)
  const bulletSuggestions = toArray(result.bulletRewrites).map((rewrite, idx) => ({
    original: rewrite.before ?? rewrite.original ?? `Original bullet ${idx + 1}`,
    suggested: rewrite.after ?? rewrite.rewrite ?? rewrite.original ?? 'Add measurable impact.',
    reason: rewrite.rationale ?? rewrite.reason ?? 'Clarify the impact or outcome.',
    section: rewrite.section,
    claimSupport: rewrite.claimSupport,
    placeholdersNeeded: Array.isArray(rewrite.placeholdersNeeded) ? rewrite.placeholdersNeeded : [],
    metricsSource: rewrite.metricsSource,
  }))
  const recommendations = toArray(result.recommendations).map(mapRecommendation)
  const issues = toArray(result.issues).map(mapIssueToUi)
  const actionPlan = toActionPlan(result.actionPlan)

  let finalScore = getFinalScore(result)
  const breakdownComponents =
    typeof result.ats?.scoreExplanation === 'string'
      ? []
      : toArray(result.ats?.scoreExplanation?.components)
  const breakdownHasScore = breakdownComponents.some((component) => (component.score ?? 0) > 0)
  if (finalScore === 0 && breakdownHasScore) {
    finalScore = computeFromBreakdown(result.ats?.scoreExplanation) ?? finalScore
  }

  return {
    analysisId,
    createdAt,
    finalScore: typeof result.finalScore === 'number' ? clamp(Math.round(result.finalScore)) : finalScore,
    matchScore: getMatchScore(result),
    analysisMode: result.meta?.analysisMode ?? 'job_match',
    scoreExplanation: mapScoreExplanation(result.ats?.scoreExplanation),
    missingKeywords,
    missingKeywordBuckets,
    weakKeywords: getWeakKeywords(result),
    matchedKeywords,
    atsChecks,
    bulletSuggestions,
    recommendations,
    issues,
    actionPlan,
    jobRequirementProfile: mapJobRequirementProfile(result.jobRequirementProfile),
    jobMatchScoring: mapJobMatchScoring(result.jobMatchScoring),
    aiScreening: mapAIScreening(result.aiScreening),
    ats: typeof result.ats?.score === 'number' ? { score: clamp(Math.round(result.ats.score)) } : undefined,
    fixThisFirst: mapFixThisFirst(result.fixThisFirst),
    summary: pickSummaryText(result.summary),
    nextSteps: getActionPlanSteps(result.actionPlan),
  }
}
