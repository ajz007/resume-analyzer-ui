import type { ReactNode } from 'react'
import { ui } from '../../app/uiTokens'

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h2 className={ui.results.section.title}>{title}</h2>
        {subtitle ? <p className={ui.results.section.subtitle}>{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}
