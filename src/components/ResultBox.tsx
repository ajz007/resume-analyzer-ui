import type { ReactNode } from 'react'
import { useState } from 'react'
import type { AnalysisResponse } from '../api/types'
import { buildScoreExplanation } from '../analysis/scoreExplanation'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { COPY } from '../constants/uiCopy'
import ScoreBreakdown from './ScoreBreakdown'
import SkillGapSection from './SkillGapSection'

type ResultBoxProps = {
  result: AnalysisResponse
}

const BulletSuggestions = ({ suggestions }: { suggestions: AnalysisResponse['bulletSuggestions'] }) => {
  const [expanded, setExpanded] = useState(false)
  if (!suggestions.length) {
    return <p className="text-gray-600 text-sm">No bullet suggestions provided.</p>
  }

  const visible = expanded ? suggestions : suggestions.slice(0, 4)
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {visible.map((suggestion, idx) => {
          const supportLabel =
            suggestion.claimSupport === 'supported' ? 'Supported by your resume' : 'Needs your input'
          const supportClasses =
            suggestion.claimSupport === 'supported'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          return (
            <li key={`${suggestion.original}-${idx}`} className="border rounded p-3 space-y-2">
              {suggestion.section && (
                <p className="text-xs text-gray-500">From: {suggestion.section}</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs uppercase text-gray-500">Original</p>
                <span className={`text-xs px-2 py-1 rounded-full border ${supportClasses}`}>
                  {supportLabel}
                </span>
              </div>
              <p className="font-semibold">{suggestion.original}</p>
              <p className="text-xs uppercase text-gray-500">Suggested rewrite</p>
              <p>{suggestion.suggested}</p>
              <p className="text-xs uppercase text-gray-500">Why this is better</p>
              <p className="text-sm text-gray-700">{suggestion.reason}</p>
              {suggestion.claimSupport === 'placeholder' && suggestion.placeholdersNeeded?.length ? (
                <p className="text-xs text-amber-700">
                  Needs your input: {suggestion.placeholdersNeeded.join(', ')}
                </p>
              ) : null}
              {suggestion.metricsSource ? (
                <p className="text-xs text-gray-500">Metric source: {suggestion.metricsSource}</p>
              ) : null}
            </li>
          )
        })}
      </ul>
      {suggestions.length > 4 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-sm text-blue-700 underline"
        >
          {expanded ? 'Show fewer bullet suggestions' : 'Show all bullet suggestions'}
        </button>
      )}
    </div>
  )
}

const NextStepsPanel = ({
  actionPlan,
  recommendations,
}: {
  actionPlan?: AnalysisResponse['actionPlan']
  recommendations?: AnalysisResponse['recommendations']
}) => {
  const quickWins = actionPlan?.quickWins ?? []
  const mediumEffort = actionPlan?.mediumEffort ?? []
  const deepFixes = actionPlan?.deepFixes ?? []

  const fallbackSteps =
    !quickWins.length && !mediumEffort.length && !deepFixes.length
      ? (recommendations ?? [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((rec) => rec.title)
      : []

  const effectiveQuickWins = quickWins.length ? quickWins : fallbackSteps.slice(0, 3)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">Start here (10–15 minutes)</p>
        {effectiveQuickWins.length ? (
          <ul className="list-disc list-inside text-sm text-gray-700">
            {effectiveQuickWins.slice(0, 3).map((step, idx) => (
              <li key={`quick-${idx}`}>{step}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">
            No immediate blockers detected. Your resume is ATS-safe.
          </p>
        )}
      </div>

      {mediumEffort.length ? (
        <div>
          <p className="text-sm font-semibold text-gray-900">Improve match quality (30–60 minutes)</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {mediumEffort.slice(0, 3).map((step, idx) => (
              <li key={`medium-${idx}`}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {deepFixes.length ? (
        <details className="border rounded p-3">
          <summary className="text-sm font-semibold text-gray-900 cursor-pointer">
            Optional deeper improvements
          </summary>
          <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
            {deepFixes.slice(0, 3).map((step, idx) => (
              <li key={`deep-${idx}`}>{step}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

const Section = ({
  title,
  children,
  subtitle,
  helper,
}: {
  title: string
  children: ReactNode
  subtitle?: string
  helper?: string
}) => (
  <div className="bg-white rounded border p-4 space-y-2">
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      {helper && <p className="text-sm text-gray-600">{helper}</p>}
    </div>
    {children}
  </div>
)

const ResultBox = ({ result }: ResultBoxProps) => {
  const { analysisMode } = useAnalysisStore()
  const isAtsMode = analysisMode === 'ATS'
  const modeLabel = isAtsMode ? COPY.results.ats.label : COPY.results.jobMatch.label
  const modeExplanation = isAtsMode ? COPY.results.ats.explanation : COPY.results.jobMatch.explanation
  const maybeAtsScore =
    typeof (result as { atsScore?: number }).atsScore === 'number'
      ? (result as { atsScore?: number }).atsScore
      : typeof (result as { ats?: { score?: number } }).ats?.score === 'number'
      ? (result as { ats?: { score?: number } }).ats?.score
      : undefined
  const displayScore = isAtsMode
    ? maybeAtsScore ?? result.finalScore ?? result.matchScore
    : result.matchScore ?? result.finalScore ?? 0
  const hasAtsDetails =
    (result.atsChecks?.length ?? 0) > 0 ||
    (result.issues?.length ?? 0) > 0 ||
    (result.bulletSuggestions?.length ?? 0) > 0
  const showAtsEmptyNote = isAtsMode && !hasAtsDetails
  const showMissingJobNote =
    !isAtsMode &&
    result.matchScore === 0 &&
    (result.missingKeywords?.length ?? 0) === 0 &&
    (result.matchedKeywords?.length ?? 0) === 0
  const scoreExplanation = buildScoreExplanation(result)
  return (
    <div className="mt-6 space-y-4">
      <div className="bg-white rounded border p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Analysis Report</h2>
          <p className="text-sm text-gray-600">Analysis ID: {result.analysisId}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{modeLabel}</p>
          <p className="text-3xl font-bold text-blue-700">{displayScore}/100</p>
          <p className="text-xs text-gray-500 mt-1">{modeExplanation}</p>
          {showAtsEmptyNote ? (
            <p className="text-xs text-gray-500 mt-1">{COPY.results.ats.emptyNote}</p>
          ) : null}
          {showMissingJobNote ? (
            <p className="text-xs text-gray-500 mt-1">{COPY.results.jobMatch.missingNote}</p>
          ) : null}
        </div>
      </div>

      <div id="score-breakdown">
        <ScoreBreakdown explanation={scoreExplanation} />
      </div>

      <div id="skill-gaps">
        <SkillGapSection result={result} />
      </div>

      <div id="ats-checks">
        <Section title="ATS Checks">
        {(() => {
          const issues = result.issues ?? []
          const atsIssues = issues.filter((issue) => {
            const token = issue.section.toLowerCase()
            return (
              token.includes('ats') ||
              token.includes('format') ||
              token.includes('contact') ||
              token.includes('skills') ||
              token.includes('tools') ||
              token.includes('layout')
            )
          })

          const mapSeverityLabel = (severity: string) => {
            const token = severity.toLowerCase()
            if (token === 'critical') return 'FAIL'
            if (token === 'high' || token === 'medium') return 'WARNING'
            return 'PASS'
          }

          const mapBadgeClasses = (label: string) => {
            if (label === 'FAIL') return 'bg-rose-50 text-rose-700 border-rose-200'
            if (label === 'WARNING') return 'bg-amber-50 text-amber-700 border-amber-200'
            return 'bg-green-50 text-green-700 border-green-200'
          }

          const rows = atsIssues.length
            ? atsIssues
            : [
                {
                  section: 'ATS Parsing',
                  problem: 'No ATS blockers detected. Your resume should parse correctly.',
                  whyItMatters: '',
                  severity: 'low',
                },
              ]

          return (
            <ul className="space-y-2">
              {rows.map((issue, idx) => {
                const label = mapSeverityLabel(issue.severity)
                return (
                  <li key={`${issue.section}-${idx}`} className="border rounded p-2">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-semibold">{issue.section}</span>
                      <span
                        className={`text-xs uppercase px-2 py-1 rounded-full border ${mapBadgeClasses(
                          label,
                        )}`}
                      >
                        {label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{issue.problem}</p>
                    {issue.whyItMatters && (
                      <p className="text-xs text-gray-600 mt-1">Why this matters: {issue.whyItMatters}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          )
        })()}
        </Section>
      </div>

      <div id="rewrites">
        <Section
          title="Resume Rewrites (Ready-to-Use)"
          subtitle="Concrete, copy-paste-ready rewrites for specific resume lines to improve clarity, impact, and relevance."
        >
        <BulletSuggestions suggestions={result.bulletSuggestions} />
        </Section>
      </div>

      <div id="next-steps">
        <Section
          title="Next Steps (Start Here)"
          subtitle="If you’re short on time, follow these steps first."
        >
        <NextStepsPanel actionPlan={result.actionPlan} recommendations={result.recommendations} />
        </Section>
      </div>
    </div>
  )
}

export default ResultBox
