import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import SeoMetadata, { type SeoMetadataProps } from './SeoMetadata'

export type SeoAction = {
  label: string
  to?: string
  href?: string
  variant?: 'primary' | 'secondary' | 'light' | 'outlineDark'
}

type SeoLandingPageProps = {
  metadata: SeoMetadataProps
  children: ReactNode
  className?: string
}

type SeoHeroProps = {
  eyebrow: string
  title: string
  description: string
  actions?: SeoAction[]
  aside?: ReactNode
  eyebrowTone?: 'blue' | 'emerald'
}

const actionClass = (variant: SeoAction['variant'] = 'primary') => {
  const base =
    'inline-flex items-center justify-center rounded-md px-5 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2'

  if (variant === 'secondary') {
    return `${base} border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:ring-blue-700`
  }

  if (variant === 'light') {
    return `${base} bg-white text-gray-950 hover:bg-gray-100 focus:ring-white focus:ring-offset-gray-950`
  }

  if (variant === 'outlineDark') {
    return `${base} border border-gray-500 text-white hover:bg-gray-900 focus:ring-white focus:ring-offset-gray-950`
  }

  return `${base} bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-700`
}

export const SeoActionLink = ({ action, className = '' }: { action: SeoAction; className?: string }) => {
  const classes = `${actionClass(action.variant)} ${className}`.trim()

  if (action.href) {
    return (
      <a href={action.href} className={classes}>
        {action.label}
      </a>
    )
  }

  return (
    <Link to={action.to ?? '/app/analyzer'} className={classes}>
      {action.label}
    </Link>
  )
}

export const SeoLandingPage = ({ metadata, children, className = '' }: SeoLandingPageProps) => (
  <article className={`mx-auto max-w-5xl text-gray-900 ${className}`.trim()}>
    <SeoMetadata {...metadata} />
    {children}
  </article>
)

export const SeoHero = ({
  eyebrow,
  title,
  description,
  actions = [],
  aside,
  eyebrowTone = 'blue',
}: SeoHeroProps) => {
  const eyebrowClass =
    eyebrowTone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-blue-200 bg-blue-50 text-blue-800'

  return (
    <section className="grid gap-8 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-14">
      <div className="space-y-6">
        <div
          className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${eyebrowClass}`}
        >
          {eyebrow}
        </div>
        <div className="space-y-4">
          <h1 className="max-w-4xl text-4xl font-bold tracking-normal text-gray-950 sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-gray-700">{description}</p>
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            {actions.map((action) => (
              <SeoActionLink key={`${action.label}-${action.to ?? action.href}`} action={action} />
            ))}
          </div>
        ) : null}
      </div>
      {aside}
    </section>
  )
}

export default SeoLandingPage
