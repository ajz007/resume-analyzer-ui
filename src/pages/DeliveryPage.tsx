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
        When a payment succeeds, the full report unlocks immediately in your account. You can view
        it any time from your history while signed in.
      </p>
      <p className="text-gray-700">
        If a report does not unlock within a few minutes of a successful payment, email{' '}
        <a className="text-blue-700 underline" href={`mailto:${LEGAL.supportEmail}`}>
          {LEGAL.supportEmail}
        </a>{' '}
        with your payment ID and we will resolve it.
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

export default DeliveryPage
