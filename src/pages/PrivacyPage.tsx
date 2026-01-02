import { useNavigate } from 'react-router-dom'

const PrivacyPage = () => {
  const navigate = useNavigate()
  return (
    <div className="bg-white border rounded p-6 space-y-3">
      <h1 className="text-2xl font-bold">Privacy</h1>
      <p className="text-gray-700">
        We process uploaded resumes and job descriptions solely to provide analysis results. Data is
        transmitted over HTTPS and retained only as needed to deliver the service.
      </p>
      <p className="text-gray-700">
        We do not sell personal data. If you have questions about removal or retention, contact
        support and we will assist promptly.
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

export default PrivacyPage
