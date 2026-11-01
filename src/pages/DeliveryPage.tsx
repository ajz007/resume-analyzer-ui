import { useNavigate } from 'react-router-dom'
import { LEGAL } from '../constants/legal'

const DeliveryPage = () => {
  const navigate = useNavigate()
  return (
    <div className="bg-white border rounded p-6 space-y-3">
      <h1 className="text-2xl font-bold">Delivery Policy</h1>
      <p className="text-gray-700">
        {LEGAL.businessName} sells digital services only. Nothing is shipped physically.
      </p>
      <p className="text-gray-700">
        After a successful payment is verified, the full review becomes available for that analysis.
        Find saved reviews in Applications while signed in. If confirmation is interrupted, check
        the review status before making another payment.
      </p>
      <p className="text-gray-700">
        If a report does not unlock within a few minutes of a successful payment, email{' '}
        <a className="text-teal-700 underline" href={`mailto:${LEGAL.supportEmail}`}>
          {LEGAL.supportEmail}
        </a>{' '}
        with your payment ID and we will resolve it.
      </p>
      <button
        onClick={() => navigate('/app/analyzer')}
        className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
      >
        Start analyzing
      </button>
    </div>
  )
}

export default DeliveryPage
