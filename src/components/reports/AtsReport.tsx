import { useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import RecommendationsPanel from '../RecommendationsPanel'
import AtsChecksSection from './AtsChecksSection'
import BulletSuggestions from './BulletSuggestions'
import NextStepsPanel from './NextStepsPanel'
import { COPY } from '../../constants/uiCopy'

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
  <div className="bg-white rounded border p-4 space-y-2">
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
    {children}
  </div>
)

const interpretAtsScore = (score: number) => {
  if (score >= 75) return 'ATS-safe, no blocking issues.'
  if (score >= 55) return 'Minor ATS issues detected. Fixes will help readability.'
  return 'ATS needs attention. Address formatting and structure issues first.'
}

const AtsReport = ({ result }: Props) => {
  const [showFindings, setShowFindings] = useState(false)
  const atsScore = result.normalized.atsScore ?? result.finalScore ?? 0

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-white rounded border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">ATS Readiness</h2>
            <p className="text-sm text-gray-600">Primary ATS check for structure and parsing.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{COPY.results.ats.label}</p>
            <p className="text-3xl font-bold text-blue-700">{atsScore}/100</p>
          </div>
        </div>
        <p className="text-sm text-gray-700">{interpretAtsScore(atsScore)}</p>
      </div>

      <div id="fix-first">
        <Section title="What to Fix First" subtitle="High-impact updates you can finish quickly.">
          <NextStepsPanel actionPlan={result.actionPlan} recommendations={result.recommendations} />
        </Section>
      </div>

      <AtsChecksSection result={result} defaultExpanded title="ATS Checks" />

      <div id="rewrites">
        <Section
          title="Resume Rewrites (Ready-to-Use)"
          subtitle="Concrete, copy-paste-ready rewrites for specific resume lines to improve clarity, impact, and relevance."
        >
          <BulletSuggestions suggestions={result.normalized.bulletSuggestions} />
        </Section>
      </div>

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

export default AtsReport
