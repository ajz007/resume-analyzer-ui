import { describe, expect, it } from 'vitest'
import { applicationHeading } from './workspace'

describe('Application labels', () => {
  it('identifies the company and exact role rather than a filename or score', () => {
    expect(
      applicationHeading({
        companyName: 'Nimbus',
        targetRole: 'Platform Engineer',
        jobExcerpt: 'Ignored posting',
        mode: 'job_match',
      }),
    ).toBe('Nimbus · Platform Engineer')
  })
  it('does not guess a missing company or role from a posting', () => {
    expect(
      applicationHeading({
        companyName: '',
        targetRole: 'Engineer',
        jobExcerpt: 'A company name we did not confirm',
        mode: 'job_match',
      }),
    ).toBe('Company not specified · Engineer')
  })
  it('keeps legacy and no-JD histories identifiable', () => {
    expect(
      applicationHeading({
        companyName: '',
        targetRole: '',
        jobExcerpt: '\nA saved target job\nRequirements',
        mode: 'job_match',
      }),
    ).toBe('A saved target job')
    expect(
      applicationHeading({
        companyName: '',
        targetRole: '',
        jobExcerpt: '',
        mode: 'resume_only',
      }),
    ).toBe('Resume readability review')
  })
})
