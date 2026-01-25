import type { AnalysisResponse, AtsCheck, Severity } from '../api/types'

export type InsightSeverity = 'info' | 'warning' | 'critical'

export type InsightSectionTitle =
  | 'ATS Compatibility'
  | 'Content Quality'
  | 'Experience & Impact'
  | 'Skills Coverage'
  | 'Formatting & Structure'

export interface InsightItem {
  id: string
  severity: InsightSeverity
  title: string
  explanation: string
  actionable_tip: string
}

export interface InsightSection {
  id: string
  title: InsightSectionTitle
  insights: InsightItem[]
}

export interface InsightsModel {
  sections: InsightSection[]
}

const severityMap: Record<Severity, InsightSeverity> = {
  low: 'info',
  medium: 'warning',
  high: 'critical',
}

const isFormattingCheck = (check: AtsCheck) => {
  const token = `${check.id} ${check.title}`.toLowerCase()
  return ['format', 'length', 'layout', 'section', 'spacing', 'font', 'header', 'contact'].some((key) =>
    token.includes(key),
  )
}

const buildAtsTip = (check: AtsCheck) => {
  const token = `${check.id} ${check.title}`.toLowerCase()
  if (token.includes('length')) {
    return 'Keep the resume to 1-2 pages unless you have extensive experience.'
  }
  if (token.includes('format') || token.includes('layout')) {
    return 'Use simple headings, standard fonts, and avoid tables or graphics.'
  }
  if (token.includes('header') || token.includes('contact')) {
    return 'Place contact details in plain text at the top of the first page.'
  }
  return 'Adjust this area so screening systems can read it clearly.'
}

const buildAtsInsight = (check: AtsCheck, bucket: 'ats' | 'formatting'): InsightItem => ({
  id: `${bucket}-${check.id}`,
  severity: severityMap[check.severity],
  title: check.title,
  explanation: check.message,
  actionable_tip: buildAtsTip(check),
})

const buildMatchInsight = (analysis: AnalysisResponse): InsightItem => {
  const score = analysis.matchScore ?? 0
  const severity: InsightSeverity = score >= 80 ? 'info' : score >= 60 ? 'warning' : 'critical'
  const title = score >= 80 ? 'Strong overall match' : score >= 60 ? 'Moderate overall match' : 'Low overall match'
  return {
    id: 'content-match-score',
    severity,
    title,
    explanation: `Your resume matches about ${score}% of the role requirements.`,
    actionable_tip: 'Prioritize the missing and weak skills, then align project language to the job post.',
  }
}

const buildMissingKeywordInsights = (missing: string[]): InsightItem[] => {
  const severity: InsightSeverity = missing.length >= 5 ? 'critical' : 'warning'
  return missing.map((keyword) => ({
    id: `skill-missing-${keyword.toLowerCase().replace(/\s+/g, '-')}`,
    severity,
    title: `Missing skill: ${keyword}`,
    explanation: 'This skill appears in the job description but not in your resume.',
    actionable_tip: 'Add it where you have real experience or remove it if it does not apply.',
  }))
}

const buildWeakKeywordInsights = (weak: string[]): InsightItem[] => {
  const severity: InsightSeverity = weak.length >= 5 ? 'warning' : 'info'
  return weak.map((keyword) => ({
    id: `skill-weak-${keyword.toLowerCase().replace(/\s+/g, '-')}`,
    severity,
    title: `Low emphasis: ${keyword}`,
    explanation: 'This skill is mentioned but not tied to clear work or results.',
    actionable_tip: 'Link it to a project, tool, or outcome to make it stronger.',
  }))
}

const buildBulletInsights = (suggestions: AnalysisResponse['bulletSuggestions']): InsightItem[] => {
  return suggestions.map((suggestion, idx) => ({
    id: `impact-bullet-${idx + 1}`,
    severity: 'warning',
    title: 'Add measurable impact to a bullet',
    explanation: 'At least one experience bullet lacks a clear result or scale.',
    actionable_tip: `Rewrite it to include numbers or outcomes, for example: ${suggestion.suggested}`,
  }))
}

const buildNextStepInsights = (nextSteps: string[]): InsightItem[] => {
  return nextSteps.map((step, idx) => ({
    id: `content-next-step-${idx + 1}`,
    severity: 'info',
    title: 'Recommended improvement',
    explanation: 'A quick change that can improve your match score.',
    actionable_tip: step,
  }))
}

export const mapAnalysisToInsights = (analysis: AnalysisResponse): InsightsModel => {
  const atsChecks = analysis.atsChecks ?? []
  const formattingChecks = atsChecks.filter(isFormattingCheck)
  const atsCompatibilityChecks = atsChecks.filter((check) => !isFormattingCheck(check))

  const atsInsights = atsCompatibilityChecks.map((check) => buildAtsInsight(check, 'ats'))
  const formattingInsights = formattingChecks.map((check) => buildAtsInsight(check, 'formatting'))

  const skillsInsights = [
    ...buildMissingKeywordInsights(analysis.missingKeywords ?? []),
    ...buildWeakKeywordInsights(analysis.weakKeywords ?? []),
  ]

  const contentInsights = [
    buildMatchInsight(analysis),
    ...buildNextStepInsights(analysis.nextSteps ?? []),
  ]

  const experienceInsights = buildBulletInsights(analysis.bulletSuggestions ?? [])

  return {
    sections: [
      { id: 'ats-compatibility', title: 'ATS Compatibility', insights: atsInsights },
      { id: 'content-quality', title: 'Content Quality', insights: contentInsights },
      { id: 'experience-impact', title: 'Experience & Impact', insights: experienceInsights },
      { id: 'skills-coverage', title: 'Skills Coverage', insights: skillsInsights },
      { id: 'formatting-structure', title: 'Formatting & Structure', insights: formattingInsights },
    ],
  }
}
