import type { AnalysisResponse } from '../../api/types'
import { ui } from '../../app/uiTokens'

type NextStepsPanelProps = {
  actionPlan?: AnalysisResponse['actionPlan']
}

const NextStepsPanel = ({ actionPlan }: NextStepsPanelProps) => {
  const quickWins = actionPlan?.quickWins ?? []
  const mediumEffort = actionPlan?.mediumEffort ?? []
  const deepFixes = actionPlan?.deepFixes ?? []

  return (
    <div className="space-y-3">
      {quickWins.length ? (
        <div>
          <p className={ui.results.text.label}>Quick wins</p>
          <ul className={ui.results.list.bulletsSecondary}>
            {quickWins.slice(0, 3).map((step, idx) => (
              <li key={`quick-${idx}`}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {mediumEffort.length ? (
        <div>
          <p className={ui.results.text.label}>Medium-effort improvements</p>
          <ul className={ui.results.list.bulletsSecondary}>
            {mediumEffort.slice(0, 3).map((step, idx) => (
              <li key={`medium-${idx}`}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {deepFixes.length ? (
        <div>
          <p className={ui.results.text.label}>Deeper improvements</p>
          <ul className={ui.results.list.bulletsSecondary}>
            {deepFixes.slice(0, 3).map((step, idx) => (
              <li key={`deep-${idx}`}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export default NextStepsPanel
