/**
 * robots.txt compliance checker for polite web discovery.
 *
 * Before scraping any provider page, this module fetches and parses
 * the provider's robots.txt to honour Disallow directives and
 * Crawl-delay values. Results are cached per-provider for the
 * duration of a discovery scan.
 */

import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.discovery.robots-checker')

// ── Types ────────────────────────────────────────────────────────────

type RobotsRule = {
  path: string
  allowed: boolean
}

export type RobotsResult = {
  rules: RobotsRule[]
  crawlDelaySeconds: number | null
  sitemapUrls: string[]
  fetchedAt: number
}

const CACHE_TTL_MS = 3_600_000 // 1 hour

// ── In-memory cache ──────────────────────────────────────────────────

const cache = new Map<string, RobotsResult>()

/**
 * Clear the robots.txt cache (useful between scan runs).
 */
export function clearRobotsCache(): void {
  cache.clear()
}

// ── Parser ───────────────────────────────────────────────────────────

const OUR_USER_AGENT = 'remit-scout-research'

function parseRobotsTxt(body: string): RobotsResult {
  const lines = body.split('\n').map(l => l.trim())
  const rules: RobotsRule[] = []
  const sitemapUrls: string[] = []
  let crawlDelaySeconds: number | null = null
  let inOurBlock = false
  let inWildcardBlock = false
  let seenSpecificBlock = false

  for (const raw of lines) {
    // Strip comments
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue

    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const directive = line.slice(0, colonIdx).trim().toLowerCase()
    const value = line.slice(colonIdx + 1).trim()

    if (directive === 'user-agent') {
      const ua = value.toLowerCase()
      if (ua === OUR_USER_AGENT || ua === 'remit-scout-research/1.0') {
        inOurBlock = true
        inWildcardBlock = false
        seenSpecificBlock = true
      } else if (ua === '*' && !seenSpecificBlock) {
        inWildcardBlock = true
        inOurBlock = false
      } else {
        inOurBlock = false
        inWildcardBlock = false
      }
      continue
    }

    const active = inOurBlock || inWildcardBlock

    if (directive === 'disallow' && active && value) {
      rules.push({ path: value, allowed: false })
    } else if (directive === 'allow' && active && value) {
      rules.push({ path: value, allowed: true })
    } else if (directive === 'crawl-delay' && active) {
      const parsed = Number(value)
      if (Number.isFinite(parsed) && parsed > 0) {
        crawlDelaySeconds = parsed
      }
    } else if (directive === 'sitemap') {
      sitemapUrls.push(value)
    }
  }

  return { rules, crawlDelaySeconds, sitemapUrls, fetchedAt: Date.now() }
}

// ── Path matching ────────────────────────────────────────────────────

function pathMatchesRule(path: string, rulePath: string): boolean {
  // robots.txt uses prefix matching with optional * wildcards and $ anchor
  if (rulePath.endsWith('$')) {
    const prefix = rulePath.slice(0, -1)
    return path === prefix
  }
  if (rulePath.includes('*')) {
    const regex = new RegExp(
      '^' + rulePath.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*'),
    )
    return regex.test(path)
  }
  return path.startsWith(rulePath)
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Fetch and cache robots.txt for a provider domain.
 * Returns parsed rules + crawl delay.
 */
export async function fetchRobotsTxt(baseUrl: string): Promise<RobotsResult> {
  const origin = new URL(baseUrl).origin
  const cacheKey = origin

  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached
  }

  try {
    const robotsUrl = `${origin}/robots.txt`
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      // No robots.txt or error — assume everything allowed
      logger.info('robots_txt_not_found', { origin, status: response.status })
      const result: RobotsResult = {
        rules: [],
        crawlDelaySeconds: null,
        sitemapUrls: [],
        fetchedAt: Date.now(),
      }
      cache.set(cacheKey, result)
      return result
    }

    const body = await response.text()
    const result = parseRobotsTxt(body)
    cache.set(cacheKey, result)

    logger.info('robots_txt_parsed', {
      origin,
      ruleCount: result.rules.length,
      crawlDelaySeconds: result.crawlDelaySeconds,
    })

    return result
  } catch (err) {
    logger.warn('robots_txt_fetch_error', {
      origin,
      error: err instanceof Error ? err.message : String(err),
    })
    // On error, assume everything allowed but don't cache
    return {
      rules: [],
      crawlDelaySeconds: null,
      sitemapUrls: [],
      fetchedAt: Date.now(),
    }
  }
}

/**
 * Check whether a specific URL path is allowed by robots.txt rules.
 *
 * Follows standard precedence: longer path matches win, then Allow > Disallow.
 */
export function isPathAllowed(robots: RobotsResult, urlPath: string): boolean {
  if (robots.rules.length === 0) return true

  let bestMatch: RobotsRule | null = null
  let bestLength = -1

  for (const rule of robots.rules) {
    if (pathMatchesRule(urlPath, rule.path)) {
      if (rule.path.length > bestLength) {
        bestLength = rule.path.length
        bestMatch = rule
      } else if (rule.path.length === bestLength && rule.allowed) {
        // Allow wins on tie
        bestMatch = rule
      }
    }
  }

  return bestMatch === null || bestMatch.allowed
}

/**
 * Get the crawl delay in milliseconds for a provider domain.
 * Returns 0 if no Crawl-delay directive exists.
 */
export function getCrawlDelayMs(robots: RobotsResult): number {
  if (robots.crawlDelaySeconds === null) return 0
  return Math.ceil(robots.crawlDelaySeconds * 1000)
}
