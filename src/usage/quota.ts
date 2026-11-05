import type { UsageResponse } from '../api/types'

export const GUEST_ANALYSIS_LIMIT = 1
export const ACCOUNT_ANALYSIS_LIMIT = 3

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
      return `${resolved.remaining} of ${resolved.limit} free previews left this month.`
    }
    return `${ACCOUNT_ANALYSIS_LIMIT} free previews per month, including your guest preview.`
  }

  if (typeof resolved.remaining === 'number') {
    return `${resolved.remaining} of ${resolved.limit} free guest previews left this month.`
  }

  return `One free guest preview this month. Sign in to save your review and reuse your resume.`
}

export const getLimitReachedCopy = (
  usage: UsageResponse | null | undefined,
  authenticated: boolean,
) => {
  const resolved = resolveUsage(usage, authenticated)
  if (resolved.authenticated) {
    return {
      title: `You've used your ${resolved.limit} free previews this month.`,
      description: 'Your preview allowance resets next month. You can still open or unlock a saved review.',
      showSignIn: false,
    }
  }

  return {
    title: `You've used your free guest preview this month.`,
    description:
      `Sign in to save this review and reuse your resume. Your guest preview counts toward your ${ACCOUNT_ANALYSIS_LIMIT} free previews this month.`,
    showSignIn: true,
  }
}
