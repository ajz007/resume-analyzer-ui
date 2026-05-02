import { useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import RecommendationsPanel from '../RecommendationsPanel'
import AtsChecksSection from './AtsChecksSection'
import BulletSuggestions from './BulletSuggestions'
import NextStepsPanel from './NextStepsPanel'
import { COPY } from '../../constants/uiCopy'
import { ReportCard } from '../results/ReportCard'
import { SectionHeader } from '../results/SectionHeader'
import { ui } from '../../app/uiTokens'
import { getAIScreeningScore, getATSScore } from '../../analysis/reportScores'

export type Props = { result: NormalizedAnalysis }

const Section = ({
  title,
  children,
  subtitle,
}: {
  title: string
  children: React.ReactNode
  subtitle?: string
}) => (
  <ReportCard>
    <div className="space-y-3">
      <SectionHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  </ReportCard>
)

const interpretAtsScore = (score: number) => {
  if (score >= 75) return 'Your resume shows strong ATS readability signals.'
  if (score >= 60) return 'Your resume has minor ATS readiness issues to review.'
  return 'Your resume may have parsing or structure issues to review.'
}

const AI_SHORTLIST_TOOLTIP =
  'An estimate of how clearly your resume communicates role fit, evidence, impact, and relevance for modern AI-assisted screening workflows. This is not a hiring prediction.'

const TOP_GAPS_TITLE = 'Top Gaps to Improve Match'
const TOP_GAPS_SUBTITLE =
  'These are the highest-impact gaps between your resume and what this job appears to require.'
const OPTIONAL_ACTION_PLAN_TITLE = 'Optional Action Plan'
const OPTIONAL_ACTION_PLAN_SUBTITLE =
  'Additional improvements you can make after addressing the top gaps.'

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className={`${ui.results.chip.base} ${ui.results.chip.info}`}>{children}</span>
)

const AtsReport = ({ result }: Props) => {
  const [showFindings, setShowFindings] = useState(false)
  const [showOptionalActionPlan, setShowOptionalActionPlan] = useState(false)
  const [showAiBreakdown, setShowAiBreakdown] = useState(false)
  const atsScore = getATSScore(result)
  const aiScore = getAIScreeningScore(result)
  const recruiterVerdict = result.aiScreening?.aiRecruiterVerdict
  const fixThisFirst = (result.fixThisFirst ?? []).slice(0, 3)
  const aiBreakdown = result.aiScreening?.scoreBreakdown ?? []
  const weakestAiSignals = [...aiBreakdown].sort((a, b) => a.score - b.score).slice(0, 3)
  const hasNextSteps =
    (result.actionPlan?.quickWins?.length ?? 0) > 0 ||
    (result.actionPlan?.mediumEffort?.length ?? 0) > 0 ||
    (result.actionPlan?.deepFixes?.length ?? 0) > 0
  const hasRewrites = result.normalized.bulletSuggestions.length > 0
  const hasFindings = (result.recommendations?.length ?? 0) > 0

  return (
    <div className="mt-6 space-y-4">
      <ReportCard variant="emphasis">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className={ui.results.section.title}>ATS Readiness</h2>
              <p className={ui.results.text.secondary}>
                {typeof atsScore === 'number'
                  ? interpretAtsScore(atsScore)
                  : 'ATS Readiness is not available for this report.'}
              </p>
            </div>
            {typeof atsScore === 'number' ? (
              <div className="text-right">
                <p className={ui.results.text.meta}>{COPY.results.ats.label}</p>
                <p className={ui.results.score.primary}>{atsScore}/100</p>
              </div>
            ) : null}
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
          ) : null}
        </div>
      </ReportCard>

      <div className="grid gap-3 md:grid-cols-3">
        {typeof atsScore === 'number' ? (
          <div className={ui.results.card.emphasis}>
            <p className={ui.results.text.meta}>ATS Readiness</p>
            <p className={ui.results.score.primary}>{atsScore}/100</p>
          </div>
        ) : null}
        {typeof aiScore === 'number' ? (
          <div className={ui.results.card.muted}>
            <p
              className={ui.results.text.meta}
              title={AI_SHORTLIST_TOOLTIP}
              aria-label={`AI Shortlist Readiness: ${AI_SHORTLIST_TOOLTIP}`}
            >
              AI Shortlist Readiness
            </p>
            <p className="text-3xl font-semibold text-blue-600">{aiScore}/100</p>
            {result.aiScreening?.verdict?.tier ? (
              <p className={ui.results.text.secondary}>{result.aiScreening.verdict.tier}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {fixThisFirst.length ? (
        <div id="fix-first">
          <Section title={TOP_GAPS_TITLE} subtitle={TOP_GAPS_SUBTITLE}>
            <ul className="space-y-3">
              {fixThisFirst.map((item) => (
                <li key={`${item.priority}-${item.title}`} className={ui.results.card.muted}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={ui.results.text.body}>{item.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <Chip>{item.expectedImpact}</Chip>
                      <Chip>{item.effort}</Chip>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className={ui.results.text.label}>Why it matters</p>
                      <p className={ui.results.text.secondary}>{item.why}</p>
                    </div>
                    <div>
                      <p className={ui.results.text.label}>Recommended fix</p>
                      <p className={ui.results.text.secondary}>{item.action}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      ) : null}

      <AtsChecksSection result={result} defaultExpanded={false} title="ATS Readiness" />

      {aiBreakdown.length ? (
        <Section title="AI Shortlist Readiness" subtitle="Signals that affect how clearly your fit comes through.">
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

      {hasRewrites ? (
        <div id="rewrites">
          <Section
            title="Suggested Resume Updates"
            subtitle="Use these as starting points and keep only claims you can support."
          >
            <BulletSuggestions suggestions={result.normalized.bulletSuggestions} />
          </Section>
        </div>
      ) : null}

      {hasNextSteps ? (
        <div id="optional-action-plan">
          <Section title={OPTIONAL_ACTION_PLAN_TITLE} subtitle={OPTIONAL_ACTION_PLAN_SUBTITLE}>
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
        </div>
      ) : null}

      {hasFindings ? (
        <ReportCard>
          <div id="findings" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className={ui.results.section.title}>Detailed findings and recommendations</h2>
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

export default AtsReport
