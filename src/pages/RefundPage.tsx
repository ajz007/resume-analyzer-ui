import { useNavigate } from 'react-router-dom'
import { LEGAL } from '../constants/legal'

const RefundPage = () => {
  const navigate = useNavigate()
  return (
    <div className="bg-white border rounded p-6 space-y-3">
      <h1 className="text-2xl font-bold">Refund &amp; Cancellation Policy</h1>
      <p className="text-gray-700">
        Paid report unlocks are one-time purchases. There is no subscription, so there is nothing to
        cancel and you will not be charged again.
      </p>
      <p className="text-gray-700">
        If a paid report fails to generate, is incomplete, or you are not satisfied with it, email{' '}
        <a className="text-blue-700 underline" href={`mailto:${LEGAL.supportEmail}`}>
          {LEGAL.supportEmail}
        </a>{' '}
        within {LEGAL.refundWindowDays} days of purchase with the email you signed in with. We will
        issue a full refund.
      </p>
      <p className="text-gray-700">
        Approved refunds go back to the original payment method and usually arrive within{' '}
        {LEGAL.refundProcessingDays}, depending on your bank or card issuer.
      </p>
      <p className="text-gray-700">
        Scores and recommendations are AI-generated guidance and do not guarantee ATS results,
        interviews, or job offers. A different hiring outcome is not, by itself, grounds for a refund
        after the {LEGAL.refundWindowDays}-day window.
      </p>
      <button
        onClick={() => navigate('/app/analyzer')}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Start analyzing
      </button>
    </div>
  )
}

export default RefundPage
