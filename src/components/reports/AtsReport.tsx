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
    <div className="space-y-2">
      <SectionHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  </ReportCard>
)

const interpretAtsScore = (score: number) => {
  if (score >= 75) return 'Your resume is ATS-friendly and should parse correctly.'
  if (score >= 60) return 'Your resume is mostly ATS-safe with minor fixable issues.'
  return 'Your resume may face ATS parsing issues. Fixes below will help.'
}

const AtsReport = ({ result }: Props) => {
  const [showFindings, setShowFindings] = useState(false)
  const atsScore = result.normalized.atsScore ?? result.finalScore ?? 0
  const hasNextSteps =
    (result.actionPlan?.quickWins?.length ?? 0) > 0 ||
    (result.actionPlan?.mediumEffort?.length ?? 0) > 0 ||
    (result.actionPlan?.deepFixes?.length ?? 0) > 0 ||
    (result.recommendations?.length ?? 0) > 0
  const hasRewrites = result.normalized.bulletSuggestions.length > 0
  const hasFindings = (result.recommendations?.length ?? 0) > 0

  return (
    <div className="mt-6 space-y-4">
      <ReportCard variant="emphasis">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
          <div>
            <h2 className={ui.results.section.title}>ATS Readiness</h2>
            <p className={ui.results.text.secondary}>{interpretAtsScore(atsScore)}</p>
          </div>
          <div className="text-right">
            <p className={ui.results.text.meta}>{COPY.results.ats.label}</p>
            <p className={ui.results.score.primary}>{atsScore}/100</p>
          </div>
        </div>
        </div>
      </ReportCard>

      {hasNextSteps ? (
        <div id="fix-first">
          <Section title="What to Fix First" subtitle="High-impact updates you can finish quickly.">
            <NextStepsPanel actionPlan={result.actionPlan} recommendations={result.recommendations} />
          </Section>
        </div>
      ) : null}

      <AtsChecksSection result={result} defaultExpanded title="ATS Checks" />

      {hasRewrites ? (
        <div id="rewrites">
          <Section
            title="Resume Rewrites (Copy-Paste Ready)"
            subtitle="Use these directly. Replace placeholders before applying."
          >
            <BulletSuggestions suggestions={result.normalized.bulletSuggestions} />
          </Section>
        </div>
      ) : null}

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

export default AtsReport
