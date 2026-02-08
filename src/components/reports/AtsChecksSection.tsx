import { useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'

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

  const mapBadgeClasses = (label: string) => {
    if (label === 'FAIL') return 'bg-rose-50 text-rose-700 border-rose-200'
    if (label === 'WARNING') return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-green-50 text-green-700 border-green-200'
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
    <div className="bg-white rounded border p-4 space-y-2" id="ats">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-600">Review ATS checks and formatting risks.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAtsChecks((value) => !value)}
          className="text-sm text-blue-700 underline"
          aria-expanded={showAtsChecks}
          aria-controls="ats-checks-panel"
        >
          {showAtsChecks ? 'Hide ATS checks' : 'Show ATS checks'}
        </button>
      </div>
      {showAtsChecks && (
        <div id="ats-checks-panel">
          <ul className="space-y-2 mt-3">
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
        </div>
      )}
    </div>
  )
}

export default AtsChecksSection
