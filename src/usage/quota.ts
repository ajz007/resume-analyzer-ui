import type { UsageResponse } from '../api/types'

export const GUEST_ANALYSIS_LIMIT = 3
export const ACCOUNT_ANALYSIS_LIMIT = 15

export type ResolvedUsage = {
  authenticated: boolean
  limit: number
  used?: number
  remaining?: number
}

export const resolveUsage = (
  usage: UsageResponse | null | undefined,
  authenticated: boolean,
): ResolvedUsage => {
  const resolvedAuthenticated =
    typeof usage?.authenticated === 'boolean' ? usage.authenticated : authenticated
  const fallbackLimit = resolvedAuthenticated ? ACCOUNT_ANALYSIS_LIMIT : GUEST_ANALYSIS_LIMIT
  const limit = typeof usage?.limit === 'number' ? usage.limit : fallbackLimit
  const used = typeof usage?.used === 'number' ? usage.used : undefined
  const remaining =
    typeof usage?.remaining === 'number'
      ? usage.remaining
      : typeof used === 'number'
      ? Math.max(limit - used, 0)
      : undefined

  return {
    authenticated: resolvedAuthenticated,
    limit,
    used,
    remaining,
  }
}

export const getAnalyzerQuotaMessage = (
  usage: UsageResponse | null | undefined,
  authenticated: boolean,
) => {
  const resolved = resolveUsage(usage, authenticated)
  if (resolved.authenticated) {
    if (typeof resolved.remaining === 'number') {
      return `${resolved.remaining} of ${resolved.limit} analyses remaining this month.`
    }
    return `${ACCOUNT_ANALYSIS_LIMIT} free analyses/month included with your account.`
  }

  if (typeof resolved.remaining === 'number') {
    return `${resolved.remaining} of ${resolved.limit} guest analyses remaining. Sign in for ${ACCOUNT_ANALYSIS_LIMIT}/month.`
  }

  return `${GUEST_ANALYSIS_LIMIT} free guest analyses this month. Sign in to get ${ACCOUNT_ANALYSIS_LIMIT}/month and save your history.`
}

export const getLimitReachedCopy = (
  usage: UsageResponse | null | undefined,
  authenticated: boolean,
) => {
  const resolved = resolveUsage(usage, authenticated)
  if (resolved.authenticated) {
    return {
      title: `You've used your ${resolved.limit} free analyses this month.`,
      description: 'Your free account quota will reset next month.',
      showSignIn: false,
    }
  }

  return {
    title: `You've used your ${resolved.limit} free guest analyses this month.`,
    description:
      `Sign in with Google to continue with ${ACCOUNT_ANALYSIS_LIMIT} free analyses/month, save your history, and create tailored resumes.`,
    showSignIn: true,
  }
}
