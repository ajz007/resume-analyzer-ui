import UsageBadge from '../UsageBadge'

const UsageCard = () => {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <div className="text-sm font-semibold text-gray-900">Usage</div>
      <UsageBadge />
    </div>
  )
}

export default UsageCard
