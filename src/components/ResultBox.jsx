const ResultBox = ({ result }) => {
  return (
    <div className="mt-6 bg-gray-50 p-4 rounded border">
      <h2 className="text-xl font-bold mb-2">Customized Output</h2>

      <div className="mb-4">
        <strong>Rewritten Summary:</strong>
        <p className="whitespace-pre-line">{result.summary}</p>
      </div>

      <div className="mb-4">
        <strong>Matched Skills:</strong>
        <ul className="list-disc list-inside">
          {result.skills.map((skill, idx) => (
            <li key={idx}>{skill}</li>
          ))}
        </ul>
      </div>

      <div>
        <strong>Cover Letter:</strong>
        <p className="whitespace-pre-line">{result.coverLetter}</p>
      </div>
    </div>
  )
}

export default ResultBox
