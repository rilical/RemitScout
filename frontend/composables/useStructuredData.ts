import { useHead } from '#app'
import type { Author } from '~/utils/authors'
import type { EsimPlan } from '~/utils/esim-data'

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

export const useStructuredData = () => {
  const { public: { siteUrl, siteName } } = useRuntimeConfig()

  // Organization schema
  const addOrganizationSchema = () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName || 'Remit-Scout',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      description: 'Independent comparison service for international money transfers and travel connectivity',
      sameAs: [
        'https://twitter.com/Remit-Scout',
        'https://facebook.com/Remit-Scout',
        'https://linkedin.com/company/Remit-Scout'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@Remit-Scout.com',
        availableLanguage: ['English', 'Spanish', 'French']
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'US'
      }
    }

    useHead({
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema)
      }]
    })
  }

  // WebSite with search box schema
  const addWebSiteSearchSchema = () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName || 'Remit-Scout',
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    }

    useHead({
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema)
      }]
    })
  }

  // Breadcrumb schema
  const addBreadcrumbSchema = (items: BreadcrumbItem[]) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    }

    useHead({
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema)
      }]
    })
  }

  // FAQ schema
  const addFAQSchema = (faqs: FAQItem[]) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    }

    useHead({
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema)
      }]
    })
  }

  // ItemList schema for provider comparisons
  const addProviderListSchema = (providers: ProviderOffer[], listName: string) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: listName,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: providers.length,
      itemListElement: providers.map((provider, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Service',
          name: provider.provider,
          provider: {
            '@type': 'Organization',
            name: provider.provider
          },
          areaServed: provider.areaServed,
          offers: {
            '@type': 'Offer',
            price: provider.price,
            priceCurrency: provider.priceCurrency
          },
          additionalType: 'https://schema.org/RemittanceService'
        }
      }))
    }

    useHead({
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema)
      }]
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
      headline: params.headline,
      description: params.description,
      author: {
        '@type': 'Person',
        name: params.author.name,
        jobTitle: params.author.role,
        url: `${siteUrl}/author/${params.author.id}`
      },
      datePublished: params.datePublished,
      dateModified: params.dateModified,
      publisher: {
        '@type': 'Organization',
        name: siteName || 'Remit-Scout',
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/logo.png`
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': params.url
      },
      image: params.image || `${siteUrl}/og-image.jpg`
    }

    useHead({
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema)
      }]
    })
  }

  // Product schema for eSIM plans
  const addEsimProductSchema = (plan: EsimPlan) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${plan.provider} ${plan.country} eSIM - ${plan.dataAmount} for ${plan.duration} days`,
      description: `Prepaid eSIM data plan for ${plan.country}. ${plan.features.join('. ')}`,
      brand: {
        '@type': 'Brand',
        name: plan.provider
      },
      offers: {
        '@type': 'Offer',
        price: plan.price,
        priceCurrency: plan.currency,
        availability: 'https://schema.org/InStock',
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        seller: {
          '@type': 'Organization',
          name: plan.provider
        }
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.5,
        reviewCount: Math.floor(Math.random() * 1000) + 100
      }
    }

    useHead({
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema)
      }]
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
      name: `${country} eSIM Data Plans`,
      description: `Compare prepaid eSIM data plans for ${country}. Instant activation, no roaming fees.`,
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: minPrice,
        highPrice: maxPrice,
        priceCurrency: 'USD',
        offerCount: plans.length,
        offers: plans.map(plan => ({
          '@type': 'Offer',
          price: plan.price,
          priceCurrency: plan.currency,
          name: `${plan.dataAmount} for ${plan.duration} days`,
          seller: {
            '@type': 'Organization',
            name: plan.provider
          }
        }))
      }
    }

    useHead({
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema)
      }]
    })
  }

  // Service schema for remittance comparison
  const addRemittanceServiceSchema = () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'International Money Transfer Comparison',
      description: 'Compare live rates, fees and delivery speeds from 30+ licensed money transfer providers',
      provider: {
        '@type': 'Organization',
        name: siteName || 'Remit-Scout'
      },
      serviceType: 'Financial Comparison Service',
      areaServed: {
        '@type': 'GeoShape',
        name: 'Worldwide'
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Money Transfer Providers',
        itemListElement: [
          { '@type': 'Service', name: 'Bank Transfer' },
          { '@type': 'Service', name: 'Cash Pickup' },
          { '@type': 'Service', name: 'Mobile Wallet' }
        ]
      }
    }

    useHead({
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema)
      }]
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
    addRemittanceServiceSchema
  }
}













