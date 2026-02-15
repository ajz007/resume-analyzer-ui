import type { NormalizedAnalysis } from '../analysis/normalizeAnalysisResponse'
import { useAnalysisStore } from '../store/useAnalysisStore'
import AtsReport from './reports/AtsReport'
import JobMatchReport from './reports/JobMatchReport'

type ResultBoxProps = {
  result: NormalizedAnalysis
  mode?: 'ATS' | 'JOB_MATCH'
}

const ResultBox = ({ result, mode }: ResultBoxProps) => {
  const { analysisMode } = useAnalysisStore()
  const reportMode = mode ?? analysisMode
  return reportMode === 'ATS' ? <AtsReport result={result} /> : <JobMatchReport result={result} />
}

export default ResultBox
