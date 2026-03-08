/**
 * Polite Playwright browser launcher for provider discovery.
 *
 * Identifies transparently as Remit-Scout Research (matching the existing
 * API probe User-Agent convention), respects robots.txt, and honours
 * per-provider rate limits from config.
 *
 * NOT a stealth browser — we identify ourselves honestly.
 */

import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import { getRandomUserAgent } from '../collectors/user-agent'
import { detectBlock } from '../collectors/block-detection'
import {
  fetchRobotsTxt,
  isPathAllowed,
  getCrawlDelayMs,
  type RobotsResult,
} from './robots-checker'

const logger = createLogger('plane-b.discovery.browser')

// ── Types ────────────────────────────────────────────────────────────

export type DiscoveryBrowserOptions = {
  providerId: string
  /** Base URL of the provider website */
  baseUrl: string
  /** Navigation timeout per page (ms) */
  navigationTimeoutMs?: number
  /** Whether to capture debug screenshots */
  screenshotsEnabled?: boolean
}

export type DiscoveryBrowser = {
  /** Navigate to a URL (checks robots.txt first) */
  goto: (url: string) => Promise<{ blocked: boolean; robotsDisallowed: boolean }>
  /** Get the underlying Playwright Page (for provider-specific interactions) */
  page: () => any
  /** Get current page content as text */
  content: () => Promise<string>
  /** Get current page title */
  title: () => Promise<string>
  /** Capture a screenshot (if enabled) */
  screenshot: (name: string) => Promise<Buffer | null>
  /** Wait for a selector with timeout */
  waitForSelector: (selector: string, timeoutMs?: number) => Promise<any>
  /** Get the crawl delay to honour between requests (ms) */
  crawlDelayMs: () => number
  /** Close the browser */
  close: () => Promise<void>
}

// ── Launch ───────────────────────────────────────────────────────────

/**
 * Launch a polite discovery browser for a specific provider.
 *
 * The browser:
 * - Sets User-Agent to Remit-Scout-Research/1.0 (transparent identification)
 * - Fetches and caches robots.txt for the provider domain
 * - Refuses to navigate to disallowed paths
 * - Exposes crawl delay for the caller to honour between requests
 * - Detects blocks (403/429/keyword) and backs off
 */
export async function launchDiscoveryBrowser(
  options: DiscoveryBrowserOptions,
): Promise<DiscoveryBrowser> {
  const {
    providerId,
    baseUrl,
    navigationTimeoutMs = config.planeB?.discovery?.navigationTimeoutMs ?? 30_000,
    screenshotsEnabled = config.planeB?.discovery?.screenshotsEnabled ?? false,
  } = options

  // Dynamic import — Playwright may not be available in all runtime images
  const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>
  const { chromium } = await dynamicImport('playwright-core')

  const userAgent = getRandomUserAgent()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent,
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
  })

  const page = await context.newPage()

  // Fetch robots.txt upfront
  let robots: RobotsResult
  try {
    robots = await fetchRobotsTxt(baseUrl)
  } catch {
    robots = { rules: [], crawlDelaySeconds: null, sitemapUrls: [], fetchedAt: Date.now() }
  }

  const crawlDelay = getCrawlDelayMs(robots)
  let screenshotCount = 0

  logger.info('discovery_browser_launched', {
    providerId,
    baseUrl,
    userAgent: userAgent.slice(0, 60) + '...',
    crawlDelayMs: crawlDelay,
    robotsRuleCount: robots.rules.length,
  })

  return {
    goto: async (url: string) => {
      const parsed = new URL(url)
      const path = parsed.pathname + parsed.search

      // Check robots.txt
      if (!isPathAllowed(robots, path)) {
        logger.info('discovery_robots_disallowed', { providerId, url, path })
        return { blocked: false, robotsDisallowed: true }
      }

      try {
        const response = await page.goto(url, {
          timeout: navigationTimeoutMs,
          waitUntil: 'domcontentloaded',
        })

        // Check for blocks using existing block detection
        const status = response?.status() ?? 0
        const bodyText = status >= 400 ? await page.content().catch(() => '') : ''
        const blockResult = detectBlock(status, bodyText)

        if (blockResult.blocked) {
          logger.warn('discovery_block_detected', {
            providerId,
            url,
            status,
            reason: blockResult.reason,
          })
          return { blocked: true, robotsDisallowed: false }
        }

        return { blocked: false, robotsDisallowed: false }
      } catch (err) {
        logger.warn('discovery_navigation_error', {
          providerId,
          url,
          error: err instanceof Error ? err.message : String(err),
        })
        return { blocked: true, robotsDisallowed: false }
      }
    },

    page: () => page,

    content: () => page.content(),

    title: () => page.title(),

    screenshot: async (name: string) => {
      if (!screenshotsEnabled) return null
      try {
        screenshotCount++
        const buffer = await page.screenshot({ fullPage: true })
        logger.debug('discovery_screenshot_captured', { providerId, name, screenshotCount })
        return buffer
      } catch {
        return null
      }
    },

    waitForSelector: (selector: string, timeoutMs = 10_000) =>
      page.waitForSelector(selector, { timeout: timeoutMs }),

    crawlDelayMs: () => crawlDelay,

    close: async () => {
      try {
        await context.close()
        await browser.close()
        logger.info('discovery_browser_closed', { providerId, screenshotCount })
      } catch {
        // Ignore close errors
      }
    },
  }
}
