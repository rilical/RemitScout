import { defineEventHandler, setHeader } from 'h3'
import { getAllCorridorUrls } from '~/utils/country-slugs'
import { PROVIDER_SCORES } from '~/lib/providerScores'
import { pulseChartRegistry } from '~/lib/pulseChartRegistry'
import { LEARN_GUIDE_SLUGS, EXCHANGE_RATE_PAIR_SLUGS, PROVIDER_COMPARISONS } from '~/server/utils/seo-constants'

const today = new Date().toISOString().split('T')[0]

const sitePath = (path: string) => path.startsWith('/') ? path : `/${path}`

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
  const providerComparisons = PROVIDER_COMPARISONS.map(slug => ({ path: `/compare/${slug}`, priority: '0.8', changefreq: 'weekly' }))

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
