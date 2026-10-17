import { LEGAL } from '../constants/legal'

const ContactPage = () => (
  <div className="bg-white border rounded p-6 space-y-3">
    <h1 className="text-2xl font-bold">Contact</h1>
    <p className="text-gray-700">
      Questions about your account, a payment, or a refund? Email{' '}
      <a className="text-blue-700 underline" href={`mailto:${LEGAL.supportEmail}`}>
        {LEGAL.supportEmail}
      </a>
      . We reply within {LEGAL.responseTime}.
    </p>
    <p className="text-gray-700">
      For payment issues, include the email you signed in with and your payment ID from the receipt.
    </p>
  </div>
)

export default ContactPage
