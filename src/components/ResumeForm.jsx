import { useState } from 'react'
import ResultBox from './ResultBox'

const ResumeForm = () => {
  const [resume, setResume] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const mockResponse = {
    summary: "Backend developer with 8+ years of experience...",
    skills: ["Spring Boot", "GCP", "Kubernetes"],
    coverLetter: "Dear Hiring Manager,\nI am excited to apply..."
  }

  // const handleSubmit = async () => {
  //   setLoading(true)

  //   // MOCK MODE
  //   setTimeout(() => {
  //     setResult(mockResponse)
  //     setLoading(false)
  //   }, 1500)

  //   // In future: real call to Go API here
  //   // const response = await fetch('/api/customize', { ... })
  // }

  const handleSubmit = async () => {
  setLoading(true)

  try {
    const response = await fetch('http://localhost:8080/customize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, jobDesc }),
    })

    if (!response.ok) {
      const text = await response.text(); // fallback for plain error
      throw new Error(text);
    }

    const data = await response.json(); // ✅ now safe
    setResult(data);
  } catch (err) {
    console.error("API error", err)
    alert("Something went wrong")
  }

  setLoading(false)
}

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <label className="block mb-2 font-semibold">Paste Resume:</label>
      <textarea
        className="w-full p-2 border rounded mb-4"
        rows={6}
        value={resume}
        onChange={(e) => setResume(e.target.value)}
      />

      <label className="block mb-2 font-semibold">Paste Job Description:</label>
      <textarea
        className="w-full p-2 border rounded mb-4"
        rows={6}
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Customize Resume'}
      </button>

      {result && <ResultBox result={result} />}
    </div>
  )
}

export default ResumeForm
