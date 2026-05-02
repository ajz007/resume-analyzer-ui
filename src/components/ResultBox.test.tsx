import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { AnalysisResponse } from '../api/types'
import { normalizeAnalysisResponse } from '../analysis/normalizeAnalysisResponse'
import ResultBox from './ResultBox'
import v2_4JobMatchReportRaw from '../fixtures/v2_4-job-match-report.json?raw'

const buildResult = (overrides: Partial<AnalysisResponse> = {}): AnalysisResponse => ({
  analysisId: 'analysis-1',
  createdAt: new Date().toISOString(),
  finalScore: 80,
  matchScore: 65,
  missingKeywords: [],
  weakKeywords: [],
  atsChecks: [],
  bulletSuggestions: [],
  summary: '',
  nextSteps: [],
  ...overrides,
})

const buildV2_4Result = (overrides: Partial<AnalysisResponse> = {}): AnalysisResponse =>
  buildResult({
    finalScore: 78,
    matchScore: 78,
    jobRequirementProfile: {
      isApplicable: true,
      recruiterIntentSummary: 'Hiring for backend ownership in Go and AWS.',
      topPriorities: [
        {
          id: 'req_backend_go',
          priority: 'Go backend services',
          importance: 'CRITICAL',
          weight: 40,
          evidenceExpected: 'Recent Go service ownership.',
          resumeMatchStatus: 'STRONG',
          whyItMatters: 'The role centers on backend delivery.',
        },
        {
          id: 'req_cloud',
          priority: 'AWS production depth',
          importance: 'HIGH',
          weight: 30,
          evidenceExpected: 'Specific AWS services and production outcomes.',
          resumeMatchStatus: 'PARTIAL',
          whyItMatters: 'The JD emphasizes cloud delivery ownership.',
        },
        {
          id: 'req_collab',
          priority: 'Cross-functional delivery',
          importance: 'MEDIUM',
          weight: 20,
          evidenceExpected: 'Examples of partner or stakeholder delivery.',
          resumeMatchStatus: 'PARTIAL',
          whyItMatters: 'The team needs someone who can work across product and engineering.',
        },
        {
          id: 'req_docs',
          priority: 'Technical documentation',
          importance: 'LOW',
          weight: 10,
          evidenceExpected: 'Documentation or mentoring examples.',
          resumeMatchStatus: 'WEAK',
          whyItMatters: 'Documentation is useful but less central than backend ownership.',
        },
      ],
    },
    jobMatchScoring: {
      score: 78,
      requirementScores: [
        {
          requirementId: 'req_backend_go',
          requirement: 'Go backend services',
          weight: 40,
          score: 90,
          matchStatus: 'STRONG',
          evidence: 'Built Go APIs.',
          gap: '',
        },
      ],
    },
    aiScreening: {
      score: 80,
      verdict: { tier: 'GOOD' },
      scoreBreakdown: [
        {
          id: 'evidence_strength',
          label: 'Evidence Strength',
          score: 65,
          weight: 20,
          status: 'WEAK',
          improvementFocus: 'Add production evidence.',
        },
      ],
      aiRecruiterVerdict: {
        oneLineVerdict: 'Good backend candidate with evidence gaps.',
        mainConcern: 'AWS depth is not specific enough.',
        strongestSignal: 'Recent Go backend ownership.',
        weakestSignal: 'Limited production scale metrics.',
      },
    },
    fixThisFirst: [
      {
        priority: 1,
        title: 'Add AWS service evidence',
        why: 'It closes a high-weight requirement gap.',
        expectedImpact: 'HIGH',
        effort: 'LOW',
        action: 'Name the AWS services used in recent backend work.',
      },
    ],
    bulletSuggestions: [
      {
        original: 'Built backend services.',
        suggested: 'Built Go backend services supporting production API workflows.',
        reason: 'Adds role-specific technology and scope.',
        section: 'Experience',
        claimSupport: 'supported',
      },
    ],
    issues: [
      {
        section: 'Impact / Metrics',
        problem: 'Recent bullets describe responsibilities but do not show measurable outcomes.',
        suggestion: 'Add one measurable result to each recent role where you can support the claim.',
        whyItMatters:
          'Hiring teams need evidence that your work produced business or technical impact. Extra details can stay in the expanded view.',
        evidence: 'notFound',
        requiresUserInput: ['Revenue, latency, adoption, or delivery metrics from recent work'],
        severity: 'high',
        priority: 1,
      },
      {
        section: 'Formatting',
        problem: 'Some section headings may be harder for screening systems to classify.',
        suggestion: 'Use conventional headings such as Experience, Skills, Education, and Projects.',
        whyItMatters: 'Clear headings help reviewers and automated systems locate relevant evidence.',
        evidence: 'Custom heading: Selected Work',
        requiresUserInput: [],
        severity: 'medium',
        priority: 2,
      },
    ],
    actionPlan: {
      quickWins: ['Add AWS services to recent backend bullets'],
      mediumEffort: ['Clarify ownership of cloud delivery'],
      deepFixes: ['Rework experience section around backend platform impact'],
    },
    ...overrides,
  })

const v2_4JobMatchFixture = JSON.parse(v2_4JobMatchReportRaw) as AnalysisResponse

describe('ResultBox wrapper', () => {
  it('renders ATS report when mode is ATS', () => {
    const normalized = normalizeAnalysisResponse(buildResult({ ats: { score: 72 }, matchScore: 0 }))
    const html = renderToStaticMarkup(<ResultBox result={normalized} mode="ATS" />)
    expect(html).toContain('ATS Readiness')
    expect(html).toContain('72/100')
  })

  it('renders Job Match report when mode is JOB_MATCH', () => {
    const normalized = normalizeAnalysisResponse(buildResult())
    const html = renderToStaticMarkup(<ResultBox result={normalized} mode="JOB_MATCH" />)
    expect(html).toContain('Job Match')
    expect(html).not.toContain('ATS Readiness')
  })

  it('renders v2_3 report without optional v2_4 sections', () => {
    const normalized = normalizeAnalysisResponse(buildResult())
    const html = renderToStaticMarkup(<ResultBox result={normalized} mode="JOB_MATCH" />)
    expect(html).toContain('Job Match')
    expect(html).not.toContain('What this job is really asking for')
    expect(html).not.toContain('AI Shortlist Readiness')
  })

  it('renders v2_4 report with job intent and AI shortlist readiness', () => {
    const normalized = normalizeAnalysisResponse(
      buildV2_4Result({
        finalScore: 99,
        matchScore: 62,
        ats: { score: 72 },
        jobMatchScoring: {
          score: 62,
          requirementScores: [
            {
              requirementId: 'req_backend_go',
              requirement: 'Go backend services',
              weight: 40,
              score: 90,
              matchStatus: 'STRONG',
              evidence: 'Built Go APIs.',
              gap: '',
            },
          ],
        },
        aiScreening: {
          score: 67,
          verdict: { tier: 'GOOD' },
          scoreBreakdown: [
            {
              id: 'evidence_strength',
              label: 'Evidence Strength',
              score: 65,
              weight: 20,
              status: 'WEAK',
              improvementFocus: 'Add production evidence.',
            },
          ],
        },
      }),
    )
    const html = renderToStaticMarkup(<ResultBox result={normalized} mode="JOB_MATCH" />)
    expect(html).toContain('What this job is really asking for')
    expect(html).toContain('Hiring for backend ownership')
    expect(html).toContain('40%')
    expect(html).toContain('CRITICAL')
    expect(html).toContain('Go backend services')
    expect(html).toContain('30%')
    expect(html).toContain('AWS production depth')
    expect(html).toContain('20%')
    expect(html).toContain('Cross-functional delivery')
    expect(html).not.toContain('Technical documentation')
    expect(html).toContain('View all role priorities')
    expect(html).toContain('AI Shortlist Readiness')
    expect(html).toContain('Job Match')
    expect(html).toContain('62/100')
    expect(html).toContain('67/100')
    expect(html).toContain('72/100')
    expect(html).not.toContain('99/100')
    expect(html).toContain('Top Gaps to Improve Match')
    expect(html).toContain(
      'These are the highest-impact gaps between your resume and what this job appears to require.',
    )
    expect(html).toContain('Why it matters')
    expect(html).toContain('Recommended fix')
    expect(html).not.toContain('Action:')
    expect(html).toContain('Optional Action Plan')
    expect(html).toContain('Additional improvements you can make after addressing the top gaps.')
    expect(html).toContain('View optional action plan')
    expect(html).not.toContain('Quick wins')
    expect(html).not.toContain('Add AWS services to recent backend bullets')
    expect(html).toContain('Key Risks to Review')
    expect(html).toContain(
      'These issues may reduce recruiter confidence or automated screening quality.',
    )
    expect(html).toContain('Impact / Metrics')
    expect(html).toContain('Recent bullets describe responsibilities but do not show measurable outcomes.')
    expect(html).toContain(
      'Why it matters: Hiring teams need evidence that your work produced business or technical impact.',
    )
    expect(html).not.toContain('Top reasons your resume may be rejected')
    expect(html).not.toContain('Revenue, latency, adoption, or delivery metrics from recent work')
    expect(html).not.toContain('AI Screening Readiness')
    expect(html).toContain('Suggested Resume Updates')
    expect(html).toContain('Requirement-by-requirement Match')

    const jobIntentIndex = html.indexOf('What this job is really asking for')
    const topGapsIndex = html.indexOf('Top Gaps to Improve Match', jobIntentIndex)
    const updatesIndex = html.indexOf('Suggested Resume Updates', topGapsIndex)
    const risksIndex = html.indexOf('Key Risks to Review', updatesIndex)
    const atsIndex = html.indexOf('View ATS details', risksIndex)
    const aiIndex = html.indexOf('View AI shortlist breakdown', atsIndex)
    const requirementsIndex = html.indexOf('Requirement-by-requirement Match', aiIndex)
    const optionalActionPlanIndex = html.indexOf('Optional Action Plan', requirementsIndex)

    const sectionOrder = [
      jobIntentIndex,
      topGapsIndex,
      updatesIndex,
      risksIndex,
      atsIndex,
      aiIndex,
      requirementsIndex,
      optionalActionPlanIndex,
    ]
    expect(sectionOrder.every((index) => index >= 0)).toBe(true)
    expect([...sectionOrder].sort((a, b) => a - b)).toEqual(sectionOrder)
  })

  it('renders the v2_4 fixture with stable score cards and placeholder rewrite warnings', () => {
    const normalized = normalizeAnalysisResponse(v2_4JobMatchFixture)
    const html = renderToStaticMarkup(<ResultBox result={normalized} mode="JOB_MATCH" />)

    expect(html).toContain('Job Match')
    expect(html).toContain('62/100')
    expect(html).toContain('AI Shortlist Readiness')
    expect(html).toContain('67/100')
    expect(html).toContain('BORDERLINE')
    expect(html).toContain('ATS Readiness')
    expect(html).toContain('72/100')
    expect(html).toContain('Top Gaps to Improve Match')
    expect(html).not.toContain('Fix these first')
    expect(html).toContain('Key Risks to Review')
    expect(html).toContain('Suggested Resume Updates')
    expect(html).toContain('Supported by resume')
    expect(html).toContain('Needs your input before copying')
    expect(html).toContain('Do not copy this as-is. Replace placeholders with accurate information first.')
    expect(html).toContain('new qualified prospects per quarter')
    expect(html).toContain('conversion rate')
  })

  it('hides job intent in ATS mode', () => {
    const normalized = normalizeAnalysisResponse(
      buildV2_4Result({
        matchScore: 0,
        jobRequirementProfile: {
          isApplicable: false,
          topPriorities: [],
        },
      }),
    )
    const html = renderToStaticMarkup(<ResultBox result={normalized} mode="ATS" />)
    expect(html).toContain('ATS Readiness')
    expect(html).toContain('AI Shortlist Readiness')
    expect(html).not.toContain('What this job is really asking for')
  })

  it('hides ATS score cards when ats.score is missing', () => {
    const normalized = normalizeAnalysisResponse(buildResult({ finalScore: 80, matchScore: 65 }))
    const html = renderToStaticMarkup(<ResultBox result={normalized} mode="ATS" />)
    expect(html).toContain('ATS Readiness is not available for this report.')
    expect(html).not.toContain('80/100')
    expect(html).not.toContain('65/100')
  })

  it('does not crash when optional v2_4 fields are missing', () => {
    const normalized = normalizeAnalysisResponse(
      buildResult({
        jobRequirementProfile: undefined,
        jobMatchScoring: undefined,
        aiScreening: undefined,
        fixThisFirst: undefined,
      }),
    )
    const html = renderToStaticMarkup(<ResultBox result={normalized} mode="JOB_MATCH" />)
    expect(html).toContain('Job Match')
  })
})
