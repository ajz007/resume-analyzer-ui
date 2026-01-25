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
  AtsCheck,
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

const getMatchScore = (result: BackendAnalysisResult) => {
  const summaryScore = result.summary?.matchScore
  const breakdownScore = result.ats?.scoreBreakdown?.totalScore ?? result.ats?.scoreBreakdown?.overallScore
  return typeof summaryScore === 'number' ? summaryScore : typeof breakdownScore === 'number' ? breakdownScore : 0
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
      id: component.id,
      title: component.title,
      score: component.score,
      weight: component.weight,
      explanation: component.explanation,
    })),
  }
}

const mapRecommendation = (item: BackendRecommendation, index: number): RecommendationItem => {
  const severity = mapSeverity(item.severity)
  return {
    id: item.id ?? `rec-${index + 1}`,
    title: item.title ?? 'Recommendation',
    summary: item.summary ?? item.details ?? 'Consider this improvement.',
    details: item.details,
    severity: severity === 'high' ? 'critical' : severity === 'medium' ? 'warning' : 'info',
    category: item.category ?? 'General',
    order: typeof item.order === 'number' ? item.order : index + 1,
  }
}

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
    original: rewrite.original ?? `Original bullet ${idx + 1}`,
    suggested: rewrite.rewrite ?? rewrite.original ?? 'Add measurable impact.',
    reason: rewrite.reason ?? 'Clarify the impact or outcome.',
  }))
  const recommendations = toArray(result.recommendations).map(mapRecommendation)

  return {
    analysisId,
    createdAt,
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
    summary: pickSummaryText(result.summary),
    nextSteps: getActionPlanSteps(result.actionPlan),
  }
}
