import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../app/env'
import {
  createBlankResumeModel,
  createResumeDraft,
  normalizeResumeGenerationResponse,
  pollResumeGeneration,
  startResumeGeneration,
  type GenerateResumeRequest,
} from './resumes'

const request: GenerateResumeRequest = {
  title: 'Platform Engineer Resume',
  targetRole: 'Platform Engineer',
  seniority: 'Senior',
  generationMode: 'from_experience',
  jobDescription: '',
  experienceText: 'Built platform tooling',
  skillsText: 'Go, Kubernetes',
  educationText: '',
  additionalInstructions: '',
}

describe('resume generation api', () => {
  const originalEnv = { ...env }

  beforeEach(() => {
    env.useMockApi = false
    env.apiBaseUrl = 'https://api.example.com'
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response('{}', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )
  })

  afterEach(() => {
    env.useMockApi = originalEnv.useMockApi
    env.apiBaseUrl = originalEnv.apiBaseUrl
    env.uploadMode = originalEnv.uploadMode
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('starts generation from POST /resumes/generate and returns generationId only', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ generationId: 'gen-123', status: 'queued' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )

    const result = await startResumeGeneration(request)

    expect(result).toEqual({ generationId: 'gen-123', status: 'queued' })
    expect(result).not.toHaveProperty('id')
    expect(result).not.toHaveProperty('resume')
    expect(result).not.toHaveProperty('currentVersionId')
  })

  it('creates blank drafts through POST /api/v1/resumes', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            id: 'resume-123',
            title: 'Blank draft',
            status: 'draft',
            currentVersionId: 'version-123',
            resume: createBlankResumeModel(),
            readinessWarnings: [],
            requiresUserInput: [],
            assumptions: [],
            warnings: [],
            createdAt: '2026-06-27T10:00:00.000Z',
            updatedAt: '2026-06-27T10:00:00.000Z',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await createResumeDraft('Blank draft', createBlankResumeModel())

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/resumes'),
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })

  it('normalizes completed generation responses using resumeId and currentVersionId', () => {
    const result = normalizeResumeGenerationResponse({
      generationId: 'gen-123',
      status: 'completed',
      resumeId: 'resume-123',
      currentVersionId: 'version-123',
      resume: {
        summary: { text: 'Platform engineer' },
      },
      readinessWarnings: ['Add metrics.'],
      requiresUserInput: ['Confirm claims.'],
      assumptions: ['Based on notes.'],
      warnings: ['Review content.'],
      createdAt: '2026-06-27T10:00:00.000Z',
      startedAt: '2026-06-27T10:00:02.000Z',
      completedAt: '2026-06-27T10:00:20.000Z',
    })

    expect(result.status).toBe('completed')
    expect(result.resumeId).toBe('resume-123')
    expect(result.currentVersionId).toBe('version-123')
    expect(result.resume.summary.text).toBe('Platform engineer')
  })

  it('polls until completed and stops after the completed response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            generationId: 'gen-123',
            status: 'processing',
            createdAt: '2026-06-27T10:00:00.000Z',
            startedAt: '2026-06-27T10:00:02.000Z',
            completedAt: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            generationId: 'gen-123',
            status: 'completed',
            resumeId: 'resume-123',
            currentVersionId: 'version-123',
            resume: {
              summary: { text: 'Platform engineer' },
            },
            readinessWarnings: [],
            requiresUserInput: [],
            assumptions: [],
            warnings: [],
            createdAt: '2026-06-27T10:00:00.000Z',
            startedAt: '2026-06-27T10:00:02.000Z',
            completedAt: '2026-06-27T10:00:20.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await pollResumeGeneration('gen-123', { intervalMs: 0 })

    expect(result.status).toBe('completed')
    expect(result.resumeId).toBe('resume-123')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('stops polling after a failed response and surfaces the backend error message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            generationId: 'gen-123',
            status: 'queued',
            createdAt: '2026-06-27T10:00:00.000Z',
            startedAt: null,
            completedAt: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            generationId: 'gen-123',
            status: 'failed',
            errorMessage: 'Generation request was invalid.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(pollResumeGeneration('gen-123', { intervalMs: 0 })).rejects.toThrow(
      'Generation request was invalid.',
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
