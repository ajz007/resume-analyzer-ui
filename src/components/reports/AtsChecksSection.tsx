import { useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import { ui } from '../../app/uiTokens'
import { ReportCard } from '../results/ReportCard'
import { SectionHeader } from '../results/SectionHeader'
import { SeverityChip } from '../results/SeverityChip'
import { getATSScore } from '../../analysis/reportScores'

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

  const rows = atsIssues
  const formattingIssues = result.normalized.atsFormattingIssues
  const missingKeywords = result.normalized.missingKeywordsFromJD
  const atsScore = getATSScore(result)
  const hasFindings = rows.length > 0 || formattingIssues.length > 0 || missingKeywords.length > 0
  if (!hasFindings && typeof atsScore !== 'number') return null

  return (
    <ReportCard>
      <div className="space-y-3" id="ats">
        <div className="flex items-center justify-between">
          <SectionHeader
            title={title}
            subtitle="Formatting and structure issues that can affect parsing or recruiter scanning."
          />
          {rows.length ? (
            <button
              type="button"
              onClick={() => setShowAtsChecks((value) => !value)}
              className={ui.results.link}
              aria-expanded={showAtsChecks}
              aria-controls="ats-checks-panel"
            >
              {showAtsChecks ? 'Hide ATS details' : 'View ATS details'}
            </button>
          ) : null}
        </div>
        {typeof atsScore === 'number' ? (
          <p className={ui.results.text.secondary}>ATS Readiness: {atsScore}/100</p>
        ) : null}
        {!hasFindings ? (
          <p className={ui.results.text.secondary}>No ATS-specific issues were flagged.</p>
        ) : null}
        {missingKeywords.length ? (
          <div className="space-y-2">
            <p className={ui.results.text.label}>Job keywords missing from your resume</p>
            <ul className="flex flex-wrap gap-2" aria-label="Missing job keywords">
              {missingKeywords.map((keyword) => (
                <li key={keyword} className={`${ui.results.chip.base} ${ui.results.chip.info}`}>
                  {keyword}
                </li>
              ))}
            </ul>
            <p className={ui.results.text.meta}>Add a keyword only where your experience genuinely supports it.</p>
          </div>
        ) : null}
        {formattingIssues.length ? (
          <div className="space-y-2">
            <p className={ui.results.text.label}>Formatting and structure</p>
            <ul className={ui.results.list.bulletsSecondary}>
              {formattingIssues.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
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
