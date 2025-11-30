import { defineEventHandler, setHeader } from 'h3'
import { getAllCorridorUrls } from '~/utils/country-slugs'

const today = new Date().toISOString().split('T')[0]

const sitePath = (path: string) => path.startsWith('/') ? path : `/${path}`

const urlEntry = (siteUrl: string, path: string, changefreq = 'weekly', priority = '0.5') => {
  return `
  <url>
    <loc>${siteUrl}${sitePath(path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

export default defineEventHandler((event) => {
  const { public: { siteUrl } } = useRuntimeConfig()

  const staticPages = [
    '/',
    '/about',
    '/contact',
    '/faq',
    '/legal/disclosure',
    '/legal/privacy',
    '/legal/terms',
    '/how-we-make-money',
    '/affiliate-partnerships',
    '/methodology',
    '/esim',
    '/learn',
    '/providers',
    '/reviews',
    '/send-money',
  ]

  const learnArticles = [
    'how-exchange-rates-work',
    'hidden-fees-money-transfers',
    'best-time-to-send-money',
    'best-ways-send-money-philippines',
    'wise-vs-remitly-vs-worldremit',
    'avoid-hidden-fees',
    'cash-pickup-vs-bank-deposit',
    'send-money-us-to-india-guide',
    'wise-remitly-western-union-review',
    'travel-insurance',
    'international-esim-checklist',
    'usd-php-exchange-rate-guide',
  ].map(slug => `/learn/${slug}`)

  const providerReviews = [
    'wise',
    'western-union',
    'remitly',
    'worldremit',
    'moneygram',
    'xoom',
  ].flatMap(slug => [`/providers/${slug}`, `/reviews/${slug}`])

  const providerComparisons = [
    'wise-vs-remitly',
    'wise-vs-western-union',
    'wise-vs-xoom',
    'remitly-vs-western-union',
  ].map(slug => `/compare/${slug}`)

  // Use full-name corridor slugs for SEO
  const corridorPages = getAllCorridorUrls()

  const countryPages = ['ph', 'in', 'mx', 'ng', 'pk'].map(slug => `/country/${slug}`)

  const allPaths = [
    ...staticPages,
    ...learnArticles,
    ...providerReviews,
    ...providerComparisons,
    ...corridorPages,
    ...countryPages,
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPaths.map(path => urlEntry(siteUrl, path)).join('\n')}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml')
  return body
})
