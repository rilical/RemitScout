interface SeoOptions {
  title: string
  description: string
  canonical?: string
  noindex?: boolean
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
  geoRegion?: string
  geoPlacename?: string
}

const trackingParams = new Set([
  'gclid',
  'gbraid',
  'wbraid',
  'dclid',
  'fbclid',
  'msclkid',
  'irclickid',
  'irgwc',
  'igshid',
  'mc_cid',
  'mc_eid',
])

const sanitizeCanonical = (value: string, siteUrl: string) => {
  try {
    const base = value.startsWith('http') ? value : new URL(value, siteUrl).toString()
    const url = new URL(base)
    for (const key of Array.from(url.searchParams.keys())) {
      if (key.startsWith('utm_') || trackingParams.has(key)) {
        url.searchParams.delete(key)
      }
    }
    url.hash = ''
    return `${url.origin}${url.pathname}${url.search}`
  }
  catch {
    return value
  }
}

export const setSeo = ({
  title,
  description,
  canonical,
  noindex = false,
  ogImage,
  ogType = 'website',
  publishedTime,
  modifiedTime,
  author,
  tags,
  geoRegion,
  geoPlacename,
}: SeoOptions) => {
  const siteUrl = useRuntimeConfig().public.siteUrl
  const route = useRoute()
  const normalizedSiteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl
  const path = route?.path === '/' ? '' : route?.path || ''
  const canonicalUrl = sanitizeCanonical(
    canonical || `${normalizedSiteUrl}${path || '/'}`,
    normalizedSiteUrl,
  )
  const robots = noindex ? 'noindex,nofollow' : 'index,follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  const image = ogImage || `${normalizedSiteUrl}/og-image.png`

  const metaTags: Array<Record<string, string>> = [
    { name: 'description', content: description },
    { name: 'robots', content: robots },
    // Open Graph tags
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:type', content: ogType },
    { property: 'og:site_name', content: 'Remit-Scout' },
    { property: 'og:locale', content: 'en_US' },
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { name: 'twitter:site', content: '@RemitScout' },
  ]

  // Add article-specific meta tags
  if (ogType === 'article') {
    if (publishedTime) {
      metaTags.push({ property: 'article:published_time', content: publishedTime })
    }
    if (modifiedTime) {
      metaTags.push({ property: 'article:modified_time', content: modifiedTime })
    }
    if (author) {
      metaTags.push({ property: 'article:author', content: author })
    }
    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        metaTags.push({ property: 'article:tag', content: tag })
      })
    }
  }

  // Add geo tags if provided
  if (geoRegion) {
    metaTags.push({ name: 'geo.region', content: geoRegion })
  }
  if (geoPlacename) {
    metaTags.push({ name: 'geo.placename', content: geoPlacename })
  }

  useHead({
    title,
    meta: metaTags,
    link: [{ rel: 'canonical', href: canonicalUrl }],
  })
}

export const jsonLdWebSiteSearch = (siteUrl: string) => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'name': 'Remit-Scout',
          'url': siteUrl,
          'description': 'Compare money transfer providers and find the best rates for international money transfers',
          'potentialAction': {
            '@type': 'SearchAction',
            'target': `${siteUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }),
      },
    ],
  })
}

export const jsonLdOrganization = (siteUrl: string) => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          'name': 'Remit-Scout',
          'url': siteUrl,
          'logo': `${siteUrl}/logo.png`,
          'description': 'Compare money transfer providers and find the best rates for international money transfers',
          'sameAs': ['https://twitter.com/Remit-Scout', 'https://facebook.com/Remit-Scout'],
          'contactPoint': {
            '@type': 'ContactPoint',
            'contactType': 'customer service',
            'email': 'support@remit-scout.com',
          },
        }),
      },
    ],
  })
}

export const jsonLdSiteNavigation = (items: Array<{ name: string, url: string }>) => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SiteNavigationElement',
          'name': 'Main Navigation',
          'hasPart': items.map(item => ({
            '@type': 'WebPage',
            'name': item.name,
            'url': item.url,
          })),
        }),
      },
    ],
  })
}

export const jsonLdBreadcrumb = (items: Array<{ name: string, url: string }>) => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': items.map((item, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': item.name,
            'item': item.url,
          })),
        }),
      },
    ],
  })
}

export const jsonLdFaq = (items: Array<{ q: string, a: string }>) => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': items.map(item => ({
            '@type': 'Question',
            'name': item.q,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': item.a,
            },
          })),
        }),
      },
    ],
  })
}
