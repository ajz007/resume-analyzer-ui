import type { AnalysisResponse, AtsCheck, ScoreExplanationPayload, Severity } from '../api/types'

export type ScoreComponentId =
  | 'ats_readability'
  | 'skill_match'
  | 'experience_relevance'
  | 'resume_structure'

export interface ScoreComponent {
  id: ScoreComponentId
  title: string
  score: number
  weight: number
  explanation: string
  helpedBy: string[]
  draggedBy: string[]
}

export interface ScoreExplanation {
  totalScore: number
  components: ScoreComponent[]
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

const severityPenalty: Record<Severity, number> = {
  low: 5,
  medium: 12,
  high: 22,
}

const isFormattingCheck = (check: AtsCheck) => {
  const token = `${check.id} ${check.title}`.toLowerCase()
  return ['format', 'length', 'layout', 'section', 'spacing', 'font', 'header', 'contact'].some((key) =>
    token.includes(key),
  )
}

const summarizeChecks = (checks: AtsCheck[]) => {
  if (!checks.length) return []
  return checks.slice(0, 3).map((check) => `${check.title}: ${check.message}`)
}

const buildAtsComponent = (checks: AtsCheck[]) => {
  const penalties = checks.reduce((total, check) => total + severityPenalty[check.severity], 0)
  const score = clamp(100 - penalties)
  const dragged = summarizeChecks(checks)
  const helped = checks.length
    ? ['Most formatting and parsing rules are met.']
    : ['No ATS readability issues were detected.']

  return { score, helped, dragged }
}

const buildStructureComponent = (checks: AtsCheck[]) => {
  const penalties = checks.reduce((total, check) => total + severityPenalty[check.severity], 0)
  const score = clamp(100 - penalties)
  const dragged = summarizeChecks(checks)
  const helped = checks.length
    ? ['Key sections are present and labeled.']
    : ['Layout and length look ATS-friendly.']

  return { score, helped, dragged }
}

const buildSkillComponent = (analysis: AnalysisResponse) => {
  const missing = analysis.missingKeywords ?? []
  const weak = analysis.weakKeywords ?? []
  const score = clamp(100 - missing.length * 10 - weak.length * 5)
  const helped: string[] = []
  const dragged: string[] = []

  if (missing.length === 0) helped.push('All required skills appear in the resume.')
  if (weak.length === 0) helped.push('Skills are backed by clear context.')

  if (missing.length) dragged.push(`Missing: ${missing.slice(0, 5).join(', ')}`)
  if (weak.length) dragged.push(`Low emphasis: ${weak.slice(0, 5).join(', ')}`)

  if (!helped.length) helped.push('Several skills align with the job description.')

  return { score, helped, dragged }
}

const buildExperienceComponent = (analysis: AnalysisResponse) => {
  const suggestions = analysis.bulletSuggestions ?? []
  const penalty = Math.min(50, suggestions.length * 12)
  const score = clamp(100 - penalty)
  const helped = suggestions.length
    ? ['Some bullets already include measurable outcomes.']
    : ['Experience bullets show clear impact.']
  const dragged = suggestions.length
    ? ['Several bullets need stronger results or metrics.']
    : []
  return { score, helped, dragged }
}

const scaleToMatchScore = (components: ScoreComponent[], target: number) => {
  const weightedTotal = components.reduce((sum, component) => sum + component.score * component.weight, 0)
  if (weightedTotal <= 0) return components
  const factor = target / weightedTotal
  return components.map((component) => ({
    ...component,
    score: clamp(Math.round(component.score * factor)),
  }))
}

const normalizeComponentId = (id?: string, title?: string): ScoreComponentId => {
  const token = `${id ?? ''} ${title ?? ''}`.toLowerCase()
  if (token.includes('skill')) return 'skill_match'
  if (token.includes('experience')) return 'experience_relevance'
  if (token.includes('structure') || token.includes('format')) return 'resume_structure'
  return 'ats_readability'
}

const mapBackendExplanation = (
  payload?: ScoreExplanationPayload,
  fallbackTotal = 0,
): ScoreExplanation | null => {
  const components = payload?.components ?? []
  if (components.length !== 4) return null

  return {
    totalScore: payload?.totalScore ?? fallbackTotal,
    components: components.map((component) => ({
      id: normalizeComponentId(component.id ?? component.key, component.label ?? component.title),
      title: component.label ?? component.title ?? 'Score component',
      score: component.score ?? 0,
      weight: component.weight ?? 0,
      explanation: component.explanation ?? 'Score provided by the analysis engine.',
      helpedBy: component.helped ?? [],
      draggedBy: component.dragged ?? [],
    })),
  }
}

export const buildScoreExplanation = (analysis: AnalysisResponse): ScoreExplanation => {
  const backendExplanation = mapBackendExplanation(
    analysis.scoreExplanation,
    Math.round(analysis.finalScore ?? analysis.matchScore ?? 0),
  )
  if (backendExplanation) return backendExplanation

  const atsChecks = analysis.atsChecks ?? []
  const formattingChecks = atsChecks.filter(isFormattingCheck)
  const readabilityChecks = atsChecks.filter((check) => !isFormattingCheck(check))

  const ats = buildAtsComponent(readabilityChecks)
  const structure = buildStructureComponent(formattingChecks)
  const skills = buildSkillComponent(analysis)
  const experience = buildExperienceComponent(analysis)

  const components: ScoreComponent[] = [
    {
      id: 'ats_readability',
      title: 'ATS Readability',
      weight: 0.25,
      score: ats.score,
      explanation: 'Measures how easily automated screeners can read your resume.',
      helpedBy: ats.helped,
      draggedBy: ats.dragged,
    },
    {
      id: 'skill_match',
      title: 'Skill Match',
      weight: 0.35,
      score: skills.score,
      explanation: 'Compares your listed skills to the job requirements.',
      helpedBy: skills.helped,
      draggedBy: skills.dragged,
    },
    {
      id: 'experience_relevance',
      title: 'Experience Relevance',
      weight: 0.25,
      score: experience.score,
      explanation: 'Looks for clear, measurable impact in your experience.',
      helpedBy: experience.helped,
      draggedBy: experience.dragged,
    },
    {
      id: 'resume_structure',
      title: 'Resume Structure',
      weight: 0.15,
      score: structure.score,
      explanation: 'Checks layout, length, and section clarity.',
      helpedBy: structure.helped,
      draggedBy: structure.dragged,
    },
  ]

  const targetScore = clamp(Math.round(analysis.finalScore ?? analysis.matchScore ?? 0))
  const scaled = scaleToMatchScore(components, targetScore)

  return {
    totalScore: targetScore,
    components: scaled,
  }
}
