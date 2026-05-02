import { useMemo, useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import { ui } from '../../app/uiTokens'
import RecommendationsPanel from '../RecommendationsPanel'
import AtsChecksSection from './AtsChecksSection'
import BulletSuggestions from './BulletSuggestions'
import NextStepsPanel from './NextStepsPanel'
import { ReportCard } from '../results/ReportCard'
import { SectionHeader } from '../results/SectionHeader'
import { SeverityChip } from '../results/SeverityChip'
import { getAIScreeningScore, getATSScore, getJobMatchScore } from '../../analysis/reportScores'

export type Props = { result: NormalizedAnalysis }

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className={`${ui.results.chip.base} ${ui.results.chip.info}`}>{children}</span>
)

const GapChip = ({ children, tone }: { children: React.ReactNode; tone: string }) => (
  <span className={`${ui.results.chip.base} ${tone}`}>{children}</span>
)

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
    <div className="space-y-3" id={id}>
      <SectionHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  </ReportCard>
)

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

const impactTone = (value: string) => {
  const token = value.toLowerCase()
  if (token === 'high') return ui.results.chip.impactHigh
  if (token === 'medium') return ui.results.chip.impactMedium
  return ui.results.chip.impactLow
}

const effortTone = (value: string) => {
  const token = value.toLowerCase()
  if (token === 'low') return ui.results.chip.effortLow
  if (token === 'high') return ui.results.chip.effortHigh
  return ui.results.chip.effortMedium
}

const firstSentence = (text?: string) => {
  if (!text) return undefined
  const trimmed = text.trim()
  const match = trimmed.match(/^.*?[.!?](?:\s|$)/)
  return match ? match[0].trim() : trimmed
}

const hasVisibleEvidence = (evidence?: string) =>
  typeof evidence === 'string' && evidence.trim() !== '' && evidence.trim().toLowerCase() !== 'notfound'

const compareIssuePriority = (
  a: { priority?: number; section: string },
  b: { priority?: number; section: string },
) => {
  const aHasPriority = typeof a.priority === 'number'
  const bHasPriority = typeof b.priority === 'number'
  if (aHasPriority && bHasPriority) return (a.priority ?? 0) - (b.priority ?? 0)
  if (aHasPriority) return -1
  if (bHasPriority) return 1
  return a.section.localeCompare(b.section)
}

const comparePriorityWeight = (a: { weight: number; priority: string }, b: { weight: number; priority: string }) => {
  if (a.weight !== b.weight) return b.weight - a.weight
  return a.priority.localeCompare(b.priority)
}

const matchSubtitle = (score: number) => {
  if (score < 50) return "Your resume does not clearly show fit for this role yet."
  if (score < 75)
    return 'Your resume shows partial fit. Fix the strongest gaps before applying.'
  return 'Your resume clearly maps to many of this role\'s requirements.'
}

const atsStatusShort = (score: number) => {
  if (score >= 75) return 'Strong readiness'
  if (score >= 60) return 'Minor issues'
  return 'Needs attention'
}

const AI_SHORTLIST_TOOLTIP =
  'An estimate of how clearly your resume communicates role fit, evidence, impact, and relevance for modern AI-assisted screening workflows. This is not a hiring prediction.'

const TOP_GAPS_TITLE = 'Top Gaps to Improve Match'
const TOP_GAPS_SUBTITLE =
  'These are the highest-impact gaps between your resume and what this job appears to require.'
const OPTIONAL_ACTION_PLAN_TITLE = 'Optional Action Plan'
const OPTIONAL_ACTION_PLAN_SUBTITLE =
  'Additional improvements you can make after addressing the top gaps.'

const scoreCard = (label: string, score: number, primary = false, detail?: string, tooltip?: string) => (
  <div className={primary ? ui.results.card.emphasis : ui.results.card.muted}>
    <p className={ui.results.text.meta} title={tooltip} aria-label={tooltip ? `${label}: ${tooltip}` : label}>
      {label}
    </p>
    <p className={primary ? ui.results.score.primary : 'text-3xl font-semibold text-blue-600'}>
      {score}/100
    </p>
    {detail ? <p className={ui.results.text.secondary}>{detail}</p> : null}
  </div>
)

const JobMatchReport = ({ result }: Props) => {
  const [showFindings, setShowFindings] = useState(false)
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(() => new Set())
  const [showAllPriorities, setShowAllPriorities] = useState(false)
  const [showRequirements, setShowRequirements] = useState(false)
  const [showOptionalActionPlan, setShowOptionalActionPlan] = useState(false)
  const [showAiBreakdown, setShowAiBreakdown] = useState(false)
  const matchScore = getJobMatchScore(result) ?? 0
  const atsScore = getATSScore(result)
  const aiScore = getAIScreeningScore(result)
  const recruiterVerdict = result.aiScreening?.aiRecruiterVerdict
  const profile = result.jobRequirementProfile
  const showJobIntent = profile?.isApplicable === true
  const priorities = useMemo(
    () => [...(profile?.topPriorities ?? [])].sort(comparePriorityWeight),
    [profile?.topPriorities],
  )
  const visiblePriorities = showAllPriorities ? priorities : priorities.slice(0, 3)
  const fixThisFirst = (result.fixThisFirst ?? []).slice(0, 3)
  const aiBreakdown = result.aiScreening?.scoreBreakdown ?? []
  const requirementScores = result.jobMatchScoring?.requirementScores ?? []
  const weakestAiSignals = [...aiBreakdown].sort((a, b) => a.score - b.score).slice(0, 3)
  const weakestHighPriorityRequirements = requirementScores
    .filter((item) => item.weight >= 15)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)

  const prioritizedIssues = useMemo(() => {
    const items = result.issues ?? []
    return [...items].sort(compareIssuePriority)
  }, [result.issues])

  const hasKeyRisks = prioritizedIssues.length > 0
  const hasRewrites = result.normalized.bulletSuggestions.length > 0
  const hasNextSteps =
    (result.actionPlan?.quickWins?.length ?? 0) > 0 ||
    (result.actionPlan?.mediumEffort?.length ?? 0) > 0 ||
    (result.actionPlan?.deepFixes?.length ?? 0) > 0
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className={ui.results.section.title}>Job Match</h2>
              <p className={ui.results.text.secondary}>{matchSubtitle(matchScore)}</p>
            </div>
            <div className="text-right">
              <p className={ui.results.text.meta}>Job Match</p>
              <p className={ui.results.score.primary}>{matchScore}/100</p>
            </div>
          </div>
          {recruiterVerdict ? (
            <div className="grid gap-3 border-t border-slate-200 pt-3 md:grid-cols-4">
              <div className="md:col-span-4">
                <p className={ui.results.text.label}>AI screening readiness note</p>
                <p className={ui.results.text.body}>{recruiterVerdict.oneLineVerdict}</p>
              </div>
              {recruiterVerdict.mainConcern ? (
                <p className={ui.results.text.secondary}>Concern: {recruiterVerdict.mainConcern}</p>
              ) : null}
              {recruiterVerdict.strongestSignal ? (
                <p className={ui.results.text.secondary}>Strongest: {recruiterVerdict.strongestSignal}</p>
              ) : null}
              {recruiterVerdict.weakestSignal ? (
                <p className={ui.results.text.secondary}>Weakest: {recruiterVerdict.weakestSignal}</p>
              ) : null}
            </div>
          ) : (
            typeof atsScore === 'number' ? (
              <p className={ui.results.text.meta}>
                ATS Readiness: {atsScore}/100 &middot; {atsStatusShort(atsScore)}
              </p>
            ) : null
          )}
        </div>
      </ReportCard>

      <div className="grid gap-3 md:grid-cols-3">
        {scoreCard('Job Match', matchScore, true)}
        {typeof aiScore === 'number'
          ? scoreCard(
              'AI Shortlist Readiness',
              aiScore,
              false,
              result.aiScreening?.verdict?.tier,
              AI_SHORTLIST_TOOLTIP,
            )
          : null}
        {typeof atsScore === 'number'
          ? scoreCard('ATS Readiness', atsScore, false, atsStatusShort(atsScore))
          : null}
      </div>

      {showJobIntent ? (
        <Section title="What this job is really asking for" id="job-intent">
          {profile?.recruiterIntentSummary ? (
            <p className={ui.results.text.secondary}>{profile.recruiterIntentSummary}</p>
          ) : null}
          <ul className="space-y-2">
            {visiblePriorities.map((priority) => (
              <li key={priority.id} className={ui.results.card.muted}>
                <Chip>
                  {priority.weight}% &middot; {priority.importance}
                </Chip>
                <p className={ui.results.text.body}>{priority.priority}</p>
                {priority.whyItMatters ? (
                  <p className={ui.results.text.secondary}>{priority.whyItMatters}</p>
                ) : null}
              </li>
            ))}
          </ul>
          {priorities.length > 3 ? (
            <button
              type="button"
              className={ui.results.link}
              onClick={() => setShowAllPriorities((v) => !v)}
              aria-expanded={showAllPriorities}
            >
              {showAllPriorities ? 'Hide role priorities' : 'View all role priorities'}
            </button>
          ) : null}
        </Section>
      ) : null}

      {fixThisFirst.length ? (
        <Section title={TOP_GAPS_TITLE} id="fix-first" subtitle={TOP_GAPS_SUBTITLE}>
          <ul className="space-y-3">
            {fixThisFirst.map((item) => (
              <li key={`${item.priority}-${item.title}`} className={`${ui.results.card.muted} space-y-3`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className={ui.results.text.cardTitle}>{item.title}</p>
                  </div>
                  <div className="flex gap-2">
                    <GapChip tone={impactTone(item.expectedImpact)}>{item.expectedImpact}</GapChip>
                    <GapChip tone={effortTone(item.effort)}>{item.effort}</GapChip>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className={ui.results.text.label}>Why it matters</p>
                    <p className={ui.results.text.secondary}>{item.why}</p>
                  </div>
                  <div className="space-y-1">
                    <p className={ui.results.text.label}>Recommended fix</p>
                    <p className={ui.results.text.secondary}>{item.action}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {hasRewrites ? (
        <Section
          title="Suggested Resume Updates"
          id="rewrites"
          subtitle="Use these as starting points and keep only claims you can support."
        >
          <BulletSuggestions suggestions={result.normalized.bulletSuggestions} />
        </Section>
      ) : null}

      {hasKeyRisks ? (
        <Section
          title="Key Risks to Review"
          id="key-risks"
          subtitle="These issues may reduce recruiter confidence or automated screening quality."
        >
          <ul className="space-y-2">
            {prioritizedIssues.map((issue, idx) => {
              const label = severityLabel(issue.severity ?? 'low')
              const key = `${issue.section}-${idx}`
              const isExpanded = expandedIssues.has(key)
              const previewWhy = firstSentence(issue.whyItMatters)
              return (
                <li key={key} className={ui.results.card.muted}>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={ui.results.text.body}>{issue.section}</span>
                      <SeverityChip label={label} tone={severityTone(label)} />
                    </div>
                    <p className={ui.results.text.secondary}>{issue.problem}</p>
                    {previewWhy ? (
                      <p className={ui.results.text.meta}>Why it matters: {previewWhy}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleIssue(key)}
                      className={ui.results.link}
                    >
                      {isExpanded ? 'Hide details' : 'View details'}
                    </button>
                  </div>
                  {isExpanded ? (
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className={ui.results.text.label}>Problem</p>
                        <p className={ui.results.text.secondary}>{issue.problem}</p>
                      </div>
                      {issue.suggestion ? (
                        <div>
                          <p className={ui.results.text.label}>Suggestion</p>
                          <p className={ui.results.text.secondary}>{issue.suggestion}</p>
                        </div>
                      ) : null}
                      {issue.whyItMatters ? (
                        <div>
                          <p className={ui.results.text.label}>Why it matters</p>
                          <p className={ui.results.text.secondary}>{issue.whyItMatters}</p>
                        </div>
                      ) : null}
                      {hasVisibleEvidence(issue.evidence) ? (
                        <div>
                          <p className={ui.results.text.label}>Evidence</p>
                          <p className={ui.results.text.secondary}>{issue.evidence}</p>
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
        </Section>
      ) : null}

      <AtsChecksSection result={result} defaultExpanded={false} title="ATS Readiness" />

      {typeof aiScore === 'number' || aiBreakdown.length ? (
        <Section
          title="AI Shortlist Readiness"
          id="ai-shortlist"
          subtitle="Signals that affect how clearly your fit comes through."
        >
          <p className={ui.results.text.secondary}>
            {typeof aiScore === 'number' ? `AI Shortlist Readiness: ${aiScore}/100` : 'AI Shortlist Readiness'}
            {result.aiScreening?.verdict?.tier ? ` - ${result.aiScreening.verdict.tier}` : ''}
          </p>
          {weakestAiSignals.length ? (
            <div className="grid gap-2 md:grid-cols-3">
              {weakestAiSignals.map((item) => (
                <div key={`weak-${item.id}`} className={ui.results.card.muted}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={ui.results.text.body}>{item.label}</p>
                    <Chip>{item.score}/100</Chip>
                  </div>
                  {item.improvementFocus ? (
                    <p className={ui.results.text.secondary}>{item.improvementFocus}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          {aiBreakdown.length ? (
            <button
              type="button"
              className={ui.results.link}
              onClick={() => setShowAiBreakdown((value) => !value)}
              aria-expanded={showAiBreakdown}
            >
              {showAiBreakdown ? 'Hide AI shortlist breakdown' : 'View AI shortlist breakdown'}
            </button>
          ) : null}
          {showAiBreakdown && aiBreakdown.length ? (
            <div className="grid gap-2 md:grid-cols-2">
              {aiBreakdown.map((item) => (
                <div key={item.id} className={ui.results.card.muted}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={ui.results.text.body}>{item.label}</p>
                    <Chip>{item.score}/100</Chip>
                  </div>
                  <p className={ui.results.text.meta}>Status: {item.status}</p>
                  {item.improvementFocus ? (
                    <p className={ui.results.text.secondary}>{item.improvementFocus}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      {requirementScores.length ? (
        <Section
          title="Requirement-by-requirement Match"
          id="requirements"
          subtitle="Detailed weighted scoring by role requirement."
        >
          <p className={ui.results.text.label}>Weakest high-priority requirements</p>
          {weakestHighPriorityRequirements.length ? (
            <ul className="space-y-2">
              {weakestHighPriorityRequirements.map((item) => (
                <li key={`weak-${item.requirementId}`} className={ui.results.card.muted}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className={ui.results.text.body}>{item.requirement}</p>
                    <div className="flex gap-2">
                      <Chip>{item.weight}%</Chip>
                      <Chip>{item.score}/100</Chip>
                    </div>
                  </div>
                  {item.gap ? <p className={ui.results.text.secondary}>{item.gap}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={ui.results.text.secondary}>No high-priority weak requirements were flagged.</p>
          )}
          <button
            type="button"
            className={ui.results.link}
            onClick={() => setShowRequirements((v) => !v)}
            aria-expanded={showRequirements}
          >
            {showRequirements ? 'Hide full requirement breakdown' : 'View full requirement breakdown'}
          </button>
          {showRequirements ? (
            <ul className="space-y-2">
              {requirementScores.map((item) => (
                <li key={item.requirementId} className={ui.results.card.muted}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className={ui.results.text.body}>{item.requirement}</p>
                    <div className="flex gap-2">
                      <Chip>{item.weight}%</Chip>
                      <Chip>{item.score}/100</Chip>
                      <Chip>{item.matchStatus}</Chip>
                    </div>
                  </div>
                  {item.evidence ? <p className={ui.results.text.secondary}>Evidence: {item.evidence}</p> : null}
                  {item.gap ? <p className={ui.results.text.secondary}>Gap: {item.gap}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </Section>
      ) : null}

      {hasFindings ? (
        <ReportCard>
          <div id="findings" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className={ui.results.section.title}>Detailed Findings and Recommendations</h2>
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

      {hasNextSteps ? (
        <Section
          title={OPTIONAL_ACTION_PLAN_TITLE}
          id="optional-action-plan"
          subtitle={OPTIONAL_ACTION_PLAN_SUBTITLE}
        >
          <button
            type="button"
            className={ui.results.link}
            onClick={() => setShowOptionalActionPlan((value) => !value)}
            aria-expanded={showOptionalActionPlan}
          >
            {showOptionalActionPlan ? 'Hide optional action plan' : 'View optional action plan'}
          </button>
          {showOptionalActionPlan ? <NextStepsPanel actionPlan={result.actionPlan} /> : null}
        </Section>
      ) : null}
    </div>
  )
}

export default JobMatchReport
