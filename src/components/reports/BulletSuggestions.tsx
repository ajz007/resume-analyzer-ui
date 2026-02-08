import { useState } from 'react'
import type { NormalizedAnalysis } from '../../analysis/normalizeAnalysisResponse'

type BulletSuggestionsProps = {
  suggestions: NormalizedAnalysis['normalized']['bulletSuggestions']
}

const BulletSuggestions = ({ suggestions }: BulletSuggestionsProps) => {
  const [expandedIndex, setExpandedIndex] = useState(0)
  if (!suggestions.length) {
    return <p className="text-gray-600 text-sm">No bullet suggestions provided.</p>
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {suggestions.map((suggestion, idx) => {
          const supportLabel =
            suggestion.claimSupport === 'supported'
              ? 'Supported by your resume'
              : 'Needs your input'
          const supportClasses =
            suggestion.claimSupport === 'supported'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          const isExpanded = expandedIndex === idx
          return (
            <li key={`${suggestion.original}-${idx}`} className="border rounded p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  {suggestion.section && (
                    <p className="text-xs text-gray-500">From: {suggestion.section}</p>
                  )}
                  <p className="font-semibold">{suggestion.original}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${supportClasses}`}>
                    {supportLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedIndex((current) => (current === idx ? -1 : idx))}
                    className="text-xs text-blue-700 underline"
                  >
                    {isExpanded ? 'Hide details' : 'View details'}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700">{suggestion.suggested}</p>
              {isExpanded && (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Why this is better</p>
                    <p className="text-sm text-gray-700">{suggestion.reason}</p>
                  </div>
                  {suggestion.claimSupport === 'placeholder' && suggestion.placeholdersNeeded?.length ? (
                    <p className="text-xs text-amber-700">
                      Needs your input: {suggestion.placeholdersNeeded.join(', ')}
                    </p>
                  ) : null}
                  {suggestion.metricsSource ? (
                    <p className="text-xs text-gray-500">Metric source: {suggestion.metricsSource}</p>
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
