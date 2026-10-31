import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/index.css'
import { fromBackendResult } from '../src/analysis/adapters/fromBackend'
import { normalizeAnalysisResponse } from '../src/analysis/normalizeAnalysisResponse'
import type { ReviewReport } from '../src/api/reviewReport'
import type { ReviewAnswer, ReviewSessionResponse, ReviewSessionTransport } from '../src/api/reviewSession'
import ReviewReportView from '../src/components/reports/ReviewReportView'

const exampleAnswer = 'At Example Platforms, from January 2021 to December 2024, I wrote and maintained Terraform modules for AWS VPCs and EKS clusters used by three teams.'
const initialReport: ReviewReport = {
  schemaVersion: '3', scope: 'SELECTED_PASSAGES',
  priorities: [{ title: 'Clarify Terraform responsibilities and dates', reason: 'Integration work is visible, but infrastructure ownership and duration are unclear.', editIds: ['initial-summary'] }],
  edits: [{ id: 'initial-summary', operation: 'replace', section: 'Example Platforms', before: 'Implemented cloud provisioning APIs using Terraform.', after: 'Built cloud provisioning APIs integrated with Terraform.', insertAfter: '', reason: 'Makes the existing integration experience easier to identify without claiming infrastructure ownership.', sourceQuotes: ['Implemented cloud provisioning APIs using Terraform.'], requirementIds: ['R1'] }],
  sections: [{ heading: 'Example Platforms', editIds: ['initial-summary'], retained: [] }],
  questions: [{ id: 'terraform', question: 'What Terraform infrastructure did you personally build, and when?', why: 'The job asks for four years of Terraform infrastructure work.', editIds: ['initial-summary'], requirementIds: ['R1'] }],
  outcomes: { clearerNow: ['Terraform integration work is easier to find.'], needsConfirmation: ['Infrastructure responsibilities and dates.'], stillUnresolved: ['Four years of Terraform infrastructure work are not established by the original resume.'] },
}
const result = normalizeAnalysisResponse(fromBackendResult({
  meta: { mode: 'JOB_MATCH', promptVersion: 'v3', jobDescriptionProvided: true },
  summary: { overallAssessment: 'Relevant Terraform integration work is visible. Your infrastructure responsibilities and tool-specific duration need clarification.' },
  matchScore: 58, ats: { score: 84 }, report: initialReport,
  jobRequirementProfile: { isApplicable: true, primaryRole: 'DevOps Engineer', topPriorities: [
    { id: 'R1', priority: 'Terraform IaC: 4+ years', importance: 'CRITICAL', weight: 70, resumeMatchStatus: 'PARTIAL', evidenceExpected: 'Personally implemented infrastructure, employer/project and dates of use.', whyItMatters: 'Infrastructure creation is central to this example job.' },
    { id: 'R2', priority: 'Linux administration', importance: 'HIGH', weight: 30, resumeMatchStatus: 'MISSING', evidenceExpected: 'A concrete example of personally administering Linux systems.', whyItMatters: 'The role includes operating systems responsibilities.' },
  ] },
  jobMatchScoring: { score: 58, requirementScores: [
    { requirementId: 'R1', requirement: 'Terraform IaC: 4+ years', weight: 70, score: 60, matchStatus: 'PARTIAL', evidence: 'Terraform-integrated provisioning APIs.', gap: 'Authorship of IaC definitions and dates of Terraform use are unclear.' },
    { requirementId: 'R2', requirement: 'Linux administration', weight: 30, score: 0, matchStatus: 'MISSING', evidence: 'No administration example is stated.', gap: 'Linux administration responsibilities are not established.' },
  ] },
}))
const storageKey = 'resume-review-fictional-walkthrough-v1'
function initial(): ReviewSessionResponse { return { session: { version: 0, excludedIds: [], answers: [], attempts: 0 }, report: structuredClone(initialReport) } }
function load(): ReviewSessionResponse { try { const raw = localStorage.getItem(storageKey); const value = raw ? JSON.parse(raw) : initial(); if (value._demoQueued && Date.now() >= value._demoQueued.readyAt) return save(value._demoQueued.result); return value } catch { return initial() } }
function save(value: ReviewSessionResponse) { localStorage.setItem(storageKey, JSON.stringify(value)); return structuredClone(value) }
let simulatedLostResponse = false
const transport: ReviewSessionTransport = {
  load: async () => load(),
  saveChoices: async (version, excludedIds) => {
    const value = load(); if (value.session.version !== version) throw Error('stale version')
    value.session.version++; value.session.excludedIds = excludedIds; return save(value)
  },
  answer: async request => {
    const value = load(); if (value.session.pending?.requestId === request.requestId) return value
    if (value.session.answers.some(answer => answer.requestId === request.requestId)) return value
    if (request.version !== value.session.version) throw Error('stale version')
    const previous = structuredClone(value)
    const id = crypto.randomUUID()
    const answer: ReviewAnswer = { id, requestId: request.requestId, requirementId: request.requirementId, question: request.questionId || request.requirementId, questionId: request.questionId, text: request.kind === 'experience' ? request.answer : request.kind, kind: request.kind, createdAt: new Date().toISOString(), delta: { action: 'no_change', passage: '', section: '', insertAfter: '', sourceQuote: '', answerQuote: '', explanation: 'No resume change was made. Your earlier edits remain available.', establishes: 'No additional experience confirmed.', stillUnproven: 'This answer does not establish additional evidence for the requirement.', nextQuestion: '' } }
    if (request.kind === 'experience' && request.answer.trim() === exampleAnswer && request.requirementId === 'R1') {
      answer.delta = { action: 'add_evidence', passage: 'Wrote and maintained Terraform modules for AWS VPCs and EKS clusters used by three teams, from January 2021 to December 2024.', section: 'Example Platforms', insertAfter: 'Example Platforms', sourceQuote: 'Example Platforms', answerQuote: exampleAnswer, explanation: 'The example answer supplies infrastructure responsibilities and dates that were absent from the original resume.', establishes: 'Self-reported Terraform module authorship, AWS scope, team usage and dates at Example Platforms.', stillUnproven: 'The original rating is unchanged. Exact tenure against the four-year threshold still needs checking; Linux administration remains unestablished.', nextQuestion: '' }
      answer.edit = { id: `answer-${id}`, operation: 'add', section: 'Example Platforms', before: '', after: answer.delta.passage, insertAfter: answer.delta.insertAfter, reason: answer.delta.explanation, sourceQuotes: ['Example Platforms'], requirementIds: ['R1'], confirmedAnswerId: id }
      value.report.edits!.push(answer.edit)
      value.report.sections![0].editIds.unshift(answer.edit.id)
    } else if (request.kind === 'experience') {
      answer.delta.explanation = 'This scripted walkthrough only demonstrates the supplied fictional answer. Your custom text has not been evaluated by AI and no edit was generated.'
    }
    value.session.version += 2; value.session.attempts++; value.session.excludedIds = request.excludedIds; value.session.answers.push(answer)
    if (request.kind === 'experience' && !new URLSearchParams(location.search).has('lostResponse')) {
      const pending = { ...previous, session: { ...previous.session, version: previous.session.version + 1, attempts: value.session.attempts, excludedIds: request.excludedIds, pending: { requestId: request.requestId, startedAt: new Date().toISOString() } }, _demoQueued: { readyAt: Date.now() + 700, result: value } }
      return save(pending)
    }
    const saved = save(value)
    if (new URLSearchParams(location.search).has('lostResponse') && !simulatedLostResponse) { simulatedLostResponse = true; throw Error('Simulated lost response after commit') }
    return saved
  },
}
function Preview() {
  const [key, setKey] = useState(0)
  return <main className="mx-auto min-h-screen max-w-5xl space-y-5 bg-slate-50 p-4 text-slate-900 sm:p-7">
    <header className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-5">
      <h1 className="text-2xl font-semibold">Guided application review — fictional example</h1>
      <p>This walkthrough uses scripted results, not live AI. It does not change any real candidate report. Your walkthrough choices are saved only in this browser.</p>
      <p>Try keeping the first edit’s original wording. Open the diagnosis, clarify Terraform, and submit the example answer below. Review the new edit, then reload to see your choices preserved. Try “no relevant experience” for Linux to see a no-change result.</p>
      <details><summary className="cursor-pointer font-medium text-blue-700 underline">Example Terraform answer to copy</summary><p className="mt-3 select-text">{exampleAnswer}</p><button className="mt-2 rounded border bg-white px-3 py-2" onClick={() => navigator.clipboard.writeText(exampleAnswer)}>Copy example answer</button></details>
      <div className="flex flex-wrap gap-4"><button className="font-medium text-blue-700 underline" onClick={() => { localStorage.removeItem(storageKey); setKey(key + 1) }}>Reset walkthrough</button><a className="font-medium text-blue-700 underline" href="/dev/report-fixtures.html">Back to sanitized report fixtures</a></div>
    </header>
    <ReviewReportView key={key} result={result} localPreview sessionTransport={transport} />
  </main>
}
createRoot(document.getElementById('root')!).render(<Preview />)
