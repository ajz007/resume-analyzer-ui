import { useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import { ui } from '../../app/uiTokens'
import { ReportCard } from '../results/ReportCard'
import { SectionHeader } from '../results/SectionHeader'
import { SeverityChip } from '../results/SeverityChip'

type AtsChecksSectionProps = {
  result: NormalizedAnalysis
  defaultExpanded?: boolean
  title?: string
}

const AtsChecksSection = ({
  result,
  defaultExpanded = false,
  title = 'ATS Checks',
}: AtsChecksSectionProps) => {
  const [showAtsChecks, setShowAtsChecks] = useState(defaultExpanded)

  const mapSeverityLabel = (severity: string) => {
    const token = severity.toLowerCase()
    if (token === 'critical') return 'FAIL'
    if (token === 'high' || token === 'medium') return 'WARNING'
    return 'PASS'
  }

  const mapBadgeTone = (label: string) => {
    if (label === 'FAIL') return 'critical'
    if (label === 'WARNING') return 'warning'
    return 'ok'
  }

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

  if (!atsIssues.length) return null
  const rows = atsIssues

  return (
    <ReportCard>
      <div className="space-y-2" id="ats">
        <div className="flex items-center justify-between">
          <SectionHeader
            title={title}
            subtitle="Formatting and structure issues that can affect parsing or recruiter scanning."
          />
          <button
            type="button"
            onClick={() => setShowAtsChecks((value) => !value)}
            className={ui.results.link}
            aria-expanded={showAtsChecks}
            aria-controls="ats-checks-panel"
          >
            {showAtsChecks ? 'Hide details' : 'View details'}
          </button>
        </div>
        {showAtsChecks && (
          <div id="ats-checks-panel">
            <ul className="space-y-2 mt-3">
              {rows.map((issue, idx) => {
                const label = mapSeverityLabel(issue.severity)
                return (
                  <li key={`${issue.section}-${idx}`} className={ui.results.card.muted}>
                    <div className="flex justify-between items-center gap-2">
                      <span className={ui.results.text.body}>{issue.section}</span>
                      <SeverityChip label={label} tone={mapBadgeTone(label)} />
                    </div>
                    <p className={ui.results.text.secondary}>{issue.problem}</p>
                    {issue.whyItMatters && (
                      <p className={ui.results.text.meta}>Why this matters: {issue.whyItMatters}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </ReportCard>
  )
}

export default AtsChecksSection
