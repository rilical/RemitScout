interface SeoOptions {
  title: string
  description: string
  canonical?: string
  noindex?: boolean
  ogImage?: string
}

export const setSeo = ({ title, description, canonical, noindex = false, ogImage }: SeoOptions) => {
  const siteUrl = useRuntimeConfig().public.siteUrl;

  useHead({
    title,
    meta: [
      { name: 'description', content: description },
      ...(canonical
        ? [{ name: 'robots', content: noindex ? 'noindex,nofollow' : 'index,follow' }]
        : []),
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage || `${siteUrl}/og-image.jpg` },
      { property: 'og:url', content: canonical || useRoute().path },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Remit-Scout' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage || `${siteUrl}/og-image.jpg` },
    ],
    link: [...(canonical ? [{ rel: 'canonical', href: canonical }] : [])],
  });
};

export const jsonLdWebSiteSearch = (siteUrl: string) => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Remit-Scout',
          url: siteUrl,
          description: 'Compare money transfer providers and find the best rates for international money transfers',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        })
      }
    ]
  });
};

export const jsonLdOrganization = (siteUrl: string) => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Remit-Scout',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
          description: 'Compare money transfer providers and find the best rates for international money transfers',
          sameAs: ['https://twitter.com/Remit-Scout', 'https://facebook.com/Remit-Scout'],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: 'support@Remit-Scout.com'
          }
        })
      }
    ]
  });
};

export const jsonLdSiteNavigation = (items: Array<{ name: string; url: string }>) => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SiteNavigationElement',
          name: 'Main Navigation',
          hasPart: items.map(item => ({
            '@type': 'WebPage',
            name: item.name,
            url: item.url
          }))
        })
      }
    ]
  });
};

export const jsonLdBreadcrumb = (items: Array<{ name: string; url: string }>) => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url
          }))
        })
      }
    ]
  });
};

export const jsonLdFaq = (items: Array<{ q: string; a: string }>) => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map(item => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a
            }
          }))
        })
      }
    ]
  });
};
