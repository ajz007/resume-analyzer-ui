import type { AnalysisResponse } from '../../api/types'
import { ui } from '../../app/uiTokens'

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
        <p className={ui.results.text.label}>10-15 minutes</p>
        {effectiveQuickWins.length ? (
          <ul className={ui.results.list.bulletsSecondary}>
            {effectiveQuickWins.slice(0, 3).map((step, idx) => (
              <li key={`quick-${idx}`}>{step}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {mediumEffort.length ? (
        <div>
          <p className={ui.results.text.label}>30-60 minutes</p>
          <ul className={ui.results.list.bulletsSecondary}>
            {mediumEffort.slice(0, 3).map((step, idx) => (
              <li key={`medium-${idx}`}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {deepFixes.length ? (
        <details className={ui.results.card.muted}>
          <summary className={ui.results.text.label}>Optional deeper improvements</summary>
          <ul className={`${ui.results.list.bulletsSecondary} mt-2`}>
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
