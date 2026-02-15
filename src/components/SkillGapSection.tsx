import type { AnalysisResponse } from '../api/types'
import type { NormalizedAnalysis } from '../analysis/normalizeAnalysisResponse'
import { useState } from 'react'
import {
  examplePhrasing,
  findKeywordRecommendation,
  placementSuggestion,
  rankKeywords,
} from '../analysis/skillGap'

type SkillGapSectionProps = {
  result: AnalysisResponse | NormalizedAnalysis
}

const SkillGapSection = ({ result }: SkillGapSectionProps) => {
  const normalized = (result as NormalizedAnalysis).normalized
  const buckets = result.missingKeywordBuckets
  const missingKeywords =
    normalized?.missingKeywordsFromJD ?? buckets?.fromJobDescription ?? []
  const issues = result.issues ?? []
  const recommendations = result.recommendations ?? []
  const prioritized = rankKeywords(missingKeywords, issues, recommendations)
  const topKeywords = prioritized.slice(0, 6)
  const keywordRecommendation = findKeywordRecommendation(recommendations)
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null)

  return (
    <div className="bg-white rounded border p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Skill Gap Analysis</h3>
        <p className="text-sm text-gray-600">Compared to the job description.</p>
      </div>
      <p className="text-sm text-gray-600">
        Only add keywords you can honestly support. Best practice: add in Skills/Tools and support
        with 1 proof bullet in Experience.
      </p>

      {keywordRecommendation?.action && (
        <div className="border rounded bg-blue-50 border-blue-200 p-3 text-sm text-blue-900">
          <p className="font-semibold">Recommended approach</p>
          <p>{keywordRecommendation.action}</p>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-900">Top keywords to fix first</p>
        <p className="text-xs text-gray-600">Highest impact on ATS and recruiter screening.</p>
        {topKeywords.length ? (
          <div className="flex flex-wrap gap-2">
            {topKeywords.map((keyword) => (
              <button
                key={`top-${keyword}`}
                type="button"
                className="px-2 py-1 text-xs rounded-full border bg-white text-gray-800 hover:bg-gray-50"
                onClick={() =>
                  setExpandedKeyword((current) => (current === keyword ? null : keyword))
                }
              >
                {keyword}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No high-priority gaps detected.</p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border rounded p-3 space-y-3">
          <div className="text-sm font-semibold text-gray-900">
            Missing from Your Resume (Required by Job Description)
          </div>
          <p className="text-xs text-gray-600">
            These keywords appear in the job description and affect ATS and recruiter scanning.
          </p>
          {keywordRecommendation?.action && (
            <p className="text-xs text-gray-600">{keywordRecommendation.action}</p>
          )}
          {missingKeywords.length ? (
            <ul className="space-y-3">
              {missingKeywords.map((keyword) => {
                const placement = placementSuggestion(keyword, issues)
                const example = examplePhrasing(keyword)
                const isExpanded = expandedKeyword === keyword
                return (
                  <li key={`missing-jd-${keyword}`} className="border rounded p-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-rose-800">{keyword}</p>
                      <button
                        type="button"
                        className="text-xs text-blue-700 underline"
                        onClick={() =>
                          setExpandedKeyword((current) => (current === keyword ? null : keyword))
                        }
                      >
                        {isExpanded ? 'Hide' : 'Where & how to add'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Add to: {placement}</p>
                    {isExpanded && (
                      <div className="text-xs text-gray-700 mt-2">
                        <p className="font-semibold text-gray-700">Example phrasing:</p>
                        <p>{example}</p>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">No job description gaps detected.</p>
          )}
        </div>

        <div className="border rounded p-3 space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">If you address 5-7 of these</p>
            <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
              <li>Estimated Job Match gain: +15-20</li>
              <li>Higher recruiter shortlisting odds</li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-gray-900">Common keyword bundles for this role</p>
            <ul className="list-disc list-inside text-gray-700 mt-2">
              <li>CRM &amp; Sales Stack: Salesforce, HubSpot, ZoomInfo</li>
              <li>Deal Lifecycle: Prospecting, negotiation, closing, pipeline</li>
              <li>Stakeholders: C-level, enterprise clients</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkillGapSection

