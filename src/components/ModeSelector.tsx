import { COPY } from '../constants/uiCopy'

type AnalysisMode = 'ATS' | 'JOB_MATCH'

type Props = {
  value: AnalysisMode
  onChange: (mode: AnalysisMode) => void
}

const baseCard =
  'w-full text-left border rounded-lg p-4 transition shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

const selectedCard = 'border-blue-500 bg-blue-50'
const unselectedCard = 'border-gray-200 bg-white'

const ModeSelector = ({ value, onChange }: Props) => (
  <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        className={`${baseCard} ${value === 'ATS' ? selectedCard : unselectedCard}`}
        aria-pressed={value === 'ATS'}
        onClick={() => onChange('ATS')}
      >
        <p className="text-base font-semibold text-gray-900">{COPY.modeSelector.ats.title}</p>
        <p className="text-sm text-gray-600">{COPY.modeSelector.ats.description}</p>
        <p className="text-xs text-gray-500 mt-2">{COPY.modeSelector.ats.outcome}</p>
        <span className="inline-flex mt-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
          {COPY.modeSelector.ats.action}
        </span>
      </button>

      <button
        type="button"
        className={`${baseCard} ${value === 'JOB_MATCH' ? selectedCard : unselectedCard}`}
        aria-pressed={value === 'JOB_MATCH'}
        onClick={() => onChange('JOB_MATCH')}
      >
        <p className="text-base font-semibold text-gray-900">{COPY.modeSelector.jobMatch.title}</p>
        <p className="text-sm text-gray-600">{COPY.modeSelector.jobMatch.description}</p>
        <p className="text-xs text-gray-500 mt-2">{COPY.modeSelector.jobMatch.outcome}</p>
        <span className="inline-flex mt-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
          {COPY.modeSelector.jobMatch.action}
        </span>
      </button>
    </div>
    <p className="text-xs text-gray-500">{COPY.modeSelector.tip}</p>
  </div>
)

export type { Props, AnalysisMode }
export default ModeSelector
