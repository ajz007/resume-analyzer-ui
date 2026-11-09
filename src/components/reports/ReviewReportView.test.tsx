import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { fromBackendResult } from '../../analysis/adapters/fromBackend'
import { normalizeAnalysisResponse } from '../../analysis/normalizeAnalysisResponse'
import type { ReviewReport } from '../../api/reviewReport'
import JobMatchReport from './JobMatchReport'
import AtsReport from './AtsReport'
import JobRequirementDiagnosis, { evidenceLabel } from './JobRequirementDiagnosis'
import EvidenceQuestionCard from './EvidenceQuestionCard'

const report: ReviewReport = {
  schemaVersion: '3', scope: 'SELECTED_PASSAGES', priorities: [{ title: 'Clarify implementation', reason: 'Use existing evidence.', editIds: ['e1'] }],
  edits: [{ id: 'e1', operation: 'replace', section: 'TradingCo', before: 'Built APIs.', after: 'Built Java APIs.', insertAfter: '', reason: 'Clarify supported technology.', sourceQuotes: ['Built Java APIs.'], requirementIds: [] }],
  sections: [{ heading: 'TradingCo', editIds: ['e1'], retained: [] }],
  outcomes: { clearerNow: ['Implementation'], needsConfirmation: ['Scale'], stillUnresolved: ['Required tenure not demonstrated.'] },
  questions: [{ id: 'q1', question: 'What did you personally implement?', why: 'Clarify ownership.', editIds: ['e1'] }],
}

describe('versioned report integration', () => {
  it('retains the API summary, scores, report and default changes view', () => {
    const result = normalizeAnalysisResponse(fromBackendResult({ meta: { mode: 'JOB_MATCH' }, summary: { overallAssessment: 'Specific assessment.' }, ats: { score: 80 }, matchScore: 72, report }))
    const html = renderToStaticMarkup(<JobMatchReport result={result} />)
    expect(html).toContain('Specific assessment.')
    expect(html).toContain('Review changes')
    expect(html).toContain('Selected passages')
    expect(html).toContain('72/100')
    expect(html).toContain('What these changes can improve')
    expect(html).toContain('Required tenure not demonstrated.')
    expect(html).toContain('Based on your resume')
    expect(html).not.toContain('Top Gaps to Improve Match')
  })
  it('does not expose paid sections or download controls for a redacted report', () => {
    const { edits: _edits, ...preview } = report
    void _edits
    const result = normalizeAnalysisResponse(fromBackendResult({ report: { schemaVersion: preview.schemaVersion, scope: preview.scope, priorities: preview.priorities }, locked: true }))
    const html = renderToStaticMarkup(<JobMatchReport result={result} />)
    expect(html).toContain('Your full review is locked')
    expect(html).not.toContain('Built Java APIs.')
    expect(html).not.toContain('Download reviewed resume')
  })
  it('renders no-JD reviews without a fabricated job-match score', () => {
    const result = normalizeAnalysisResponse(fromBackendResult({ meta: { mode: 'ATS', jobDescriptionProvided: false }, report, ats: { score: 80 } }))
    const html = renderToStaticMarkup(<AtsReport result={result} />)
    expect(html).toContain('Your resume review')
    expect(html).not.toContain('Job match')
  })
  it('does not force an empty clarification path when no edits or questions are needed', () => {
    const result = normalizeAnalysisResponse(fromBackendResult({ meta: { mode: 'ATS', jobDescriptionProvided: false }, report: { ...report, edits: [], questions: [] } }))
    const html = renderToStaticMarkup(<AtsReport result={result} />)
    expect(html).not.toContain('Review remaining questions')
    expect(html).not.toContain('Review job evidence')
    expect(html).toContain('Preview and download')
  })
  it('keeps the existing renderer for saved legacy reports', () => {
    const result = normalizeAnalysisResponse(fromBackendResult({ meta: { jobDescriptionProvided: true }, matchScore: 73 }))
    const html = renderToStaticMarkup(<JobMatchReport result={result} />)
    expect(html).not.toContain('Full revised report')
    expect(html).toContain('Job Match')
  })
})


describe('job requirement diagnosis', () => {
  const result = normalizeAnalysisResponse(fromBackendResult({
    meta: { mode: 'JOB_MATCH', jobDescriptionProvided: true },
    report: { ...report, edits: [{ ...report.edits![0], requirementIds: ['R1'] }] },
    jobMatchScoring: { score: 50, requirementScores: [
      { requirementId: 'R1', requirement: 'Terraform: four years', matchStatus: 'PARTIAL', weight: 80, score: 40, evidence: 'Terraform integration.', gap: 'Duration unconfirmed.' },
      { requirementId: 'R2', requirement: 'Preferred: AWS certification', matchStatus: 'MISSING', weight: 20, score: 0, evidence: '', gap: 'Not mentioned.' },
    ] },
  }))
  it('distinguishes missing evidence from absent experience, and links only explicitly related edits', () => {
    const html = renderToStaticMarkup(<JobRequirementDiagnosis result={result} locked={false} onReviewEdit={() => {}} onReviewQuestions={() => {}} />)
    expect(html).toContain('Partially supported')
    expect(html).toContain('Not established')
    expect(html).toContain('does not prove you lack the experience')
    expect(html).toContain('Preferred / optional')
    expect(html).toContain('Duration unconfirmed.')
    expect(html.match(/Review suggested change: /g)).toHaveLength(1)
  })
  it('exposes no paid edit or question navigation in a locked report', () => {
    const html = renderToStaticMarkup(<JobRequirementDiagnosis result={result} locked onReviewEdit={() => {}} onReviewQuestions={() => {}} />)
    expect(html).not.toContain('Review suggested change:')
    expect(html).not.toContain('Review focused questions')
  })
  it('keeps shared reports read-only without owner session controls', () => {
    const html = renderToStaticMarkup(<JobMatchReport result={result} readOnly />)
    expect(html).toContain('Preview and download')
    expect(html).not.toContain('Reload saved review')
    expect(html).not.toContain('Add relevant experience')
    expect(html).not.toContain('>Keep original</button>')
  })
  it('opens the requirement breakdown first for job matches and preserves unknown evidence states', () => {
    const html = renderToStaticMarkup(<JobMatchReport result={result} />)
    expect(html).toMatch(/<button[^>]*aria-current="step"[^>]*>.*?Understand your fit<\/span><\/button>/)
    expect(html).toContain('Duration unconfirmed.')
    expect(html).toContain('Rethink Resume scoring weight: 80%')
    expect(html).not.toContain('>Suggested resume changes</h2>')
    expect(evidenceLabel('unexpected')).toBe('Needs review')
    expect(evidenceLabel('WEAK')).toBe('Partially supported')
  })
})

describe('priority evidence card', () => {
  it('displays the actual requirement, coverage, resume evidence, gap and verbatim question', () => {
    const text = 'What geographically distributed system did you personally help design, if any?'
    const requirement = {
      requirementId: 'R1', requirement: 'Design highly available distributed systems', matchStatus: 'PARTIAL',
      weight: 25, score: 60, evidence: 'Kafka trading systems and automated failover.', gap: 'Geographic distribution and design ownership.',
    }
    const html = renderToStaticMarkup(
      <EvidenceQuestionCard
        question={{ key: 'q1', id: 'q1', text, requirementIds: ['R1'], answers: [] }}
        requirements={[requirement]} priorities={[]} skipped={false} excluded={new Set()} answeredQuestionIds={new Set()}
        featured={{ requirement, onExplore: () => {} }} onAnswer={() => {}} onReviewEdit={() => {}} busy={false}
      />,
    )
    expect(html).toContain('Design highly available distributed systems')
    expect(html).toContain('Partially supported')
    expect(html).toContain(requirement.evidence)
    expect(html).toContain(requirement.gap)
    expect(html).toContain(text)
    expect(html).toContain('Clarify my experience')
    expect(html).toContain('Explore this requirement')
  })
})
