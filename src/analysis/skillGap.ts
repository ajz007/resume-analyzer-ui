import type { AnalysisResponse } from '../api/types'

export type SkillGapCategory = 'missing_jd' | 'suggested_industry'

export interface SkillGapSkill {
  name: string
  category: SkillGapCategory
  reason: string
  recommendation?: string
}

export interface SkillGapModel {
  missingFromJobDescription: SkillGapSkill[]
  suggestedIndustryCommon: SkillGapSkill[]
  recommendations: string[]
}

const reasonCopy = {
  missing: 'Appears in the job description but not in your resume.',
  suggested: 'Common in similar roles, but not listed on your resume yet.',
}

const recommendationCopy = {
  missing: 'If you have experience, add it to Skills or Projects. If not, focus on adjacent strengths.',
  suggested: 'Consider adding it only if it reflects your real experience.',
}

export const buildSkillGapModel = (analysis: AnalysisResponse): SkillGapModel => {
  const buckets = analysis.missingKeywordBuckets
  const missingFromJobDescription = (buckets?.fromJobDescription ?? []).map((skill) => ({
    name: skill,
    category: 'missing_jd' as const,
    reason: reasonCopy.missing,
    recommendation: recommendationCopy.missing,
  }))

  const suggestedIndustryCommon = (buckets?.industryCommon ?? []).map((skill) => ({
    name: skill,
    category: 'suggested_industry' as const,
    reason: reasonCopy.suggested,
    recommendation: recommendationCopy.suggested,
  }))

  return {
    missingFromJobDescription,
    suggestedIndustryCommon,
    recommendations: [
      'Prioritize missing skills you can honestly claim.',
      'Add suggested skills only when they match your real experience.',
      'Keep the list truthful and specific.',
    ],
  }
}
