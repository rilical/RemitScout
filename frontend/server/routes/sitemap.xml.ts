import { defineEventHandler, setHeader } from 'h3'
import { getAllCorridorUrls } from '~/utils/country-slugs'
import { PROVIDER_SCORES } from '~/lib/providerScores'
import { pulseChartRegistry } from '~/lib/pulseChartRegistry'

const today = new Date().toISOString().split('T')[0]

const sitePath = (path: string) => path.startsWith('/') ? path : `/${path}`

// NOTE:
// This route is bundled by Nitro (Rollup), which cannot import/parse `.vue` SFCs.
// Avoid `import.meta.glob('~/pages/learn/*.vue')` here, or the production build fails.
// If you add/remove top-level learn guide pages under `frontend/pages/learn/*.vue`,
// update this list accordingly.
const LEARN_GUIDE_SLUGS = [
  'bank-transfer-vs-card-funding',
  'bank-transfer-vs-card-vs-cash-pickup',
  'best-time-to-send-money',
  'choose-right-delivery-method',
  'embed-remit-scout-on-your-site',
  'hidden-exchange-rate-fees-explained',
  'how-exchange-rates-work',
  'how-fast-is-international-money-transfer',
  'how-remit-score-works',
  'how-to-read-remittance-quote',
  'money-transfer',
  'promo-codes-intro-rates',
  'why-checkout-price-differs',
  'why-compare-before-every-transfer',
] as const

// Exchange rate pairs - keep in sync with the curated list on `/exchange-rates`.
const EXCHANGE_RATE_PAIR_SLUGS = [
  'usd-inr',
  'usd-php',
  'usd-mxn',
  'usd-ngn',
  'gbp-inr',
  'gbp-ngn',
  'gbp-pkr',
  'gbp-usd',
  'cad-inr',
  'cad-php',
  'cad-ngn',
  'cad-usd',
  'eur-usd',
  'eur-inr',
  'eur-gbp',
  'eur-ngn',
] as const

const urlEntry = (siteUrl: string, path: string, changefreq = 'weekly', priority = '0.5', lastmod?: string) => {
  const lastmodDate = lastmod || today
  return `
  <url>
    <loc>${siteUrl}${sitePath(path)}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

export const buildSitemapXml = (siteUrl: string) => {
  const normalizedSiteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl

  const unique = <T>(values: T[]) => Array.from(new Set(values))

  // Homepage - highest priority, updates daily
  const homepage = { path: '/', priority: '1.0', changefreq: 'daily' }

  // High-priority static pages
  const highPriorityPages = [
    { path: '/send-money', priority: '0.9', changefreq: 'daily' },
    { path: '/exchange-rates', priority: '0.9', changefreq: 'daily' },
    { path: '/learn/providers', priority: '0.9', changefreq: 'weekly' },
    { path: '/corridors', priority: '0.8', changefreq: 'weekly' },
    { path: '/pulse', priority: '0.8', changefreq: 'daily' },
    { path: '/learn', priority: '0.8', changefreq: 'weekly' },
  ]

  // Important static pages
  const importantPages = [
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/plus', priority: '0.7', changefreq: 'monthly' },
    { path: '/faq', priority: '0.7', changefreq: 'monthly' },
    { path: '/methodology', priority: '0.7', changefreq: 'monthly' },
    { path: '/indices-methodology', priority: '0.7', changefreq: 'monthly' },
    { path: '/research', priority: '0.6', changefreq: 'monthly' },
    { path: '/learn/all', priority: '0.6', changefreq: 'monthly' },
    { path: '/legal', priority: '0.5', changefreq: 'monthly' },
    // Canonical legal route (legacy /how-we-make-money redirects here).
    { path: '/legal/how-we-make-money', priority: '0.7', changefreq: 'monthly' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
    { path: '/media-kit', priority: '0.6', changefreq: 'monthly' },
    { path: '/partnerships', priority: '0.6', changefreq: 'monthly' },
  ]

  // Legal pages
  const legalPages = [
    // NOTE: Do not include redirect-only legacy routes in the sitemap.
    { path: '/corrections', priority: '0.5', changefreq: 'monthly' },
    { path: '/legal/disclosure', priority: '0.5', changefreq: 'monthly' },
    { path: '/legal/privacy', priority: '0.5', changefreq: 'monthly' },
    { path: '/legal/terms', priority: '0.5', changefreq: 'monthly' },
    { path: '/cookies', priority: '0.5', changefreq: 'monthly' },
  ]

  // Learn guides - top-level /learn pages (excluding index/providers/dynamic).
  const learnGuides = LEARN_GUIDE_SLUGS.map(slug => ({
    path: `/learn/${slug}`,
    priority: '0.7',
    changefreq: 'weekly' as const,
  }))

  const exchangeRatePairs = EXCHANGE_RATE_PAIR_SLUGS.map(slug => ({
    path: `/exchange-rates/${slug}`,
    priority: '0.8',
    changefreq: 'daily' as const,
  }))

  // Provider reviews - generated from provider scores
  const providerSlugs = unique(
    Object.values(PROVIDER_SCORES)
      .map(provider => provider.slug)
      .filter(Boolean),
  )
  const providerReviews = providerSlugs.map(slug => ({
    path: `/learn/providers/${slug}`,
    priority: '0.8',
    changefreq: 'weekly' as const,
  }))

  // Provider comparisons - high priority
  const providerComparisons = [
    'wise-vs-remitly',
    'wise-vs-western-union',
    'wise-vs-xoom',
    'remitly-vs-western-union',
  ].map(slug => ({ path: `/compare/${slug}`, priority: '0.8', changefreq: 'weekly' }))

  // Popular corridors - high priority, daily updates for rate changes
  const corridorPages = getAllCorridorUrls().map(path => ({
    path,
    priority: '0.9',
    changefreq: 'daily' as const,
  }))

  const pulseCharts = pulseChartRegistry.map(chart => ({
    path: `/pulse/charts/${chart.id}`,
    priority: '0.6',
    changefreq: 'daily' as const,
  }))

  // Country pages - medium priority
  const countryPages = ['ph', 'in', 'mx', 'ng', 'pk'].map(slug => ({
    path: `/country/${slug}`,
    priority: '0.7',
    changefreq: 'weekly' as const,
  }))

  // Combine all pages
  const allPages = [
    homepage,
    ...highPriorityPages,
    ...importantPages,
    ...legalPages,
    ...learnGuides,
    ...exchangeRatePairs,
    ...providerReviews,
    ...providerComparisons,
    ...corridorPages,
    ...countryPages,
    ...pulseCharts,
  ]

  // Check if we need to split into multiple sitemaps (>50,000 URLs)
  const maxUrlsPerSitemap = Number.parseInt(process.env.SITEMAP_MAX_URLS || '50000', 10)

  if (allPages.length > maxUrlsPerSitemap) {
    // For now, keep it simple but this is future-proofed.
    // In the future, we can split into sitemap-index.xml.
  }

  // Generate XML
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages.map(page => urlEntry(normalizedSiteUrl, page.path, page.changefreq, page.priority)).join('\n')}
</urlset>`

  return body
}

export default defineEventHandler((event) => {
  const { public: { siteUrl } } = useRuntimeConfig()
  const body = buildSitemapXml(siteUrl)

  setHeader(event, 'Content-Type', 'application/xml')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200')
  return body
})
