import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const cwd = process.cwd()
const checks = []

const requireFile = (relativePath, message) => {
  const fullPath = join(cwd, relativePath)
  if (!existsSync(fullPath)) {
    checks.push(`Missing ${message}: ${relativePath}`)
    return null
  }
  return fullPath
}

const requireContent = (relativePath, pattern, message) => {
  const fullPath = requireFile(relativePath, message)
  if (!fullPath) return
  const content = readFileSync(fullPath, 'utf8')
  if (!pattern.test(content)) {
    checks.push(`${message}: ${relativePath}`)
  }
}

requireContent('public/_robots.txt', /Sitemap:/i, 'robots.txt missing sitemap entry')
requireContent('server/routes/sitemap.xml.ts', /getAllCorridorUrls/, 'sitemap missing corridor coverage')
requireContent('server/routes/sitemap.xml.ts', /PROVIDER_SCORES/, 'sitemap missing provider coverage')
requireContent('server/routes/sitemap.xml.ts', /pulseChartRegistry/, 'sitemap missing pulse chart coverage')
requireContent('composables/useSeo.ts', /rel:\s*['"]canonical['"]/, 'SEO helper missing canonical link')
requireContent('composables/useSeo.ts', /sanitizeCanonical/, 'SEO helper missing canonical sanitizer')

if (checks.length) {
  console.error('SEO checks failed:')
  for (const issue of checks) {
    console.error(`- ${issue}`)
  }
  process.exitCode = 1
} else {
  console.log('SEO checks passed.')
}
