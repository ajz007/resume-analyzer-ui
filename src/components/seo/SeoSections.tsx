import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type SeoCardItem = {
  title: string
  body: ReactNode
}

export type SeoRelatedLink = {
  title: string
  body: string
  to: string
}

type SeoSectionProps = {
  title?: string
  eyebrow?: string
  children: ReactNode
  id?: string
  className?: string
  titleClassName?: string
}

type SeoSplitSectionProps = {
  title: string
  intro: ReactNode
  children: ReactNode
  id?: string
}

type SeoCardGridProps = {
  items: SeoCardItem[]
  columns?: 2 | 3
  titleLevel?: 'h2' | 'h3'
}

export const SeoSection = ({
  title,
  eyebrow,
  children,
  id,
  className = '',
  titleClassName = 'text-3xl font-bold text-gray-950',
}: SeoSectionProps) => (
  <section id={id} className={`space-y-5 py-12 ${className}`.trim()}>
    {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{eyebrow}</p> : null}
    {title ? <h2 className={titleClassName}>{title}</h2> : null}
    {children}
  </section>
)

export const SeoTextBlock = ({ children }: { children: ReactNode }) => (
  <div className="space-y-4 text-base leading-8 text-gray-700">{children}</div>
)

export const SeoCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-lg border border-gray-200 bg-white p-5">
    <h3 className="text-xl font-semibold text-gray-950">{title}</h3>
    <div className="mt-3 text-base leading-7 text-gray-700">{children}</div>
  </section>
)

export const SeoCardGrid = ({ items, columns = 2, titleLevel = 'h3' }: SeoCardGridProps) => {
  const Heading = titleLevel
  const gridClass = columns === 3 ? 'md:grid-cols-3' : 'sm:grid-cols-2'

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {items.map((item) => (
        <section key={item.title} className="rounded-lg border border-gray-200 bg-white p-5">
          <Heading className="text-xl font-semibold text-gray-950">{item.title}</Heading>
          <div className="mt-3 text-base leading-7 text-gray-700">{item.body}</div>
        </section>
      ))}
    </div>
  )
}

export const SeoSplitSection = ({ title, intro, children, id }: SeoSplitSectionProps) => (
  <section id={id} className="grid gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]">
    <div>
      <h2 className="text-3xl font-bold text-gray-950">{title}</h2>
      <div className="mt-4 text-base leading-8 text-gray-700">{intro}</div>
    </div>
    <div>{children}</div>
  </section>
)

export const SeoSteps = ({ items }: { items: SeoCardItem[] }) => (
  <section className="border-y border-gray-200 py-10">
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((item, index) => (
        <div key={item.title}>
          <div className="text-3xl font-bold text-blue-700">{index + 1}</div>
          <h2 className="mt-2 text-xl font-semibold text-gray-950">{item.title}</h2>
          <div className="mt-2 text-base leading-7 text-gray-700">{item.body}</div>
        </div>
      ))}
    </div>
  </section>
)

export const SeoRelatedLinks = ({ title = 'Related resume tools', links }: { title?: string; links: SeoRelatedLink[] }) => (
  <SeoSection title={title}>
    <div className="grid gap-4 sm:grid-cols-2">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="rounded-lg border border-gray-200 bg-white p-5 hover:border-blue-300 hover:bg-blue-50"
        >
          <h3 className="text-xl font-semibold text-gray-950">{link.title}</h3>
          <p className="mt-2 text-base leading-7 text-gray-700">{link.body}</p>
        </Link>
      ))}
    </div>
  </SeoSection>
)
