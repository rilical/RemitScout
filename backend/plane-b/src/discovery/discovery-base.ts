/**
 * Abstract base class for provider discovery scripts.
 *
 * Each provider implements four abstract methods to discover corridors,
 * delivery methods, and promotions from their website. The base class
 * orchestrates the discovery flow, manages the browser lifecycle, and
 * assembles the final DiscoveryResult.
 *
 * Follows the polite scraping policy: transparent Remit-Scout-Research
 * User-Agent, robots.txt compliance, rate-limit adherence.
 */

import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import { launchDiscoveryBrowser, type DiscoveryBrowser } from './discovery-browser'
import type {
  DiscoveryResult,
  DiscoveryRunOptions,
  DiscoveredCorridor,
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveryError,
} from './discovery-types'

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export abstract class ProviderDiscovery {
  protected readonly providerId: string
  protected readonly displayName: string
  protected readonly logger: ReturnType<typeof createLogger>
  protected browser: DiscoveryBrowser | null = null
  /** Cache for currencies discovered at runtime (populated by provider scripts) */
  protected discoveredCurrencies: Record<string, string> = {}

  constructor(providerId: string, displayName: string) {
    this.providerId = providerId
    this.displayName = displayName
    this.logger = createLogger(`plane-b.discovery.${providerId}`)
  }

  /**
   * Provider entry URL. Override if the provider's send-money page
   * is at a non-standard path.
   */
  protected get entryUrl(): string {
    const urls = config.planeB?.discovery?.providerUrls as Record<string, string> | undefined
    return urls?.[this.providerId] ?? `https://www.${this.providerId}.com`
  }

  // ── Abstract methods (provider-specific) ─────────────────────────

  /**
   * Discover all source countries this provider supports.
   * Typically scrapes a country dropdown on the send-money page.
   */
  protected abstract discoverSourceCountries(
    browser: DiscoveryBrowser,
  ): Promise<string[]>

  /**
   * Given a source country, discover all destination countries available.
   */
  protected abstract discoverDestinationCountries(
    browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]>

  /**
   * Discover payin/payout delivery methods for a specific corridor.
   */
  protected abstract discoverDeliveryMethods(
    browser: DiscoveryBrowser,
    corridorId: string,
  ): Promise<DiscoveredDeliveryMethod[]>

  /**
   * Detect promotional pricing on the current page or globally.
   */
  protected abstract detectPromotions(
    browser: DiscoveryBrowser,
  ): Promise<DiscoveredPromotion[]>

  /**
   * Return the currency code for a given country code.
   * Override in providers that maintain a COUNTRY_CURRENCY map.
   * Returns null if unknown (corridor will be skipped for delivery method probing).
   */
  protected getCurrency(countryCode: string): string | null {
    return this.discoveredCurrencies[countryCode] ?? null
  }

  // ── Template method ──────────────────────────────────────────────

  /**
   * Run the full discovery flow for this provider.
   *
   * 1. Launch polite browser (Remit-Scout UA, robots.txt check)
   * 2. Navigate to provider's send-money page
   * 3. Discover source countries
   * 4. For each source country, discover destination countries
   * 5. For a sample of corridors, discover delivery methods
   * 6. Detect promotions
   * 7. Close browser
   * 8. Return DiscoveryResult
   */
  async run(_pool: Pool, options: DiscoveryRunOptions): Promise<DiscoveryResult> {
    const startedAt = new Date().toISOString()
    const startMs = Date.now()
    const errors: DiscoveryError[] = []
    const corridors: DiscoveredCorridor[] = []
    const deliveryMethods: DiscoveredDeliveryMethod[] = []
    const promotions: DiscoveredPromotion[] = []
    let pagesVisited = 0
    let screenshotCount = 0

    const maxCorridors = options.maxCorridors
      ?? config.planeB?.discovery?.maxCorridorsPerProvider
      ?? 500

    try {
      // 1. Launch browser
      this.browser = await launchDiscoveryBrowser({
        providerId: this.providerId,
        baseUrl: this.entryUrl,
        navigationTimeoutMs: options.navigationTimeoutMs,
        screenshotsEnabled: options.screenshotsEnabled,
      })

      // 2. Navigate to entry page
      const entryResult = await this.browser.goto(this.entryUrl)
      pagesVisited++

      if (entryResult.robotsDisallowed) {
        this.logger.warn('discovery_entry_robots_disallowed', { url: this.entryUrl })
        errors.push({
          step: 'entry_navigation',
          selector: null,
          message: `robots.txt disallows ${this.entryUrl}`,
          screenshot: null,
          recoverable: false,
        })
        return this.buildResult(startedAt, startMs, corridors, deliveryMethods, promotions, errors, pagesVisited, screenshotCount)
      }

      if (entryResult.blocked) {
        this.logger.warn('discovery_entry_blocked', { url: this.entryUrl })
        errors.push({
          step: 'entry_navigation',
          selector: null,
          message: 'Provider blocked access to entry page',
          screenshot: null,
          recoverable: false,
        })
        return this.buildResult(startedAt, startMs, corridors, deliveryMethods, promotions, errors, pagesVisited, screenshotCount)
      }

      // 3. Discover source countries
      let sourceCountries: string[] = []
      try {
        sourceCountries = await this.discoverSourceCountries(this.browser)
        this.logger.info('discovery_source_countries', {
          providerId: this.providerId,
          count: sourceCountries.length,
        })
      } catch (err) {
        errors.push({
          step: 'discover_source_countries',
          selector: null,
          message: err instanceof Error ? err.message : String(err),
          screenshot: null,
          recoverable: true,
        })
      }

      // 4. For each source country, discover destinations
      let corridorCount = 0
      for (const sourceCountry of sourceCountries) {
        if (corridorCount >= maxCorridors) break

        try {
          // Honour crawl delay between navigations
          const delay = this.browser.crawlDelayMs()
          if (delay > 0) await sleep(delay)

          const destCountries = await this.discoverDestinationCountries(this.browser, sourceCountry)
          pagesVisited++

          for (const destCountry of destCountries) {
            if (corridorCount >= maxCorridors) break

            const srcCurrency = this.getCurrency(sourceCountry) ?? ''
            const destCurrency = this.getCurrency(destCountry) ?? ''
            const corridorId = srcCurrency && destCurrency
              ? `${sourceCountry}-${destCountry}-${srcCurrency}-${destCurrency}`
              : ''

            corridors.push({
              sourceCountry,
              destinationCountry: destCountry,
              sourceCurrency: srcCurrency,
              destinationCurrency: destCurrency,
              corridorId,
              payinMethods: [],
              payoutMethods: [],
            })
            corridorCount++
          }
        } catch (err) {
          errors.push({
            step: `discover_destinations_${sourceCountry}`,
            selector: null,
            message: err instanceof Error ? err.message : String(err),
            screenshot: null,
            recoverable: true,
          })
        }
      }

      // 5. Discover delivery methods for a sample of corridors
      const sampleSize = Math.min(corridors.length, 20) // Sample up to 20 corridors
      const sampleCorridors = corridors.slice(0, sampleSize)

      for (const corridor of sampleCorridors) {
        if (!corridor.corridorId) continue
        try {
          const delay = this.browser.crawlDelayMs()
          if (delay > 0) await sleep(delay)

          const methods = await this.discoverDeliveryMethods(this.browser, corridor.corridorId)
          deliveryMethods.push(...methods)
          pagesVisited++
        } catch (err) {
          errors.push({
            step: `discover_methods_${corridor.corridorId}`,
            selector: null,
            message: err instanceof Error ? err.message : String(err),
            screenshot: null,
            recoverable: true,
          })
        }
      }

      // 6. Detect promotions
      try {
        const promos = await this.detectPromotions(this.browser)
        promotions.push(...promos)
      } catch (err) {
        errors.push({
          step: 'detect_promotions',
          selector: null,
          message: err instanceof Error ? err.message : String(err),
          screenshot: null,
          recoverable: true,
        })
      }
    } catch (err) {
      errors.push({
        step: 'discovery_run',
        selector: null,
        message: err instanceof Error ? err.message : String(err),
        screenshot: null,
        recoverable: false,
      })
    } finally {
      // 7. Close browser
      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }
    }

    // 8. Return result
    return this.buildResult(
      startedAt, startMs, corridors, deliveryMethods,
      promotions, errors, pagesVisited, screenshotCount,
    )
  }

  private buildResult(
    startedAt: string,
    startMs: number,
    corridors: DiscoveredCorridor[],
    deliveryMethods: DiscoveredDeliveryMethod[],
    promotions: DiscoveredPromotion[],
    errors: DiscoveryError[],
    pagesVisited: number,
    screenshotCount: number,
  ): DiscoveryResult {
    return {
      providerId: this.providerId,
      scannedAt: startedAt,
      corridors,
      deliveryMethods,
      promotions,
      errors,
      metadata: {
        durationMs: Date.now() - startMs,
        pagesVisited,
        screenshotCount,
        sessionReused: false,
        robotsTxtHonored: true,
      },
    }
  }
}
