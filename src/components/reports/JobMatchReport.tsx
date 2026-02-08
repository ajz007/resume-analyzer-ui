import { useMemo, useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import RecommendationsPanel from '../RecommendationsPanel'
import AtsChecksSection from './AtsChecksSection'
import BulletSuggestions from './BulletSuggestions'
import NextStepsPanel from './NextStepsPanel'
import { COPY } from '../../constants/uiCopy'

export type Props = { result: NormalizedAnalysis }

type SummaryPayload = {
  strengths?: string[] | string
  weaknesses?: string[] | string
  overallAssessment?: string
}

const Section = ({
  title,
  children,
  subtitle,
  id,
}: {
  title: string
  children: React.ReactNode
  subtitle?: string
  id?: string
}) => (
  <div className="bg-white rounded border p-4 space-y-2" id={id}>
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
    {children}
  </div>
)

const renderSummaryItems = (items?: string[] | string) => {
  if (!items) return null
  if (Array.isArray(items)) {
    if (!items.length) return null
    return (
      <ul className="list-disc list-inside text-sm text-gray-700">
        {items.map((item, idx) => (
          <li key={`summary-${idx}`}>{item}</li>
        ))}
      </ul>
    )
  }
  return <p className="text-sm text-gray-700">{items}</p>
}

const severityLabel = (severity: string) => {
  const token = severity.toLowerCase()
  if (token === 'critical') return 'CRITICAL'
  if (token === 'high') return 'HIGH'
  if (token === 'medium') return 'MEDIUM'
  return 'LOW'
}

const severityClasses = (label: string) => {
  if (label === 'CRITICAL' || label === 'HIGH') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (label === 'MEDIUM') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-green-50 text-green-700 border-green-200'
}

const JobMatchReport = ({ result }: Props) => {
  const [showFindings, setShowFindings] = useState(false)
  const matchScore = result.matchScore ?? 0
  const atsScore = result.normalized.atsScore ?? result.finalScore ?? 0

  const summary = useMemo<SummaryPayload | null>(() => {
    const raw = result.summary as unknown
    if (!raw || typeof raw !== 'object') return null
    const payload = raw as SummaryPayload
    if (!payload.strengths && !payload.weaknesses && !payload.overallAssessment) return null
    return payload
  }, [result.summary])

  const prioritizedIssues = useMemo(() => {
    const items = result.issues ?? []
    return [...items].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).slice(0, 5)
  }, [result.issues])

  const showKeywordSection = result.normalized.missingKeywordsFromJD.length >= 5

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-white rounded border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Job Match Score</h2>
            <p className="text-sm text-gray-600">Primary match against the job description.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{COPY.results.jobMatch.label}</p>
            <p className="text-3xl font-bold text-blue-700">{matchScore}/100</p>
          </div>
        </div>
        <p className="text-sm text-gray-700">
          ATS Readiness: <span className="font-semibold">{atsScore}/100</span>
        </p>
      </div>

      {summary ? (
        <Section title="Summary" id="summary">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Strengths</p>
              {renderSummaryItems(summary.strengths) ?? (
                <p className="text-sm text-gray-600">No strengths provided.</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Weaknesses</p>
              {renderSummaryItems(summary.weaknesses) ?? (
                <p className="text-sm text-gray-600">No weaknesses provided.</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Overall Assessment</p>
              {summary.overallAssessment ? (
                <p className="text-sm text-gray-700">{summary.overallAssessment}</p>
              ) : (
                <p className="text-sm text-gray-600">No assessment provided.</p>
              )}
            </div>
          </div>
        </Section>
      ) : null}

      <Section title="What to Fix First" id="fix-first" subtitle="High-impact updates you can finish quickly.">
        <NextStepsPanel actionPlan={result.actionPlan} recommendations={result.recommendations} />
      </Section>

      <Section title="Top Gaps" id="top-gaps" subtitle="Highest-impact issues to address for this role.">
        {prioritizedIssues.length ? (
          <ul className="space-y-3">
            {prioritizedIssues.map((issue, idx) => {
              const label = severityLabel(issue.severity ?? 'low')
              const badge = severityClasses(label)
              const fixEffort = (issue as { fixEffort?: string }).fixEffort
              return (
                <li key={`${issue.section}-${idx}`} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{issue.section}</span>
                    <span className={`text-xs uppercase px-2 py-1 rounded-full border ${badge}`}>
                      {label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{issue.problem}</p>
                  {issue.suggestion ? (
                    <p className="text-sm text-gray-700">Fix: {issue.suggestion}</p>
                  ) : null}
                  {fixEffort ? (
                    <p className="text-xs text-gray-600">Effort: {fixEffort}</p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No high-priority gaps detected.</p>
        )}

        {showKeywordSection ? (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-900">Missing keywords to add</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.normalized.missingKeywordsFromJD.slice(0, 12).map((keyword) => (
                <span
                  key={`missing-${keyword}`}
                  className="px-2 py-1 text-xs rounded-full border bg-white text-gray-800"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </Section>

      <Section
        title="Resume Rewrites (Ready-to-Use)"
        id="rewrites"
        subtitle="Concrete, copy-paste-ready rewrites for specific resume lines to improve clarity, impact, and relevance."
      >
        <BulletSuggestions suggestions={result.normalized.bulletSuggestions} />
      </Section>

      <AtsChecksSection result={result} defaultExpanded={false} title="ATS Readiness" />

      <div id="findings" className="bg-white rounded border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Detailed Findings & Recommendations</h2>
          <button
            type="button"
            onClick={() => setShowFindings((value) => !value)}
            className="text-sm text-blue-700 underline"
            aria-expanded={showFindings}
            aria-controls="findings-panel"
          >
            {showFindings ? 'Hide findings' : 'Show findings'}
          </button>
        </div>
        {showFindings && (
          <div id="findings-panel">
            <RecommendationsPanel recommendations={result.recommendations} />
          </div>
        )}
      </div>
    </div>
  )
}

export default JobMatchReport
