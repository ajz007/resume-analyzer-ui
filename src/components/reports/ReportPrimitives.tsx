import type { ReactNode } from 'react'
import { ui } from '../../app/uiTokens'

type ResultsLayoutProps = {
  children: ReactNode
  className?: string
}

export const ResultsLayout = ({ children, className }: ResultsLayoutProps) => (
  <div className={`${ui.results.page.container}${className ? ` ${className}` : ''}`}>
    {children}
  </div>
)

type ReportCardProps = {
  children: ReactNode
  variant?: 'base' | 'emphasis' | 'muted'
  className?: string
}

export const ReportCard = ({ children, variant = 'base', className }: ReportCardProps) => (
  <div className={`${ui.results.card[variant]}${className ? ` ${className}` : ''}`}>{children}</div>
)

type SectionHeaderProps = {
  title: string
  subtitle?: string
  helper?: string
}

export const SectionHeader = ({ title, subtitle, helper }: SectionHeaderProps) => (
  <div className="space-y-1">
    <h3 className={ui.results.section.title}>{title}</h3>
    {subtitle ? <p className={ui.results.section.subtitle}>{subtitle}</p> : null}
    {helper ? <p className={ui.results.section.helper}>{helper}</p> : null}
  </div>
)

type SeverityTone = 'critical' | 'warning' | 'ok' | 'info'

type SeverityChipProps = {
  label: string
  tone: SeverityTone
  className?: string
}

export const SeverityChip = ({ label, tone, className }: SeverityChipProps) => (
  <span className={`${ui.results.chip.base} ${ui.results.chip[tone]}${className ? ` ${className}` : ''}`}>
    {label}
  </span>
)
