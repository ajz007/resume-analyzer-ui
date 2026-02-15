import type { ReactNode } from 'react'
import { ui } from '../../app/uiTokens'

export default function ResultsLayout({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`${ui.results.page.container} ${className ?? ''}`}>{children}</div>
}
