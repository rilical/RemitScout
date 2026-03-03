import { defineEventHandler, setHeader } from 'h3'

const toEnvName = () => {
  const raw = (process.env.ENVIRONMENT || process.env.NODE_ENV || '').toLowerCase().trim()
  if (raw === 'prod') return 'production'
  if (raw === 'dev') return 'development'
  return raw || 'development'
}

const isProductionEnv = () => {
  const env = toEnvName()
  return env === 'production'
}

export const buildRobots = (siteUrl: string, envName: string) => {
  // Hard block non-prod so staging/dev never end up indexed.
  if (envName !== 'production') {
    return [
      '# Remit-Scout robots.txt',
      `# env=${envName}`,
      'User-agent: *',
      'Disallow: /',
      '',
    ].join('\n')
  }

  // Prod: allow indexing, but block internal/sensitive surfaces.
  // Keep this intentionally simple; we can tighten it later if a crawler misbehaves.
  const cleanUrl = siteUrl.replace(/\/$/, '')

  return [
    '# Remit-Scout robots.txt',
    '',
    '# AI Crawlers — explicitly welcome',
    'User-agent: GPTBot',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /admin/',
    'Disallow: /dashboard/',
    'Disallow: /auth/',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /admin/',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /admin/',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    'User-agent: Applebot-Extended',
    'Allow: /',
    '',
    '# Default catch-all',
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /api/health',
    'Disallow: /_nuxt/',
    'Disallow: /admin/',
    'Disallow: /dashboard/',
    'Disallow: /preview/',
    'Disallow: /embed/',
    'Disallow: /go/',
    'Disallow: /auth/',
    'Disallow: /sign-in',
    'Disallow: /sign-up',
    'Disallow: /reset-password',
    'Disallow: /forgot-password',
    'Allow: /google*.html',
    'Allow: /.well-known/',
    'Allow: /.well-known/security.txt',
    '',
    `Sitemap: ${cleanUrl}/sitemap.xml`,
    '# LLM-readable site map',
    `# See: ${cleanUrl}/llms.txt`,
    '',
  ].join('\n')
}

export default defineEventHandler((event) => {
  const runtimeConfig = useRuntimeConfig()
  const envName = isProductionEnv() ? 'production' : toEnvName()
  const siteUrl = runtimeConfig.public.siteUrl || 'https://remitscout.com'

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', envName === 'production' ? 'public, max-age=86400, s-maxage=86400' : 'no-store')

  return buildRobots(siteUrl, envName)
})
