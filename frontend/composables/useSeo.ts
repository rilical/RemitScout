interface SeoOptions {
  title: string
  description: string
  canonical?: string
  locale?: string
  noindex?: boolean
  /** When `false`, do not emit `og:image` / `twitter:image` meta (useful when using `defineOgImage()`). */
  ogImage?: string | false
  ogType?: 'website' | 'article'
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

export const sanitizeCanonical = (value: string, siteUrl: string) => {
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
  locale = 'en',
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
  const image = ogImage === false ? undefined : (ogImage || `${normalizedSiteUrl}/og-image.png`)
  const articleTags = Array.isArray(tags)
    ? tags.map(tag => tag.trim()).filter(Boolean)
    : []

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ...(image ? { ogImage: image } : {}),
    ogUrl: canonicalUrl,
    ogType,
    ogSiteName: 'Remit-Scout',
    ogLocale: locale === 'en' ? 'en_US' : locale,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    ...(image ? { twitterImage: image } : {}),
    twitterSite: '@RemitScout',
    ...(publishedTime ? { articlePublishedTime: publishedTime } : {}),
    ...(modifiedTime ? { articleModifiedTime: modifiedTime } : {}),
    ...(author ? { articleAuthor: [author] } : {}),
    ...(articleTags.length ? { articleSection: articleTags[0] } : {}),
    ...(geoRegion ? { geoRegion: geoRegion } : {}),
    ...(geoPlacename ? { geoPlaceName: geoPlacename } : {}),
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  })

  useHead({
    title,
    meta: [
      ...articleTags.map(tag => ({
        key: `article:tag:${tag}`,
        property: 'article:tag',
        content: tag,
      })),
    ],
    link: [
      // Keyed to prevent duplicate canonical/alternate links on dynamic pages that update SEO reactively.
      { key: 'canonical', rel: 'canonical', href: canonicalUrl },
      ...(locale ? [{ key: `alternate:${locale}`, rel: 'alternate', hreflang: locale, href: canonicalUrl }] : []),
    ],
  })
}

export const jsonLdWebSiteSearch = (siteUrl: string) => {
  const cspNonce = useCspNonce()
  useHead({
    script: [
      {
        type: 'application/ld+json',
        nonce: cspNonce.value || undefined,
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
  const cspNonce = useCspNonce()
  useHead({
    script: [
      {
        type: 'application/ld+json',
        nonce: cspNonce.value || undefined,
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
  const cspNonce = useCspNonce()
  useHead({
    script: [
      {
        type: 'application/ld+json',
        nonce: cspNonce.value || undefined,
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
  const cspNonce = useCspNonce()
  useHead({
    script: [
      {
        type: 'application/ld+json',
        nonce: cspNonce.value || undefined,
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
  const cspNonce = useCspNonce()
  useHead({
    script: [
      {
        type: 'application/ld+json',
        nonce: cspNonce.value || undefined,
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
