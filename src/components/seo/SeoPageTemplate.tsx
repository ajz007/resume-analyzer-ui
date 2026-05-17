import type { ReactNode } from 'react'
import CtaBanner from './CtaBanner'
import FaqAccordion, { type FaqItem } from './FaqAccordion'
import SeoLandingPage, { SeoHero, type SeoAction } from './SeoLandingPage'
import type { SeoMetadataProps } from './SeoMetadata'
import { SeoRelatedLinks, type SeoRelatedLink } from './SeoSections'

export type SeoPageTemplateProps = {
  metadata: SeoMetadataProps
  hero: {
    eyebrow: string
    title: string
    description: string
    actions?: SeoAction[]
    aside?: ReactNode
    eyebrowTone?: 'blue' | 'emerald'
  }
  children: ReactNode
  cta?: {
    title: string
    description: ReactNode
    actions: SeoAction[]
  }
  relatedLinks?: SeoRelatedLink[]
  faq?: {
    title: string
    description?: string
    items: FaqItem[]
  }
}

const SeoPageTemplate = ({ metadata, hero, children, cta, relatedLinks, faq }: SeoPageTemplateProps) => (
  <SeoLandingPage metadata={metadata}>
    <SeoHero {...hero} />
    {children}
    {cta ? <CtaBanner {...cta} /> : null}
    {relatedLinks ? <SeoRelatedLinks links={relatedLinks} /> : null}
    {faq ? <FaqAccordion {...faq} /> : null}
  </SeoLandingPage>
)

export default SeoPageTemplate
