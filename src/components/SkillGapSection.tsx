import type { AnalysisResponse } from '../api/types'
import { buildSkillGapModel } from '../analysis/skillGap'

type SkillGapSectionProps = {
  result: AnalysisResponse
}

const SkillGapSection = ({ result }: SkillGapSectionProps) => {
  const mode = result.analysisMode ?? 'job_match'
  if (mode !== 'job_match') return null

  const model = buildSkillGapModel(result)

  return (
    <div className="bg-white rounded border p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Skill Gap Analysis</h3>
        <p className="text-sm text-gray-600">Compared to the job description.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border rounded p-3 space-y-2">
          <div className="text-sm font-semibold text-gray-900">Missing (Job Description)</div>
          {model.missingFromJobDescription.length ? (
            <ul className="space-y-2">
              {model.missingFromJobDescription.map((skill) => (
                <li key={`missing-jd-${skill.name}`}>
                  <p className="font-semibold text-sm text-rose-800">{skill.name}</p>
                  <p className="text-xs text-gray-600">{skill.reason}</p>
                  {skill.recommendation && (
                    <p className="text-xs text-rose-700">{skill.recommendation}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">No job description gaps detected.</p>
          )}
        </div>

        <div className="border rounded p-3 space-y-2">
          <div className="text-sm font-semibold text-gray-900">Suggested (Industry Common)</div>
          {model.suggestedIndustryCommon.length ? (
            <ul className="space-y-2">
              {model.suggestedIndustryCommon.map((skill) => (
                <li key={`suggested-${skill.name}`}>
                  <p className="font-semibold text-sm text-amber-800">{skill.name}</p>
                  <p className="text-xs text-gray-600">{skill.reason}</p>
                  {skill.recommendation && (
                    <p className="text-xs text-amber-700">{skill.recommendation}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">No industry suggestions yet.</p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 border rounded p-3">
        <p className="text-sm font-semibold text-gray-900">Recommendations</p>
        <ul className="list-disc list-inside text-sm text-gray-700">
          {model.recommendations.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default SkillGapSection
