import type { ReactNode } from 'react'
import type { AnalysisResponse } from '../api/types'
import { buildScoreExplanation } from '../analysis/scoreExplanation'
import ScoreBreakdown from './ScoreBreakdown'
import SkillGapSection from './SkillGapSection'

type ResultBoxProps = {
  result: AnalysisResponse
}

const Section = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <div className="bg-white rounded border p-4 space-y-2">
    <h3 className="text-lg font-semibold">{title}</h3>
    {children}
  </div>
)

const ResultBox = ({ result }: ResultBoxProps) => {
  const scoreExplanation = buildScoreExplanation(result)
  return (
    <div className="mt-6 space-y-4">
      <div className="bg-white rounded border p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Analysis Report</h2>
          <p className="text-sm text-gray-600">Analysis ID: {result.analysisId}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Match Score</p>
          <p className="text-3xl font-bold text-blue-700">{result.matchScore}/100</p>
        </div>
      </div>

      <ScoreBreakdown explanation={scoreExplanation} />

      <SkillGapSection result={result} />

      <Section title="ATS Checks">
        {result.atsChecks.length ? (
          <ul className="space-y-2">
            {result.atsChecks.map((check) => (
              <li key={check.id} className="border rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{check.title}</span>
                  <span className="text-xs uppercase text-gray-600">{check.severity}</span>
                </div>
                <p className="text-sm text-gray-700">{check.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-sm">No ATS issues found.</p>
        )}
      </Section>

      <Section title="Bullet Suggestions">
        {result.bulletSuggestions.length ? (
          <ul className="space-y-3">
            {result.bulletSuggestions.map((suggestion, idx) => (
              <li key={`${suggestion.original}-${idx}`} className="border rounded p-3">
                <p className="text-sm text-gray-600">Original</p>
                <p className="font-semibold">{suggestion.original}</p>
                <p className="text-sm text-gray-600 mt-2">Suggested</p>
                <p>{suggestion.suggested}</p>
                <p className="text-sm text-gray-700 mt-2">Reason: {suggestion.reason}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-sm">No bullet suggestions provided.</p>
        )}
      </Section>

      <Section title="Next Steps">
        {result.nextSteps.length ? (
          <ul className="list-disc list-inside">
            {result.nextSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-sm">No next steps provided.</p>
        )}
      </Section>
    </div>
  )
}

export default ResultBox
