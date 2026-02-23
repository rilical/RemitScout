import { useHead } from '#app'
import type { Author } from '~/utils/authors'
import type { EsimPlan } from '~/utils/esim-data'
import { BRAND } from '~/content/brand'

interface BreadcrumbItem {
  name: string
  url: string
}

interface FAQItem {
  question: string
  answer: string
}

interface ProviderOffer {
  provider: string
  areaServed: string
  price: string
  priceCurrency: string
  deliveryTime?: string
  exchangeRate?: string
}

interface CorridorProvider {
  name: string
  slug?: string
  logo?: string
}

export const useStructuredData = () => {
  const { public: { siteUrl, siteName } } = useRuntimeConfig()
  const cspNonce = useCspNonce()
  const socialLinks = Object.values(BRAND.social)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map(value => value as string)

  // Organization schema
  const addOrganizationSchema = () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': siteName || 'Remit-Scout',
      'url': siteUrl,
      'logo': `${siteUrl}/logo.png`,
      'description': 'Independent comparison service for international money transfers and travel connectivity',
      ...(socialLinks.length ? { sameAs: socialLinks } : {}),
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'customer service',
        'email': BRAND.emails.support,
        'availableLanguage': ['English', 'Spanish', 'French'],
      },
      'address': {
        '@type': 'PostalAddress',
        'addressCountry': 'US',
      },
    }

    useHead({
      script: [{
        key: 'jsonld:organization',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // WebSite with search box schema
  const addWebSiteSearchSchema = () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': siteName || 'Remit-Scout',
      'url': siteUrl,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': `${siteUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    }

    useHead({
      script: [{
        key: 'jsonld:website-search',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // Breadcrumb schema
  const addBreadcrumbSchema = (items: BreadcrumbItem[]) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url,
      })),
    }

    useHead({
      script: [{
        key: 'jsonld:breadcrumb',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // FAQ schema
  const addFAQSchema = (faqs: FAQItem[]) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer,
        },
      })),
    }

    useHead({
      script: [{
        key: 'jsonld:faq',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // ItemList schema for provider comparisons
  const addProviderListSchema = (providers: ProviderOffer[], listName: string) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': listName,
      'itemListOrder': 'https://schema.org/ItemListOrderAscending',
      'numberOfItems': providers.length,
      'itemListElement': providers.map((provider, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
          '@type': 'Service',
          'name': provider.provider,
          'provider': {
            '@type': 'Organization',
            'name': provider.provider,
          },
          'areaServed': provider.areaServed,
          'offers': {
            '@type': 'Offer',
            'price': provider.price,
            'priceCurrency': provider.priceCurrency,
          },
          'additionalType': 'https://schema.org/RemittanceService',
        },
      })),
    }

    useHead({
      script: [{
        key: 'jsonld:provider-list',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // Article schema with author
  const addArticleSchema = (params: {
    headline: string
    description: string
    author: Author
    datePublished: string
    dateModified: string
    image?: string
    url: string
  }) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': params.headline,
      'description': params.description,
      'author': {
        '@type': 'Person',
        'name': params.author.name,
        'jobTitle': params.author.role,
        'url': `${siteUrl}/author/${params.author.id}`,
      },
      'datePublished': params.datePublished,
      'dateModified': params.dateModified,
      'publisher': {
        '@type': 'Organization',
        'name': siteName || 'Remit-Scout',
        'logo': {
          '@type': 'ImageObject',
          'url': `${siteUrl}/logo.png`,
        },
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': params.url,
      },
      'image': params.image || `${siteUrl}/og-image.jpg`,
    }

    useHead({
      script: [{
        key: 'jsonld:article',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // Product schema for eSIM plans
  const addEsimProductSchema = (plan: EsimPlan) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': `${plan.provider} ${plan.country} eSIM - ${plan.dataAmount} for ${plan.duration} days`,
      'description': `Prepaid eSIM data plan for ${plan.country}. ${plan.features.join('. ')}`,
      'brand': {
        '@type': 'Brand',
        'name': plan.provider,
      },
      'offers': {
        '@type': 'Offer',
        'price': plan.price,
        'priceCurrency': plan.currency,
        'availability': 'https://schema.org/InStock',
        'priceValidUntil': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'seller': {
          '@type': 'Organization',
          'name': plan.provider,
        },
      },
    }

    useHead({
      script: [{
        key: 'jsonld:esim-product',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // AggregateOffer for multiple eSIM plans
  const addEsimAggregateOfferSchema = (plans: EsimPlan[], country: string) => {
    const prices = plans.map(p => p.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': `${country} eSIM Data Plans`,
      'description': `Compare prepaid eSIM data plans for ${country}. Instant activation, no roaming fees.`,
      'offers': {
        '@type': 'AggregateOffer',
        'lowPrice': minPrice,
        'highPrice': maxPrice,
        'priceCurrency': 'USD',
        'offerCount': plans.length,
        'offers': plans.map(plan => ({
          '@type': 'Offer',
          'price': plan.price,
          'priceCurrency': plan.currency,
          'name': `${plan.dataAmount} for ${plan.duration} days`,
          'seller': {
            '@type': 'Organization',
            'name': plan.provider,
          },
        })),
      },
    }

    useHead({
      script: [{
        key: 'jsonld:esim-aggregate-offer',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // Exchange rate specification schema
  const addExchangeRateSchema = (params: {
    baseCurrency: string
    quoteCurrency: string
    rate: number | string
    provider?: string
    lastUpdated?: string
  }) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ExchangeRateSpecification',
      'currency': `${params.baseCurrency}-${params.quoteCurrency}`,
      'currentExchangeRate': {
        '@type': 'MonetaryAmount',
        'currency': params.quoteCurrency,
        'value': Number(params.rate),
      },
      ...(params.provider
? { provider: {
        '@type': 'Organization',
        'name': params.provider,
      } }
: {}),
      ...(params.lastUpdated ? { validFrom: params.lastUpdated } : {}),
    }

    useHead({
      script: [{
        key: 'jsonld:exchange-rate',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // Service schema for remittance comparison
  const addRemittanceServiceSchema = () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'name': 'International Money Transfer Comparison',
      'description': 'Compare current provider quotes, fees and delivery speeds from 30+ licensed money transfer providers',
      'provider': {
        '@type': 'Organization',
        'name': siteName || 'Remit-Scout',
      },
      'serviceType': 'Financial Comparison Service',
      'areaServed': {
        '@type': 'GeoShape',
        'name': 'Worldwide',
      },
      'hasOfferCatalog': {
        '@type': 'OfferCatalog',
        'name': 'Money Transfer Providers',
        'itemListElement': [
          { '@type': 'Service', 'name': 'Bank Transfer' },
          { '@type': 'Service', 'name': 'Cash Pickup' },
          { '@type': 'Service', 'name': 'Mobile Wallet' },
        ],
      },
    }

    useHead({
      script: [{
        key: 'jsonld:remittance-service',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // FinancialProduct schema for comparison pages
  const addFinancialProductSchema = (params: {
    name: string
    description: string
    url: string
    provider: string
    exchangeRate?: string
    fees?: string
    deliveryTime?: string
    currency: string
    amount?: string
  }) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      'name': params.name,
      'description': params.description,
      'url': params.url,
      'provider': {
        '@type': 'Organization',
        'name': params.provider,
      },
      'offers': {
        '@type': 'Offer',
        'priceCurrency': params.currency,
        ...(params.amount && { price: params.amount }),
        ...(params.exchangeRate && { description: `Exchange rate: ${params.exchangeRate}` }),
      },
      ...(params.deliveryTime && { availabilityStarts: params.deliveryTime }),
    }

    useHead({
      script: [{
        key: 'jsonld:financial-product',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // Review schema for provider review pages
  const addReviewSchema = (params: {
    itemReviewed: string
    reviewBody: string
    author: string
    ratingValue: number
    bestRating?: number
    worstRating?: number
    datePublished: string
  }) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Review',
      'itemReviewed': {
        '@type': 'Organization',
        'name': params.itemReviewed,
      },
      'reviewBody': params.reviewBody,
      'author': {
        '@type': 'Person',
        'name': params.author,
      },
      'reviewRating': {
        '@type': 'Rating',
        'ratingValue': params.ratingValue,
        'bestRating': params.bestRating || 5,
        'worstRating': params.worstRating || 1,
      },
      'datePublished': params.datePublished,
      'publisher': {
        '@type': 'Organization',
        'name': siteName || 'Remit-Scout',
        'logo': {
          '@type': 'ImageObject',
          'url': `${siteUrl}/logo.png`,
        },
      },
    }

    useHead({
      script: [{
        key: 'jsonld:review',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // HowTo schema for guide pages
  const addHowToSchema = (params: {
    name: string
    description: string
    steps: Array<{ name: string, text: string, image?: string }>
  }) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': params.name,
      'description': params.description,
      'step': params.steps.map((step, index) => ({
        '@type': 'HowToStep',
        'position': index + 1,
        'name': step.name,
        'text': step.text,
        ...(step.image && {
          image: {
            '@type': 'ImageObject',
            'url': step.image,
          },
        }),
      })),
    }

    useHead({
      script: [{
        key: 'jsonld:howto',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // Aggregate rating schema for provider/review score surfaces
  const addAggregateRatingSchema = (params: {
    name: string
    ratingValue: number
    bestRating?: number
    worstRating?: number
    ratingCount?: number
    reviewCount?: number
  }) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'AggregateRating',
      'itemReviewed': {
        '@type': 'Organization',
        'name': params.name,
      },
      'ratingValue': params.ratingValue,
      'bestRating': params.bestRating || 10,
      'worstRating': params.worstRating || 1,
      ...(params.ratingCount !== undefined ? { ratingCount: params.ratingCount } : {}),
      ...(params.reviewCount !== undefined ? { reviewCount: params.reviewCount } : {}),
    }

    useHead({
      script: [{
        key: 'jsonld:aggregate-rating',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // Video schema for embedded content pages
  const addVideoObjectSchema = (params: {
    name: string
    description: string
    thumbnailUrl: string
    uploadDate: string
    contentUrl: string
    embedUrl: string
  }) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      'name': params.name,
      'description': params.description,
      'thumbnailUrl': params.thumbnailUrl,
      'uploadDate': params.uploadDate,
      'contentUrl': params.contentUrl,
      'embedUrl': params.embedUrl,
    }

    useHead({
      script: [{
        key: 'jsonld:video',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  const addRemittanceCorridorSchema = (params: {
    from: string
    to: string
    providers: CorridorProvider[]
    bestRate: string
    lastUpdated?: string
  }) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'name': `Money transfer from ${params.from} to ${params.to}`,
      'areaServed': [
        { '@type': 'Country', 'name': params.from },
        { '@type': 'Country', 'name': params.to },
      ],
      'provider': {
        '@type': 'Organization',
        'name': siteName || 'Remit-Scout',
      },
      'offers': params.providers.map(provider => ({
        '@type': 'Offer',
        'name': provider.name,
        'price': params.bestRate,
        'url': `${siteUrl}/learn/providers/${provider.slug || provider.name.toLowerCase()}`,
      })),
      'audience': {
        '@type': 'Audience',
        'name': 'Remitters and expatriates',
      },
      ...(params.lastUpdated ? { dateModified: params.lastUpdated } : {}),
    }

    useHead({
      script: [{
        key: 'jsonld:remittance-corridor',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  // LocalBusiness schema (if applicable)
  const addLocalBusinessSchema = (params: {
    name: string
    address: {
      streetAddress?: string
      addressLocality: string
      addressRegion?: string
      postalCode?: string
      addressCountry: string
    }
    telephone?: string
    openingHours?: string[]
  }) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': params.name,
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': params.address.streetAddress,
        'addressLocality': params.address.addressLocality,
        'addressRegion': params.address.addressRegion,
        'postalCode': params.address.postalCode,
        'addressCountry': params.address.addressCountry,
      },
      ...(params.telephone && { telephone: params.telephone }),
      ...(params.openingHours && { openingHoursSpecification: params.openingHours }),
    }

    useHead({
      script: [{
        key: 'jsonld:local-business',
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
        nonce: cspNonce.value || undefined,
      }],
    })
  }

  return {
    addOrganizationSchema,
    addWebSiteSearchSchema,
    addBreadcrumbSchema,
    addFAQSchema,
    addProviderListSchema,
    addArticleSchema,
    addEsimProductSchema,
    addEsimAggregateOfferSchema,
    addRemittanceServiceSchema,
    addFinancialProductSchema,
    addReviewSchema,
    addExchangeRateSchema,
    addHowToSchema,
    addAggregateRatingSchema,
    addVideoObjectSchema,
    addRemittanceCorridorSchema,
    addLocalBusinessSchema,
  }
}
