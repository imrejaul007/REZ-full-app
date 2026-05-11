'use client'

interface SEOHeadProps {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function SEOHead({ title, description, image, url }: SEOHeadProps) {
  const fullTitle = title ? `${title} | ReZ Try` : 'ReZ Try'
  const desc = description || 'Try new experiences, pay less, get rewarded. The smart way to explore your city.'
  const img = image || '/icons/icon-512.svg'
  const pageUrl = url ? `https://try.rez.money${url}` : 'https://try.rez.money'

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="keywords" content="trials, experiences, rewards, coins, gamification" />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {/* Canonical */}
      <link rel="canonical" href={pageUrl} />
    </>
  )
}
