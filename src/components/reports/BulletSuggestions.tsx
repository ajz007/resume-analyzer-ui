import { useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import { ui } from '../../app/uiTokens'
import { SeverityChip } from '../results/SeverityChip'

type BulletSuggestionsProps = {
  suggestions: NormalizedAnalysis['normalized']['bulletSuggestions']
}

const BulletSuggestions = ({ suggestions }: BulletSuggestionsProps) => {
  const [expandedIndex, setExpandedIndex] = useState(0)
  if (!suggestions.length) {
    return null
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {suggestions.map((suggestion, idx) => {
          const supportLabel =
            suggestion.claimSupport === 'supported' ? 'Supported' : 'Needs your input'
          const isExpanded = expandedIndex === idx
          const needsInput =
            suggestion.claimSupport === 'placeholder' && suggestion.placeholdersNeeded?.length
          return (
            <li key={`${suggestion.original}-${idx}`} className={ui.results.card.base}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  {suggestion.section && (
                    <p className={ui.results.text.meta}>From: {suggestion.section}</p>
                  )}
                  {!isExpanded ? (
                    <div className="space-y-1">
                      <p className={ui.results.text.body}>From: {suggestion.original}</p>
                      <p className={ui.results.text.secondary}>Improves clarity + ATS readability</p>
                    </div>
                  ) : (
                    <p className={ui.results.text.body}>{suggestion.original}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {needsInput ? (
                    <SeverityChip label="Needs your input" tone="warning" />
                  ) : (
                    <SeverityChip label={supportLabel} tone="ok" />
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedIndex((current) => (current === idx ? -1 : idx))}
                    className={ui.results.link}
                  >
                    {isExpanded ? 'Hide details' : 'View details'}
                  </button>
                </div>
              </div>
              {!isExpanded ? null : (
                <div className="space-y-4 mt-3">
                  <div>
                    <p className={ui.results.text.label}>Original</p>
                    <p className={ui.results.text.secondary}>{suggestion.original}</p>
                  </div>
                  <div>
                    <p className={ui.results.text.label}>Suggested</p>
                    <p className={ui.results.text.secondary}>{suggestion.suggested}</p>
                  </div>
                  <div>
                    <p className={ui.results.text.label}>Why this is better</p>
                    <p className={ui.results.text.secondary}>{suggestion.reason}</p>
                  </div>
                  {needsInput ? (
                    <p className={ui.results.text.meta}>
                      Needs your input: {suggestion.placeholdersNeeded?.join(', ')}
                    </p>
                  ) : null}
                  {suggestion.metricsSource ? (
                    <p className={ui.results.text.meta}>Metric source: {suggestion.metricsSource}</p>
                  ) : null}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default BulletSuggestions
