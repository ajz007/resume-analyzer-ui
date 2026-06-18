import { useLocation } from 'react-router-dom'
import SeoMetadata from './SeoMetadata'

type AppPageMetadataProps = {
  title: string
  description: string
}

const AppPageMetadata = ({ title, description }: AppPageMetadataProps) => {
  const location = useLocation()

  return (
    <SeoMetadata
      title={title}
      description={description}
      canonicalUrl={`https://rethinkresume.com${location.pathname}`}
      robots="noindex, nofollow"
    />
  )
}

export default AppPageMetadata
