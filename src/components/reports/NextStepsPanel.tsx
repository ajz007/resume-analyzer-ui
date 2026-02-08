import type { AnalysisResponse } from '../../api/types'

type NextStepsPanelProps = {
  actionPlan?: AnalysisResponse['actionPlan']
  recommendations?: AnalysisResponse['recommendations']
}

const NextStepsPanel = ({ actionPlan, recommendations }: NextStepsPanelProps) => {
  const quickWins = actionPlan?.quickWins ?? []
  const mediumEffort = actionPlan?.mediumEffort ?? []
  const deepFixes = actionPlan?.deepFixes ?? []

  const fallbackSteps =
    !quickWins.length && !mediumEffort.length && !deepFixes.length
      ? (recommendations ?? [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((rec) => rec.title)
      : []

  const effectiveQuickWins = quickWins.length ? quickWins : fallbackSteps.slice(0, 3)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">Start here (10-15 minutes)</p>
        {effectiveQuickWins.length ? (
          <ul className="list-disc list-inside text-sm text-gray-700">
            {effectiveQuickWins.slice(0, 3).map((step, idx) => (
              <li key={`quick-${idx}`}>{step}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">
            No immediate blockers detected. Your resume is ATS-safe.
          </p>
        )}
      </div>

      {mediumEffort.length ? (
        <div>
          <p className="text-sm font-semibold text-gray-900">Improve match quality (30-60 minutes)</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {mediumEffort.slice(0, 3).map((step, idx) => (
              <li key={`medium-${idx}`}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {deepFixes.length ? (
        <details className="border rounded p-3">
          <summary className="text-sm font-semibold text-gray-900 cursor-pointer">
            Optional deeper improvements
          </summary>
          <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
            {deepFixes.slice(0, 3).map((step, idx) => (
              <li key={`deep-${idx}`}>{step}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

export default NextStepsPanel
