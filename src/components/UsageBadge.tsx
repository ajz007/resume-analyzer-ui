import { useUsageStore } from '../store/useUsageStore'
import { ui } from '../app/uiTokens'
import { isLoggedIn } from '../auth/identity'
import { resolveUsage } from '../usage/quota'
import type { UsageResponse } from '../api/types'

export const UsageBadgeContent = ({
  usage,
  loggedIn,
}: {
  usage: UsageResponse
  loggedIn: boolean
}) => {
  const resolved = resolveUsage(usage, loggedIn)

  return (
    <div className="inline-flex items-center gap-2 text-sm bg-white border rounded px-3 py-2">
      <span className="font-semibold text-gray-800">
        {typeof resolved.remaining === 'number' ? `${resolved.remaining} left` : `${usage.used}/${resolved.limit}`}
      </span>
      <span className="text-gray-600">
        {typeof resolved.remaining === 'number' ? `of ${resolved.limit} this month` : 'analyses used'}
      </span>
      <span className="text-gray-500 text-xs">Resets: {new Date(usage.resetsAt).toLocaleDateString()}</span>
    </div>
  )
}

const UsageBadge = () => {
  const { usage, loading, error, errorStatus } = useUsageStore()

  if (loading) {
    return <div className={ui.text.smallMuted}>Loading usage...</div>
  }

  if (error) {
    if (errorStatus === 401) {
      return <div className={ui.badge.usageUnavailable}>Sign in to see usage</div>
    }
    if (errorStatus === 420 || errorStatus === 429) {
      return <div className={ui.badge.usageUnavailable}>Usage temporarily unavailable</div>
    }
    return (
      <div className={ui.badge.usageUnavailable}>
        Usage unavailable
      </div>
    )
  }

  if (!usage) {
    return (
      <div className={ui.badge.usageUnavailable}>
        Usage unavailable
      </div>
    )
  }

  return <UsageBadgeContent usage={usage} loggedIn={isLoggedIn()} />
}

export default UsageBadge
