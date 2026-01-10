import { defineEventHandler, setHeader } from 'h3'
import { getAllCorridorUrls } from '~/utils/country-slugs'
import { PROVIDER_SCORES } from '~/lib/providerScores'
import { pulseChartRegistry } from '~/lib/pulseChartRegistry'

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

export default defineEventHandler((event) => {
  const { public: { siteUrl } } = useRuntimeConfig()
  const learnPageModules = import.meta.glob('~/pages/learn/*.vue')

  const unique = <T>(values: T[]) => Array.from(new Set(values))
  const slugFromPath = (path: string) => path.split('/').pop()?.replace('.vue', '')

  // Homepage - highest priority, updates daily
  const homepage = { path: '/', priority: '1.0', changefreq: 'daily' }

  // High-priority static pages
  const highPriorityPages = [
    { path: '/send-money', priority: '0.9', changefreq: 'daily' },
    { path: '/learn/providers', priority: '0.9', changefreq: 'weekly' },
    { path: '/reviews', priority: '0.8', changefreq: 'weekly' },
    { path: '/pulse', priority: '0.8', changefreq: 'daily' },
    { path: '/learn', priority: '0.8', changefreq: 'weekly' },
  ]

  // Important static pages
  const importantPages = [
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/faq', priority: '0.7', changefreq: 'monthly' },
    { path: '/methodology', priority: '0.7', changefreq: 'monthly' },
    { path: '/how-we-make-money', priority: '0.7', changefreq: 'monthly' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
    { path: '/media-kit', priority: '0.6', changefreq: 'monthly' },
    { path: '/partnerships', priority: '0.6', changefreq: 'monthly' },
  ]

  // Legal pages
  const legalPages = [
    { path: '/affiliate-disclosure', priority: '0.5', changefreq: 'yearly' },
    { path: '/corrections', priority: '0.5', changefreq: 'monthly' },
    { path: '/legal/disclosure', priority: '0.5', changefreq: 'yearly' },
    { path: '/legal/privacy', priority: '0.5', changefreq: 'yearly' },
    { path: '/legal/terms', priority: '0.5', changefreq: 'yearly' },
  ]

  // Learn guides - include all top-level /learn pages (exclude index + dynamic)
  const learnGuides = Object.keys(learnPageModules)
    .map(slugFromPath)
    .filter((slug): slug is string => Boolean(slug))
    .filter(slug => slug !== 'index' && slug !== 'providers' && !slug.startsWith('['))
    .map(slug => ({ path: `/learn/${slug}`, priority: '0.7', changefreq: 'monthly' }))

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
  const providerReviewAliases = providerSlugs.map(slug => ({
    path: `/reviews/${slug}`,
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
    ...providerReviews,
    ...providerReviewAliases,
    ...providerComparisons,
    ...corridorPages,
    ...countryPages,
    ...pulseCharts,
  ]

  // Check if we need to split into multiple sitemaps (>50,000 URLs)
  const maxUrlsPerSitemap = parseInt(process.env.SITEMAP_MAX_URLS || '50000', 10)
  
  if (allPages.length > maxUrlsPerSitemap) {
    // For now, we'll keep it simple but this is future-proofed
    // In the future, we can split into sitemap-index.xml
    console.warn(`Sitemap has ${allPages.length} URLs. Consider splitting if it exceeds ${maxUrlsPerSitemap}.`)
  }

  // Generate XML
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages.map(page => urlEntry(siteUrl, page.path, page.changefreq, page.priority)).join('\n')}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml')
  setHeader(event, 'Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  return body
})
