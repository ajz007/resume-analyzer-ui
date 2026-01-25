type HistoryItemLike = {
  status?: string
  finalScore?: number | null
  matchScore?: number | null
}

export const getOverallScore = (item: HistoryItemLike): string => {
  if (item.status !== 'completed') return '—'
  return typeof item.finalScore === 'number' ? `${Math.round(item.finalScore)}/100` : '—'
}

export const getMatchScore = (item: HistoryItemLike): string => {
  return typeof item.matchScore === 'number' ? `${Math.round(item.matchScore)}/100` : '—'
}
