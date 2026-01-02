import { useNavigate } from 'react-router-dom'

const TermsPage = () => {
  const navigate = useNavigate()
  return (
    <div className="bg-white border rounded p-6 space-y-3">
      <h1 className="text-2xl font-bold">Terms</h1>
      <p className="text-gray-700">
        This service provides resume and job description analysis on a best-effort basis. No hiring
        outcomes or interview guarantees are made.
      </p>
      <p className="text-gray-700">
        You must have the right to upload any resume or job description. Do not upload sensitive or
        confidential data you are not authorized to share.
      </p>
      <p className="text-gray-700">
        Service availability, features, and pricing may change. Continued use constitutes acceptance
        of these terms.
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

export default TermsPage
