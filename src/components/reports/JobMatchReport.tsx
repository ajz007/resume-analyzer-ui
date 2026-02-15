import { useMemo, useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import { ui } from '../../app/uiTokens'
import RecommendationsPanel from '../RecommendationsPanel'
import AtsChecksSection from './AtsChecksSection'
import BulletSuggestions from './BulletSuggestions'
import NextStepsPanel from './NextStepsPanel'
import { COPY } from '../../constants/uiCopy'
import { ReportCard } from '../results/ReportCard'
import { SectionHeader } from '../results/SectionHeader'
import { SeverityChip } from '../results/SeverityChip'

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
  <ReportCard>
    <div className="space-y-2" id={id}>
      <SectionHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  </ReportCard>
)

const renderSummaryItems = (items?: string[] | string, maxItems = 3) => {
  if (!items) return null
  if (Array.isArray(items)) {
    if (!items.length) return null
    return (
      <ul className={ui.results.list.bulletsSecondary}>
        {items.slice(0, maxItems).map((item, idx) => (
          <li key={`summary-${idx}`}>{item}</li>
        ))}
      </ul>
    )
  }
  return <p className={ui.results.text.secondary}>{items}</p>
}

const severityLabel = (severity: string) => {
  const token = severity.toLowerCase()
  if (token === 'high' || token === 'critical') return 'CRITICAL'
  if (token === 'medium') return 'WARNING'
  return 'INFO'
}

const severityTone = (label: string) => {
  if (label === 'CRITICAL') return 'critical'
  if (label === 'WARNING') return 'warning'
  return 'info'
}

const matchSubtitle = (score: number) => {
  if (score < 50) return "You're not aligned yet — but the gaps are clear and fixable."
  if (score < 75)
    return "You're partially aligned. Addressing a few gaps can improve shortlist chances."
  return "You're strongly aligned for this role."
}

const atsStatusShort = (score: number) => {
  if (score >= 75) return 'ATS-safe'
  if (score >= 60) return 'Minor issues'
  return 'Needs attention'
}

const JobMatchReport = ({ result }: Props) => {
  const [showFindings, setShowFindings] = useState(false)
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(() => new Set())
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
    return [...items].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).slice(0, 3)
  }, [result.issues])

  const showKeywordSection = result.normalized.missingKeywordsFromJD.length >= 5
  const hasTopGaps = prioritizedIssues.length > 0 || showKeywordSection
  const hasRewrites = result.normalized.bulletSuggestions.length > 0
  const hasNextSteps =
    (result.actionPlan?.quickWins?.length ?? 0) > 0 ||
    (result.actionPlan?.mediumEffort?.length ?? 0) > 0 ||
    (result.actionPlan?.deepFixes?.length ?? 0) > 0 ||
    (result.recommendations?.length ?? 0) > 0
  const hasFindings = (result.recommendations?.length ?? 0) > 0

  const toggleIssue = (key: string) => {
    setExpandedIssues((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="mt-6 space-y-4">
      <ReportCard variant="emphasis">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={ui.results.section.title}>Job Match Score</h2>
              <p className={ui.results.text.secondary}>{matchSubtitle(matchScore)}</p>
            </div>
            <div className="text-right">
              <p className={ui.results.text.meta}>{COPY.results.jobMatch.label}</p>
              <p className={ui.results.score.primary}>{matchScore}/100</p>
            </div>
          </div>
          <p className={ui.results.text.meta}>
            ATS Readiness: {atsScore}/100 &middot; {atsStatusShort(atsScore)}
          </p>
        </div>
      </ReportCard>

      {summary ? (
        <Section title="Summary for This Role" id="summary">
          <div className="grid gap-3 md:grid-cols-3">
            {renderSummaryItems(summary.strengths) ? (
              <div>
                <p className={ui.results.text.label}>Strengths</p>
                {renderSummaryItems(summary.strengths)}
              </div>
            ) : null}
            {renderSummaryItems(summary.weaknesses) ? (
              <div>
                <p className={ui.results.text.label}>Gaps</p>
                {renderSummaryItems(summary.weaknesses)}
              </div>
            ) : null}
            {summary.overallAssessment ? (
              <div>
                <p className={ui.results.text.label}>Overall Assessment</p>
                <p className={ui.results.text.secondary}>{summary.overallAssessment}</p>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {hasNextSteps ? (
        <Section title="What to Fix First" id="fix-first" subtitle="High-impact updates you can finish quickly.">
          <NextStepsPanel actionPlan={result.actionPlan} recommendations={result.recommendations} />
        </Section>
      ) : null}

      {hasTopGaps ? (
        <Section
          title="Top Gaps for This Role"
          id="top-gaps"
          subtitle="Highest-impact issues affecting your match score."
        >
          {prioritizedIssues.length ? (
            <ul className="space-y-2">
              {prioritizedIssues.map((issue, idx) => {
                const label = severityLabel(issue.severity ?? 'low')
                const fixEffort = (issue as { fixEffort?: string }).fixEffort
                const key = `${issue.section}-${idx}`
                const isExpanded = expandedIssues.has(key)
                return (
                  <li key={key} className={ui.results.card.muted}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={ui.results.text.body}>{issue.section}</span>
                      <SeverityChip label={label} tone={severityTone(label)} />
                    </div>
                    {fixEffort ? (
                      <p className={ui.results.text.meta}>Fix effort: {fixEffort}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleIssue(key)}
                      className={ui.results.link}
                    >
                      {isExpanded ? 'Hide details' : 'View details'}
                    </button>
                    {isExpanded ? (
                      <div className="space-y-2">
                        <div>
                          <p className={ui.results.text.label}>Why this matters</p>
                          <p className={ui.results.text.secondary}>
                            {issue.whyItMatters ?? issue.problem}
                          </p>
                        </div>
                        {issue.suggestion ? (
                          <div>
                            <p className={ui.results.text.label}>Suggested fix</p>
                            <p className={ui.results.text.secondary}>{issue.suggestion}</p>
                          </div>
                        ) : null}
                        {issue.requiresUserInput?.length ? (
                          <div>
                            <p className={ui.results.text.label}>Requires your input</p>
                            <ul className={ui.results.list.bulletsSecondary}>
                              {issue.requiresUserInput.slice(0, 3).map((item, itemIdx) => (
                                <li key={`${key}-input-${itemIdx}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : null}

          {showKeywordSection ? (
            <div className="mt-3">
              <p className={ui.results.text.label}>Missing keywords to add</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {result.normalized.missingKeywordsFromJD.slice(0, 12).map((keyword) => (
                  <span
                    key={`missing-${keyword}`}
                    className={`${ui.results.chip.base} ${ui.results.chip.info}`}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </Section>
      ) : null}

      {hasRewrites ? (
        <Section
          title="Resume Rewrites (Copy-Paste Ready)"
          id="rewrites"
          subtitle="Use these directly. Replace placeholders before applying."
        >
          <BulletSuggestions suggestions={result.normalized.bulletSuggestions} />
        </Section>
      ) : null}

      <AtsChecksSection result={result} defaultExpanded={false} title="ATS Readiness" />

      {hasFindings ? (
        <ReportCard>
          <div id="findings" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className={ui.results.section.title}>Detailed Findings & Recommendations</h2>
              <button
                type="button"
                onClick={() => setShowFindings((value) => !value)}
                className={ui.results.link}
                aria-expanded={showFindings}
                aria-controls="findings-panel"
              >
                {showFindings ? 'Hide details' : 'View details'}
              </button>
            </div>
            {showFindings && (
              <div id="findings-panel">
                <RecommendationsPanel recommendations={result.recommendations} showHeader={false} />
              </div>
            )}
          </div>
        </ReportCard>
      ) : null}
    </div>
  )
}

export default JobMatchReport
