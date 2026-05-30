import type { ReactNode } from 'react'

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error'

type AlertCardProps = {
  severity: AlertSeverity
  title: string
  description?: ReactNode
  children?: ReactNode
}

const severityStyles: Record<
  AlertSeverity,
  {
    container: string
    icon: string
    title: string
    description: string
    glyph: string
  }
> = {
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'border-blue-200 bg-white text-blue-700',
    title: 'text-blue-950',
    description: 'text-blue-900',
    glyph: 'i',
  },
  success: {
    container: 'border-green-200 bg-green-50',
    icon: 'border-green-200 bg-white text-green-700',
    title: 'text-green-950',
    description: 'text-green-900',
    glyph: '+',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50',
    icon: 'border-amber-200 bg-white text-amber-700',
    title: 'text-amber-950',
    description: 'text-amber-900',
    glyph: '!',
  },
  error: {
    container: 'border-red-200 bg-red-50',
    icon: 'border-red-200 bg-white text-red-700',
    title: 'text-red-950',
    description: 'text-red-900',
    glyph: '!',
  },
}

/*
  Product status usage:
  - warning: ATS concerns, low confidence parsing, partial analysis, missing information.
  - error: upload failures, backend failures, API failures, authentication failures.
  - success: analysis completed, download completed, resume generated.
  - info: educational guidance, ATS tips, product explanations.
*/
const AlertCard = ({ severity, title, description, children }: AlertCardProps) => {
  const styles = severityStyles[severity]

  return (
    <div className={`rounded-lg border p-4 text-sm ${styles.container}`} role="status">
      <div className="flex gap-3">
        <span
          aria-hidden
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-bold leading-none ${styles.icon}`}
        >
          {styles.glyph}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-2">
            <p className={`text-base font-semibold ${styles.title}`}>{title}</p>
            {description ? <div className={styles.description}>{description}</div> : null}
          </div>
          {children ? <div className={styles.description}>{children}</div> : null}
        </div>
      </div>
    </div>
  )
}

export default AlertCard
