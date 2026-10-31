import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/index.css'
import scenarios from '../src/fixtures/report-v3-cases.json'
import { fromBackendResult } from '../src/analysis/adapters/fromBackend'
import { normalizeAnalysisResponse } from '../src/analysis/normalizeAnalysisResponse'
import type { BackendAnalysisResult } from '../src/api/backendTypes'
import ReviewReportView from '../src/components/reports/ReviewReportView'

function Preview() {
  const [selected, setSelected] = useState(0)
  const [locked, setLocked] = useState(false)
  const item = scenarios[selected]
  const fixture = structuredClone(item.result) as unknown as BackendAnalysisResult
  fixture.meta = { ...fixture.meta, analysisId: `fixture-${item.id}` }
  if (locked && fixture.report) fixture.report = { schemaVersion: '3', scope: 'SELECTED_PASSAGES', priorities: fixture.report.priorities }
  fixture.locked = locked
  const result = normalizeAnalysisResponse(fromBackendResult(fixture))
  return <main className="mx-auto min-h-screen max-w-5xl space-y-5 bg-slate-50 p-4 text-slate-900 sm:p-7">
    <header className="space-y-3"><p className="text-sm">Development preview · sanitized fixtures · no model calls</p><h1 className="text-2xl font-semibold">Changes-first report</h1><div className="flex flex-wrap items-center gap-4"><label>Scenario <select id="scenario" className="rounded border bg-white p-2" value={selected} onChange={event => setSelected(Number(event.target.value))}>{scenarios.map((scenario, index) => <option key={scenario.id} value={index}>{scenario.id}</option>)}</select></label><label><input id="locked" type="checkbox" checked={locked} onChange={event => setLocked(event.target.checked)}/> Locked preview</label></div></header>
    <ReviewReportView key={`${item.id}-${locked}`} result={result} localPreview/>
  </main>
}
createRoot(document.getElementById('root')!).render(<Preview/> )
