const TipsCard = () => {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-2">
      <div className="text-sm font-semibold text-gray-900">Tips for better results</div>
      <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
        <li>Paste the full job description</li>
        <li>Include responsibilities + required skills</li>
        <li>Short JDs reduce accuracy</li>
      </ul>
    </div>
  )
}

export default TipsCard
