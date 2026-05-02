import type { AnalysisResponse } from '../api/types'

const clampScore = (score: number) => Math.min(100, Math.max(0, Math.round(score)))

const cleanScore = (score: unknown): number | undefined =>
  typeof score === 'number' && Number.isFinite(score) ? clampScore(score) : undefined

export const getJobMatchScore = (result: AnalysisResponse): number | undefined =>
  cleanScore(result.jobMatchScoring?.score) ??
  cleanScore(result.matchScore) ??
  cleanScore(result.finalScore)

export const getAIScreeningScore = (result: AnalysisResponse): number | undefined =>
  cleanScore(result.aiScreening?.score)

export const getATSScore = (result: AnalysisResponse): number | undefined =>
  cleanScore(result.ats?.score)
