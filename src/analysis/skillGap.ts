import type { IssueItem, RecommendationItem } from '../api/types'

const TOOL_KEYWORDS = new Set([
  'salesforce',
  'hubspot',
  'zoominfo',
  'apollo',
  'crm',
  'pipedrive',
  'outreach',
  'gong',
  'salesloft',
])

const TOOL_CATEGORY_MAP: Array<{ match: (keyword: string) => boolean; template: (k: string) => string }> =
  [
    {
      match: (keyword) => keyword.includes('salesforce') || keyword.includes('hubspot') || keyword.includes('crm'),
      template: (k) => `${k} (pipeline tracking, forecasting)`,
    },
    {
      match: (keyword) => keyword.includes('zoominfo') || keyword.includes('apollo'),
      template: (k) => `${k} (prospecting, lead sourcing)`,
    },
  ]

const ACTIVITY_TEMPLATES: Array<{ match: (keyword: string) => boolean; template: (k: string) => string }> =
  [
    {
      match: (keyword) => keyword.includes('prospecting'),
      template: () => 'Prospected via outbound channels, generating X qualified leads/week.',
    },
    {
      match: (keyword) => keyword.includes('cold call'),
      template: () => 'Prospected via cold calling + LinkedIn outreach, generating X qualified leads/week.',
    },
    {
      match: (keyword) => keyword.includes('lead generation') || keyword.includes('lead gen'),
      template: () => 'Led lead generation campaigns that produced X inbound opportunities/month.',
    },
    {
      match: (keyword) => keyword.includes('pipeline'),
      template: () => 'Managed pipeline stages and improved conversion from stage to stage by X%.',
    },
    {
      match: (keyword) => keyword.includes('social selling'),
      template: () => 'Built a social selling cadence that drove X new conversations/month.',
    },
  ]

export const isToolKeyword = (keyword: string) => {
  const token = keyword.toLowerCase()
  if (TOOL_KEYWORDS.has(token)) return true
  return Array.from(TOOL_KEYWORDS).some((tool) => token.includes(tool))
}

export const examplePhrasing = (keyword: string) => {
  const token = keyword.toLowerCase()
  const toolMatch = TOOL_CATEGORY_MAP.find((entry) => entry.match(token))
  if (toolMatch) return toolMatch.template(keyword)

  const activityMatch = ACTIVITY_TEMPLATES.find((entry) => entry.match(token))
  if (activityMatch) return activityMatch.template(keyword)

  if (isToolKeyword(keyword)) {
    return `${keyword} (workflow automation, reporting)`
  }

  return `${keyword} experience with measurable outcomes (e.g., improved X by Y%).`
}

export const placementSuggestion = (keyword: string, issues: IssueItem[]) => {
  const token = keyword.toLowerCase()
  const issueMatch = issues.find((issue) => {
    const section = issue.section.toLowerCase()
    if (!section.includes('skills') && !section.includes('tools')) return false
    const text = `${issue.problem} ${issue.suggestion}`.toLowerCase()
    return text.includes('crm') || text.includes('tool')
  })

  if (issueMatch) return 'Skills / Tools'
  if (isToolKeyword(token)) return 'Skills / Tools'
  return 'Skills + 1 Experience bullet'
}

const keywordReferenced = (keyword: string, issues: IssueItem[], recommendations: RecommendationItem[]) => {
  const token = keyword.toLowerCase()
  const issueHit = issues.some((issue) => issue.problem.toLowerCase().includes(token))
  const recHit = recommendations.some((rec) => {
    const title = rec.title.toLowerCase()
    const action = (rec.action ?? '').toLowerCase()
    return title.includes(token) || action.includes(token)
  })
  return issueHit || recHit
}

export const rankKeywords = (
  keywords: string[],
  issues: IssueItem[],
  recommendations: RecommendationItem[],
) => {
  const ranked = keywords
    .map((keyword, index) => ({
      keyword,
      index,
      priority: keywordReferenced(keyword, issues, recommendations) ? 1 : 0,
    }))
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority
      return a.index - b.index
    })
    .map((entry) => entry.keyword)

  const seen = new Set<string>()
  return ranked.filter((keyword) => {
    const token = keyword.toLowerCase()
    if (seen.has(token)) return false
    seen.add(token)
    return true
  })
}

export const findKeywordRecommendation = (recommendations: RecommendationItem[]) =>
  recommendations.find((rec) => {
    const title = rec.title.toLowerCase()
    const idMatch = rec.id === 'ATS_MISSING_JD_KEYWORDS'
    return idMatch || title.includes('add missing job keywords')
  })
