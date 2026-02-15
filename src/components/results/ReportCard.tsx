import type { ReactNode } from 'react'
import { ui } from '../../app/uiTokens'

type Variant = 'base' | 'emphasis' | 'muted'

export function ReportCard({
  children,
  variant = 'base',
  className,
}: {
  children: ReactNode
  variant?: Variant
  className?: string
}) {
  const styles =
    variant === 'emphasis'
      ? ui.results.card.emphasis
      : variant === 'muted'
      ? ui.results.card.muted
      : ui.results.card.base
  return <div className={`${styles} ${className ?? ''}`}>{children}</div>
}
