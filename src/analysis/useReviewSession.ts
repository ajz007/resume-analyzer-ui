import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReviewReport } from '../api/reviewReport'
import type { ReviewAnswerRequest, ReviewSessionResponse, ReviewSessionTransport } from '../api/reviewSession'

export function useReviewSession(report: ReviewReport, transport: ReviewSessionTransport | null) {
  const [response, setResponse] = useState<ReviewSessionResponse>({ session: { version: 0, excludedIds: [], answers: [], attempts: 0 }, report })
  const applyResponse = useCallback((value: ReviewSessionResponse) => setResponse(previous => value.session.version >= previous.session.version ? value : previous), [])
  const [loading, setLoading] = useState(!!transport)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(!transport)
  const operation = useRef(false)
  const answerAttempt = useRef<{ fingerprint: string; requestId: string } | null>(null)
  const reload = useCallback(async () => {
    if (!transport) return
    setLoading(true)
    try { applyResponse(await transport.load()); setReady(true); setError('') }
    catch { setError('Your saved review could not be loaded. Reload it before submitting an answer or saving choices.'); setReady(false) }
    finally { setLoading(false) }
  }, [transport, applyResponse])
  useEffect(() => {
    let active = true
    if (transport) {
      transport.load().then(value => { if (active) { applyResponse(value); setReady(true) } }).catch(() => { if (active) { setError('Your saved review could not be loaded. Reload it before submitting an answer or saving choices.'); setReady(false) } }).finally(() => { if (active) setLoading(false) })
    }
    return () => { active = false }
  }, [transport, applyResponse])
  const pendingId = response.session.pending?.requestId
  useEffect(() => {
    if (!transport || !pendingId) return
    let active = true
    let timer: ReturnType<typeof setTimeout>
    const poll = () => { timer = setTimeout(async () => {
      try { const value = await transport.load(); if (active) { applyResponse(value); setError(''); if (value.session.pending) poll() } }
      catch { if (active) { setError('The answer is still processing or the connection was interrupted. Your earlier edits remain available.'); poll() } }
    }, 2000) }
    poll()
    return () => { active = false; clearTimeout(timer) }
  }, [transport, pendingId, applyResponse])
  async function run(action: () => Promise<ReviewSessionResponse>, requestId?: string) {
    if (operation.current || loading || !ready || response.session.pending) return false
    operation.current = true; setWorking(true); setError('')
    try { applyResponse(await action()); return true }
    catch {
      setError('The review could not be updated. Your answer is still in the form. Reload the review before trying again.')
      if (transport) { try {
        const recovered = await transport.load(); applyResponse(recovered)
        if (requestId && (recovered.session.pending?.requestId === requestId || recovered.session.answers.some(item => item.requestId === requestId))) { setError(''); return true }
      } catch { setReady(false) } }
      return false
    } finally { operation.current = false; setWorking(false) }
  }
  function choose(id: string) {
    const excluded = new Set(response.session.excludedIds)
    if (excluded.has(id)) excluded.delete(id); else excluded.add(id)
    if (!transport) { setResponse(previous => ({ ...previous, session: { ...previous.session, excludedIds: [...excluded] } })); return }
    void run(() => transport.saveChoices(response.session.version, [...excluded]))
  }
  async function answer(input: Omit<ReviewAnswerRequest, 'version' | 'requestId' | 'excludedIds'>) {
    if (!transport) return false
    const fingerprint = JSON.stringify(input)
    if (answerAttempt.current?.fingerprint !== fingerprint) answerAttempt.current = { fingerprint, requestId: crypto.randomUUID() }
    const requestId = answerAttempt.current.requestId
    const success = await run(() => transport.answer({ ...input, version: response.session.version, requestId, excludedIds: response.session.excludedIds }), requestId)
    if (success) answerAttempt.current = null
    return success
  }
  return { ...response, loading, working, error, ready, reload, choose, answer, busy: loading || working || !ready || !!response.session.pending }
}
