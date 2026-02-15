import { ui } from '../../app/uiTokens'

export type ChipTone = 'critical' | 'warning' | 'ok' | 'info'

export function SeverityChip({ tone, label }: { tone: ChipTone; label: string }) {
  const toneClass =
    tone === 'critical'
      ? ui.results.chip.critical
      : tone === 'warning'
      ? ui.results.chip.warning
      : tone === 'ok'
      ? ui.results.chip.ok
      : ui.results.chip.info

  return <span className={`${ui.results.chip.base} ${toneClass}`}>{label}</span>
}
