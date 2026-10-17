import { ui } from '../../app/uiTokens'

export const SCORE_DISCLAIMER =
  'AI-generated guidance based on your resume and the job description provided. Not a guarantee of ATS or interview outcomes.'

const ScoreDisclaimer = () => (
  <p className={ui.results.text.meta} data-testid="score-disclaimer">
    {SCORE_DISCLAIMER}
  </p>
)

export default ScoreDisclaimer
