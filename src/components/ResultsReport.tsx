import type { NormalizedAnalysis } from '../analysis/normalizeAnalysisResponse'
import { ui } from '../app/uiTokens'
import RecommendationsPanel from './RecommendationsPanel'
import { AtsResultBox, JobMatchResultBox } from './ResultBox'

type JobMatchReportProps = {
  result: NormalizedAnalysis
  showFixFirstDetails: boolean
  onToggleFixFirstDetails: () => void
  showFindings: boolean
  onToggleFindings: () => void
}

type AtsReportProps = {
  result: NormalizedAnalysis
  showFindings: boolean
  onToggleFindings: () => void
}

export const JobMatchResultsReport = ({
  result,
  showFixFirstDetails,
  onToggleFixFirstDetails,
  showFindings,
  onToggleFindings,
}: JobMatchReportProps) => {
  const matchScore = result.matchScore ?? result.finalScore ?? 0
  const atsScore = result.normalized.atsScore ?? result.finalScore ?? result.matchScore ?? 0

  return (
    <>
      <div className={`${ui.card.padded} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-gray-900">Job Match Score: {matchScore}/100</p>
          </div>
          <div className="text-sm text-gray-600">
            ATS Readiness:{' '}
            <span className="font-semibold text-gray-900">{atsScore}/100</span> |{' '}
            {atsScore >= 65 ? 'ATS-safe, no blocking issues' : 'ATS needs attention'}
          </div>
        </div>
        <p className="text-sm text-gray-700">
          {matchScore < 50
            ? 'Your resume does not strongly match this job yet. The gaps are fixable in ~30-60 minutes.'
            : matchScore < 75
            ? "You're moderately aligned. Fixing the top gaps can significantly improve shortlist chances."
            : "You're strongly aligned. Polish and apply confidently."}
        </p>
        <a href="#fix-first" className={ui.button.primary}>
          Improve My Match
        </a>
      </div>

      <div id="fix-first" className={`${ui.card.padded} space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">What to Fix First</h2>
            <p className="text-sm text-gray-600">High-impact updates you can finish quickly.</p>
          </div>
          <button
            type="button"
            onClick={onToggleFixFirstDetails}
            className="text-sm text-blue-700 underline"
          >
            {showFixFirstDetails ? 'Hide detailed guidance' : 'Show detailed guidance'}
          </button>
        </div>
        <ul className="list-disc list-inside text-sm text-gray-700">
          <li>Add a BD-focused headline + 2-3 line summary</li>
          <li>Add email, phone, LinkedIn to header</li>
          <li>Insert missing CRM/sales keywords</li>
          <li>Rewrite 2 recent bullets to show commercial impact</li>
        </ul>
        {showFixFirstDetails && (
          <ul className="list-disc list-inside text-sm text-gray-700">
            <li>Mirror 2-3 keywords from the job title and core requirements</li>
            <li>Lead bullets with measurable outcomes (pipeline, revenue, close rate)</li>
            <li>Clarify territory, segment, and deal size context</li>
          </ul>
        )}
      </div>

      <JobMatchResultBox result={result} />

      <div id="findings" className={`${ui.card.padded} space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Detailed Findings & Recommendations</h2>
          <button
            type="button"
            onClick={onToggleFindings}
            className="text-sm text-blue-700 underline"
            aria-expanded={showFindings}
            aria-controls="findings-panel"
          >
            {showFindings ? 'Hide findings' : 'Show findings'}
          </button>
        </div>
        {showFindings && (
          <div id="findings-panel">
            <RecommendationsPanel recommendations={result.recommendations} />
          </div>
        )}
      </div>
    </>
  )
}

export const AtsResultsReport = ({ result, showFindings, onToggleFindings }: AtsReportProps) => {
  const atsScore = result.normalized.atsScore ?? result.finalScore ?? result.matchScore ?? 0

  return (
    <>
      <div className={`${ui.card.padded} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-gray-900">ATS Score: {atsScore}/100</p>
          </div>
          <div className="text-sm text-gray-600">
            {atsScore >= 65 ? 'ATS-safe, no blocking issues' : 'ATS needs attention'}
          </div>
        </div>
        <p className="text-sm text-gray-700">
          Focus on formatting, keyword hygiene, and clear structure to improve ATS readability.
        </p>
        <a href="#ats" className={ui.button.primary}>
          Improve ATS Readiness
        </a>
      </div>

      <AtsResultBox result={result} />

      <div id="findings" className={`${ui.card.padded} space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Detailed Findings & Recommendations</h2>
          <button
            type="button"
            onClick={onToggleFindings}
            className="text-sm text-blue-700 underline"
            aria-expanded={showFindings}
            aria-controls="findings-panel"
          >
            {showFindings ? 'Hide findings' : 'Show findings'}
          </button>
        </div>
        {showFindings && (
          <div id="findings-panel">
            <RecommendationsPanel recommendations={result.recommendations} />
          </div>
        )}
      </div>
    </>
  )
}
