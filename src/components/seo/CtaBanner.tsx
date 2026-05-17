import type { ReactNode } from 'react'
import { SeoActionLink, type SeoAction } from './SeoLandingPage'

type CtaBannerProps = {
  title: string
  description: ReactNode
  actions: SeoAction[]
}

const CtaBanner = ({ title, description, actions }: CtaBannerProps) => (
  <section className="rounded-lg bg-gray-950 p-6 text-white sm:p-8">
    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <h2 className="text-3xl font-bold">{title}</h2>
        <div className="mt-3 max-w-3xl text-base leading-8 text-gray-200">{description}</div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
        {actions.map((action) => (
          <SeoActionLink
            key={`${action.label}-${action.to ?? action.href}`}
            action={{ ...action, variant: action.variant ?? 'light' }}
          />
        ))}
      </div>
    </div>
  </section>
)

export default CtaBanner
