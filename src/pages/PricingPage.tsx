import { useNavigate } from 'react-router-dom'
import { ui } from '../app/uiTokens'

const PricingPage = () => {
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className={ui.text.h1}>Pricing</h1>
        <p className={ui.text.subtitle}>Simple pricing to keep costs predictable.</p>
        <p className={ui.text.subtitle}>
          No resume editing. Just a clear, actionable analysis report.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className={ui.card.paddedLg}>
          <div>
            <div className="text-lg font-semibold text-gray-900">Starter</div>
            <div className="text-3xl font-bold text-gray-900">$9</div>
            <div className="text-sm text-gray-600">per month</div>
            <div className="text-sm text-gray-700 mt-1">10 analyses / month</div>
          </div>
          <ul className={`list-disc list-inside ${ui.text.body} space-y-1`}>
            <li>Resume vs JD match score</li>
            <li>Missing keywords & skill gaps</li>
            <li>ATS checks & actionable suggestions</li>
            <li>History of your analyses</li>
          </ul>
          <button
            onClick={() => navigate('/app/analyzer')}
            className={`w-full ${ui.button.primary}`}
          >
            Start analyzing
          </button>
          <div className="text-xs text-gray-600 text-center">Payment setup coming soon.</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className={`${ui.card.elevated} p-4 space-y-1`}>
          <div className="text-sm font-semibold text-gray-900">What counts as an analysis?</div>
          <p className={ui.text.body}>
            Each run where you upload a resume and paste a job description counts as one analysis.
          </p>
        </div>
        <div className={`${ui.card.elevated} p-4 space-y-1`}>
          <div className="text-sm font-semibold text-gray-900">Do you store my resume?</div>
          <p className={ui.text.body}>
            Currently stored locally in your browser in demo mode; backend storage will be opt-in.
          </p>
        </div>
        <div className={`${ui.card.elevated} p-4 space-y-1`}>
          <div className="text-sm font-semibold text-gray-900">Can I cancel anytime?</div>
          <p className={ui.text.body}>Yes. Plans can be cancelled at any time.</p>
        </div>
      </div>
    </div>
  )
}

export default PricingPage
