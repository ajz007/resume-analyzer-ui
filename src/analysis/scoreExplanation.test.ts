import { describe, expect, it } from 'vitest'
import type { AnalysisResponse } from '../api/types'
import { buildScoreExplanation } from './scoreExplanation'

describe('buildScoreExplanation', () => {
  it('uses backend labels, weights, and helped/dragged lists when available', () => {
    const analysis = {
      analysisId: 'a1',
      createdAt: new Date().toISOString(),
      finalScore: 74,
      matchScore: 60,
      missingKeywords: [],
      weakKeywords: [],
      atsChecks: [],
      bulletSuggestions: [],
      summary: '',
      nextSteps: [],
      scoreExplanation: {
        totalScore: 74,
        components: [
          {
            key: 'ats_readability',
            label: 'ATS Readability & Parsability',
            explanation: 'Checks how well ATS can read your resume.',
            score: 78,
            weight: 20,
            helped: ['Clear headings'],
            dragged: ['Long lines in experience section'],
          },
          {
            key: 'skill_match',
            label: 'Skill & Keyword Match',
            explanation: 'Compares skills to the job description.',
            score: 65,
            weight: 35,
            helped: ['Matched core tools'],
            dragged: ['Missing cloud terms'],
          },
          {
            key: 'experience_relevance',
            label: 'Experience Relevance',
            explanation: 'Assesses relevance of past roles.',
            score: 72,
            weight: 25,
            helped: ['Recent projects align'],
            dragged: [],
          },
          {
            key: 'resume_structure',
            label: 'Resume Structure',
            explanation: 'Evaluates layout and organization.',
            score: 80,
            weight: 20,
            helped: [],
            dragged: ['Section order is inconsistent'],
          },
        ],
      },
    } satisfies AnalysisResponse

    const result = buildScoreExplanation(analysis)

    expect(result.components[0].title).toBe('ATS Readability & Parsability')
    expect(result.components[0].weight).toBe(20)
    expect(result.components[0].helpedBy).toEqual(['Clear headings'])
    expect(result.components[0].draggedBy).toEqual(['Long lines in experience section'])
  })
})
