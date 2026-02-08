import type { AnalysisResponse, BulletSuggestion } from '../api/types'

export type NormalizedAnalysis = AnalysisResponse & {
  normalized: {
    bulletSuggestions: BulletSuggestion[]
    missingKeywordsFromJD: string[]
    missingKeywordsIndustryCommon: string[]
    atsScore?: number
  }
}

type BulletRewrite = {
  before?: string
  after?: string
  rationale?: string
  section?: string
  claimSupport?: 'supported' | 'placeholder'
  placeholdersNeeded?: string[]
  metricsSource?: string
}

const toStringArray = (value?: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const toArray = <T,>(value?: T[] | null): T[] => (Array.isArray(value) ? value : [])

const buildBulletSuggestions = (result: AnalysisResponse): BulletSuggestion[] => {
  if (Array.isArray(result.bulletSuggestions) && result.bulletSuggestions.length) {
    return result.bulletSuggestions
  }

  const rewrites = toArray((result as { bulletRewrites?: BulletRewrite[] }).bulletRewrites)

  return rewrites.map((rewrite, idx) => ({
    original: rewrite.before ?? `Original bullet ${idx + 1}`,
    suggested: rewrite.after ?? 'Add measurable impact.',
    reason: rewrite.rationale ?? 'Clarify the impact or outcome.',
    section: rewrite.section,
    claimSupport: rewrite.claimSupport,
    placeholdersNeeded: toArray(rewrite.placeholdersNeeded),
    metricsSource: rewrite.metricsSource,
  }))
}

export const normalizeAnalysisResponse = (result: AnalysisResponse): NormalizedAnalysis => {
  const ats = (result as { ats?: { score?: number; missingKeywords?: unknown } }).ats
  const missingKeywords = (ats?.missingKeywords ?? {}) as {
    fromJobDescription?: unknown
    industryCommon?: unknown
  }

  const hasFromJd = Array.isArray(missingKeywords.fromJobDescription)
  const missingKeywordsFromJD = hasFromJd
    ? toStringArray(missingKeywords.fromJobDescription)
    : toStringArray(result.missingKeywords)

  const missingKeywordsIndustryCommon = Array.isArray(missingKeywords.industryCommon)
    ? toStringArray(missingKeywords.industryCommon)
    : toStringArray(result.missingKeywordBuckets?.industryCommon)

  const atsScore =
    typeof ats?.score === 'number'
      ? ats.score
      : typeof (result as { atsScore?: number }).atsScore === 'number'
      ? (result as { atsScore?: number }).atsScore
      : result.finalScore

  return {
    ...result,
    normalized: {
      bulletSuggestions: buildBulletSuggestions(result),
      missingKeywordsFromJD,
      missingKeywordsIndustryCommon,
      atsScore,
    },
  }
}
