import { Helmet } from 'react-helmet-async'

export type SeoStructuredData = Record<string, unknown>

export type SeoMetadataProps = {
  title: string
  description: string
  canonicalUrl: string
  imageUrl?: string
  siteName?: string
  structuredData?: SeoStructuredData | SeoStructuredData[]
}

const SeoMetadata = ({
  title,
  description,
  canonicalUrl,
  imageUrl,
  siteName = 'Rethink Resume',
  structuredData,
}: SeoMetadataProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:site_name" content={siteName} />
    {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
    {structuredData ? (
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    ) : null}
  </Helmet>
)

export default SeoMetadata
