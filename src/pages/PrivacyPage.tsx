import { useNavigate } from 'react-router-dom'

const PrivacyPage = () => {
  const navigate = useNavigate()
  return (
    <div className="bg-white border rounded p-6 space-y-3">
      <h1 className="text-2xl font-bold">Privacy</h1>
      <p className="text-gray-700">
        We process uploaded resumes, job descriptions and confirmed answers to provide your reviews.
        Signed-in features save uploaded sources, primary-resume preferences, company and role labels,
        and review choices so you can return later. Editable drafts are stored separately.
        Data is transmitted over HTTPS.
      </p>
      <p className="text-gray-700">
        We do not sell personal data. If you have questions about removal or retention, contact
        us through the Contact page. We can help with questions about stored information and removal.
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

export default PrivacyPage
