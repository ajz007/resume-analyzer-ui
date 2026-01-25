import type { ScoreExplanation } from '../analysis/scoreExplanation'

type ScoreBreakdownProps = {
  explanation: ScoreExplanation
}

const ScoreBreakdown = ({ explanation }: ScoreBreakdownProps) => {
  return (
    <div className="bg-white rounded border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Score Breakdown</h3>
        <div className="text-right">
          <p className="text-xs text-gray-500">Final Score</p>
          <p className="text-2xl font-bold text-blue-700">{explanation.totalScore}/100</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {explanation.components.map((component) => (
          <div key={component.id} className="border rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{component.title}</p>
                <p className="text-xs text-gray-500">
                  Contribution:{' '}
                  {component.weight <= 1 ? Math.round(component.weight * 100) : Math.round(component.weight)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Score</p>
                <p className="text-lg font-semibold text-gray-900">{component.score}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">{component.explanation}</p>
            <div className="text-sm">
              <p className="text-green-700 font-semibold">What&apos;s working</p>
              {component.helpedBy.length ? (
                <ul className="list-disc list-inside text-green-700">
                  {component.helpedBy.map((item, idx) => (
                    <li key={`${component.id}-help-${idx}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-700">No notable strengths detected.</p>
              )}
            </div>
            <div className="text-sm">
              <p className="text-amber-700 font-semibold">What to improve next</p>
              {component.draggedBy.length ? (
                <ul className="list-disc list-inside text-amber-700">
                  {component.draggedBy.map((item, idx) => (
                    <li key={`${component.id}-drag-${idx}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-amber-700">No major issues detected.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScoreBreakdown
