const ChecksCard = () => {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-2">
      <div className="text-sm font-semibold text-gray-900">What we check</div>
      <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
        <li>ATS Readiness</li>
        <li>Requirement-by-requirement match</li>
        <li>Proof gaps and fix priorities</li>
      </ul>
    </div>
  )
}

export default ChecksCard
