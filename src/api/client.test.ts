import { describe, expect, it } from 'vitest'
import { joinUrl } from './client'

describe('joinUrl', () => {
  it('does not duplicate /api/v1 when base URL already includes it', () => {
    expect(joinUrl('https://api.rethinkresume.com/api/v1', '/api/v1/resumes')).toBe(
      'https://api.rethinkresume.com/api/v1/resumes',
    )
  })
})
