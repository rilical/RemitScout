/**
 * XE discovery script.
 *
 * API-first approach:
 * - REST: hits launchpad-api.xe.com/v2/quotes to discover delivery methods
 *   and fees per corridor.
 * - XE returns individualQuotes[] with deliveryMethod and leadTime per quote.
 * - No Playwright needed — pure HTTP API calls.
 *
 * Entry URL: https://www.xe.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// XE supports these 10 source currencies
const SOURCE_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'JPY', 'CHF', 'SGD', 'HKD']

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: 'US', EUR: 'DE', GBP: 'GB', CAD: 'CA', AUD: 'AU',
  NZD: 'NZ', JPY: 'JP', CHF: 'CH', SGD: 'SG', HKD: 'HK',
}

// High-traffic destinations to probe
const PROBE_DESTINATIONS: Record<string, string> = {
  MX: 'MXN', PH: 'PHP', IN: 'INR', NG: 'NGN', PK: 'PKR',
  BD: 'BDT', LK: 'LKR', GH: 'GHS', KE: 'KES', VN: 'VND',
  TH: 'THB', CN: 'CNY', ID: 'IDR', MY: 'MYR', BR: 'BRL',
  CO: 'COP', PE: 'PEN', EG: 'EGP', MA: 'MAD', ZA: 'ZAR',
  TR: 'TRY', UA: 'UAH', JP: 'JPY', KR: 'KRW', NP: 'NPR',
}

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const COUNTRY_TO_CURRENCY_MAP: Record<string, string> = { ...PROBE_DESTINATIONS }
for (const [currency, country] of Object.entries(CURRENCY_TO_COUNTRY)) {
  if (!COUNTRY_TO_CURRENCY_MAP[country]) COUNTRY_TO_CURRENCY_MAP[country] = currency
}

export class XeDiscovery extends ProviderDiscovery {
  constructor() {
    super('xe', 'XE')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.xe.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    const countries = SOURCE_CURRENCIES
      .map((c) => CURRENCY_TO_COUNTRY[c])
      .filter((c): c is string => !!c)
    this.logger.info('xe_source_countries_discovered', { count: countries.length })
    return countries
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const destinations: string[] = []
    const srcCurrency = Object.entries(CURRENCY_TO_COUNTRY)
      .find(([, cc]) => cc === sourceCountry)?.[0] ?? 'USD'

    for (const [destCountry, destCurrency] of Object.entries(PROBE_DESTINATIONS)) {
      if (destCountry === sourceCountry) continue

      try {
        const resp = await fetch('https://launchpad-api.xe.com/v2/quotes', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'accept': '*/*',
            'user-agent': UA,
            'origin': 'https://www.xe.com',
            'referer': 'https://www.xe.com/',
          },
          body: JSON.stringify({
            sellCcy: srcCurrency,
            buyCcy: destCurrency,
            amount: 500,
            userCountry: sourceCountry,
            fixedCcy: srcCurrency,
            countryTo: destCountry,
          }),
        })

        if (resp.status === 429) {
          this.logger.warn('xe_rate_limited', { sourceCountry, destCountry })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as {
            quote?: { individualQuotes?: Array<{ rate?: number }> }
          }
          if ((data.quote?.individualQuotes ?? []).length > 0) {
            destinations.push(destCountry)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('xe_dest_countries_discovered', {
      sourceCountry,
      count: destinations.length,
    })
    return destinations
  }

  protected async discoverDeliveryMethods(
    _browser: DiscoveryBrowser,
    corridorId: string,
  ): Promise<DiscoveredDeliveryMethod[]> {
    const methods: DiscoveredDeliveryMethod[] = []
    const parts = corridorId.split('-')
    if (parts.length < 4) return methods
    const [srcCountry, destCountry, srcCurrency, destCurrency] = parts

    try {
      const resp = await fetch('https://launchpad-api.xe.com/v2/quotes', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'accept': '*/*',
          'user-agent': UA,
          'origin': 'https://www.xe.com',
          'referer': 'https://www.xe.com/',
        },
        body: JSON.stringify({
          sellCcy: srcCurrency,
          buyCcy: destCurrency,
          amount: 500,
          userCountry: srcCountry,
          fixedCcy: srcCurrency,
          countryTo: destCountry,
        }),
      })

      if (resp.status !== 200) return methods

      const data = await resp.json() as {
        quote?: {
          individualQuotes?: Array<{
            deliveryMethod?: string
          }>
        }
      }

      const seenMethods = new Set<string>()
      for (const q of data.quote?.individualQuotes ?? []) {
        const rawPayout = q.deliveryMethod ?? 'bank_deposit'
        if (seenMethods.has(rawPayout)) continue
        seenMethods.add(rawPayout)

        methods.push({
          corridorId,
          rawPayinLabel: 'bank_transfer',
          normalizedPayin: 'bank_transfer',
          rawPayoutLabel: rawPayout,
          normalizedPayout: this.normalizePayout(rawPayout),
          unmapped: false,
        })
      }
    } catch (err) {
      this.logger.warn('xe_method_discovery_error', {
        corridorId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    return methods
  }

  protected async detectPromotions(
    browser: DiscoveryBrowser,
  ): Promise<DiscoveredPromotion[]> {
    const promos: DiscoveredPromotion[] = []

    try {
      const content = await browser.content()
      const promoPatterns: Array<{ regex: RegExp; type: DiscoveredPromotionType }> = [
        { regex: /first\s+transfer\s+free/i, type: 'first_transfer' },
        { regex: /(?:no|zero)\s*(?:transfer\s+)?fee/i, type: 'zero_fee' },
        { regex: /fee[\s-]*free/i, type: 'zero_fee' },
        { regex: /(?:reduced?|discount)\s+fee/i, type: 'reduced_fee' },
        { regex: /refer\s+(?:a\s+)?friend/i, type: 'referral' },
      ]

      for (const { regex, type } of promoPatterns) {
        const match = regex.exec(content)
        if (match) {
          promos.push({
            type,
            corridorId: null,
            rawText: match[0],
            strikethroughDetected: false,
            originalValue: null,
            promoValue: null,
            expiresAt: null,
            bannerSelector: null,
          })
        }
      }
    } catch (err) {
      this.logger.warn('xe_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('xe_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayout(raw: string): string {
    const lower = raw.toLowerCase()
    if (/cash/i.test(lower)) return 'cash_pickup'
    if (/wallet|mobile/i.test(lower)) return 'mobile_wallet'
    return 'bank_deposit'
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_TO_CURRENCY_MAP[countryCode] ?? null
  }
}
