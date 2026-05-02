import { useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'
import { ui } from '../../app/uiTokens'
import { SeverityChip } from '../results/SeverityChip'

type BulletSuggestion = NormalizedAnalysis['normalized']['bulletSuggestions'][number]

type BulletSuggestionsProps = {
  suggestions: NormalizedAnalysis['normalized']['bulletSuggestions']
}

const formatPlaceholder = (value: string) => value.replace(/[_-]+/g, ' ').trim()

const needsUserInput = (suggestion: BulletSuggestion) =>
  suggestion.claimSupport === 'placeholder' ||
  suggestion.metricsSource === 'placeholder' ||
  (suggestion.placeholdersNeeded?.length ?? 0) > 0

const BulletSuggestions = ({ suggestions }: BulletSuggestionsProps) => {
  const [expandedIndex, setExpandedIndex] = useState(-1)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)

  if (!suggestions.length) {
    return null
  }

  const visibleSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, 3)
  const hasMoreSuggestions = suggestions.length > 3

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {visibleSuggestions.map((suggestion, idx) => {
          const isExpanded = expandedIndex === idx
          const needsInput = needsUserInput(suggestion)
          const isSupported = suggestion.claimSupport === 'supported'

          return (
            <li key={`${suggestion.original}-${idx}`} className={ui.results.card.rewrite}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    {suggestion.section ? (
                      <p className={ui.results.text.metaStrong}>Section: {suggestion.section}</p>
                    ) : null}
                    <p className={ui.results.text.label}>Suggested update</p>
                    <p className={ui.results.text.body}>{suggestion.suggested}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {needsInput || isSupported ? (
                      <SeverityChip
                        label={needsInput ? 'Needs your input before copying' : 'Supported by resume'}
                        tone={needsInput ? 'warning' : 'ok'}
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setExpandedIndex((current) => (current === idx ? -1 : idx))}
                      className={ui.results.link}
                    >
                      {isExpanded ? 'Hide details' : 'View details'}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className={ui.results.text.label}>Current</p>
                    <p className={ui.results.text.secondary}>{suggestion.original}</p>
                  </div>
                  <div className="space-y-1">
                    <p className={ui.results.text.label}>Suggested</p>
                    <p className={ui.results.text.secondary}>{suggestion.suggested}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className={ui.results.text.label}>Why this helps</p>
                  <p className={ui.results.text.secondary}>{suggestion.reason}</p>
                </div>

                {needsInput ? (
                  <div className={`${ui.results.card.muted} space-y-1`}>
                    <p className={ui.results.text.label}>Needs your input</p>
                    <p className={ui.results.text.secondary}>
                      Do not copy this as-is. Replace placeholders with accurate information first.
                    </p>
                    {suggestion.placeholdersNeeded?.length ? (
                      <p className={ui.results.text.metaStrong}>
                        Missing: {suggestion.placeholdersNeeded.map(formatPlaceholder).join(', ')}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {isExpanded && suggestion.metricsSource ? (
                  <div className="space-y-1 border-t border-slate-200 pt-3">
                    <p className={ui.results.text.label}>Metric source</p>
                    <p className={ui.results.text.secondary}>
                      {formatPlaceholder(suggestion.metricsSource)}
                    </p>
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      {hasMoreSuggestions ? (
        <button
          type="button"
          className={ui.results.link}
          onClick={() => setShowAllSuggestions((value) => !value)}
          aria-expanded={showAllSuggestions}
        >
          {showAllSuggestions ? 'Hide extra suggestions' : 'View all suggestions'}
        </button>
      ) : null}
    </div>
  )
}

export default BulletSuggestions
