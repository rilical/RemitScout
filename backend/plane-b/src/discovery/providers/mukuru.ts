/**
 * Mukuru discovery script.
 *
 * Simplified approach:
 * - GET: https://mobile.mukuru.com/pricechecker/get_products?from_country={src}&to_country={dest}
 *   is attempted first. If it responds without requiring auth, the corridor is confirmed
 *   and product titles are parsed to infer delivery methods.
 * - If the products endpoint returns 401/403, the static PROBE_DESTINATIONS list is used
 *   as a fallback (known from rights matrix).
 * - Product titles containing "cash" → cash_pickup, "bank" → bank_deposit,
 *   "wallet" / "m-pesa" / "airtime" → mobile_wallet.
 * - 11 source countries (Sub-Saharan Africa + US/GB).
 *
 * Entry URL: https://mobile.mukuru.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

const SOURCE_COUNTRIES = [
  'US', 'GB', 'ZA', 'BW', 'KE', 'LS', 'MW', 'RW', 'UG', 'ZM', 'ZW',
]

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', ZA: 'ZAR', BW: 'BWP', KE: 'KES', LS: 'LSL',
  MW: 'MWK', RW: 'RWF', UG: 'UGX', ZM: 'ZMW', ZW: 'USD',
  AO: 'AOA', IN: 'INR', MZ: 'MZN', NA: 'NAD', NG: 'NGN', SZ: 'SZL',
  TZ: 'TZS', CD: 'CDF', GH: 'GHS', ET: 'ETB', CM: 'XAF',
}

// Mukuru internal source-country codes (ISO2 → Mukuru code)
const MUKURU_SOURCE_CODE: Record<string, string> = {
  US: 'AA', GB: 'GB', ZA: 'ZA', BW: 'BW', KE: 'KE', LS: 'LS',
  MW: 'MW', RW: 'RW', UG: 'UG', ZM: 'ZM', ZW: 'ZW',
}

// Destinations use their ISO2 code directly on the Mukuru products endpoint
const PROBE_DESTINATIONS = [
  'ZA', 'ZW', 'MW', 'MZ', 'KE', 'UG', 'BW', 'LS', 'NA', 'NG',
  'SZ', 'TZ', 'CD', 'GH', 'IN', 'RW', 'ZM', 'ET', 'AO', 'CM',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const PRODUCTS_ENDPOINT = 'https://mobile.mukuru.com/pricechecker/get_products'

const MUKURU_HEADERS = {
  'accept': 'application/json, text/javascript, */*; q=0.01',
  'user-agent': UA,
  'x-requested-with': 'XMLHttpRequest',
  'origin': 'https://mobile.mukuru.com',
  'referer': 'https://mobile.mukuru.com/',
}

type MukuruProduct = {
  title?: string | null
  name?: string | null
  product_id?: string | number | null
  enabled?: boolean | null
}

type MukuruProductsResponse = {
  products?: MukuruProduct[] | null
  status?: string | null
}

/**
 * Map a Mukuru product title to a canonical payout method.
 */
function inferPayoutMethod(title: string): string {
  const lower = title.toLowerCase()
  if (/wallet|m[\s-]?pesa|airtime|mobile/.test(lower)) return 'mobile_wallet'
  if (/bank/.test(lower)) return 'bank_deposit'
  if (/cash/.test(lower)) return 'cash_pickup'
  return 'cash_pickup' // Default for Mukuru
}

export class MukuruDiscovery extends ProviderDiscovery {
  constructor() {
    super('mukuru', 'Mukuru')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://mobile.mukuru.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('mukuru_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const mukuruSrc = MUKURU_SOURCE_CODE[sourceCountry]
    if (!mukuruSrc) {
      this.logger.warn('mukuru_unknown_source_code', { sourceCountry })
      return PROBE_DESTINATIONS.filter((d) => d !== sourceCountry)
    }

    const destinations: string[] = []
    let authBlocked = false

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      if (authBlocked) {
        // Auth is required for all calls; include remaining as static fallback
        destinations.push(dest)
        continue
      }

      try {
        const params = new URLSearchParams({
          from_country: mukuruSrc,
          to_country: dest,
        })
        const url = `${PRODUCTS_ENDPOINT}?${params.toString()}`

        const resp = await fetch(url, { headers: MUKURU_HEADERS })

        if (resp.status === 401 || resp.status === 403) {
          this.logger.warn('mukuru_products_auth_required', { sourceCountry, dest })
          authBlocked = true
          // Include this destination via static fallback
          destinations.push(dest)
          continue
        }

        if (resp.status === 429) {
          this.logger.warn('mukuru_rate_limited', { sourceCountry, dest })
          destinations.push(dest)
          break
        }

        if (resp.status === 200) {
          const text = await resp.text()
          let data: MukuruProductsResponse | null = null
          try {
            data = JSON.parse(text) as MukuruProductsResponse
          } catch {
            // Non-JSON response — corridor may still exist, skip API confirmation
            destinations.push(dest)
            continue
          }
          // Any product present means this corridor is active
          if (Array.isArray(data.products) && data.products.length > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Network error — include destination conservatively
        destinations.push(dest)
      }
    }

    // If API returned 0 destinations, fall back to static list
    if (destinations.length === 0) {
      const staticDests = PROBE_DESTINATIONS.filter((d) => d !== sourceCountry)
      this.logger.info('mukuru_dest_countries_static_fallback', {
        sourceCountry,
        count: staticDests.length,
      })
      return staticDests
    }

    this.logger.info('mukuru_dest_countries_discovered', {
      sourceCountry,
      count: destinations.length,
      authBlocked,
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
    const [srcCountry, destCountry] = parts

    const mukuruSrc = MUKURU_SOURCE_CODE[srcCountry]
    if (!mukuruSrc) {
      return this.defaultMethods(corridorId)
    }

    try {
      const params = new URLSearchParams({
        from_country: mukuruSrc,
        to_country: destCountry,
      })
      const url = `${PRODUCTS_ENDPOINT}?${params.toString()}`

      const resp = await fetch(url, { headers: MUKURU_HEADERS })

      if (resp.status === 200) {
        const text = await resp.text()
        let data: MukuruProductsResponse | null = null
        try {
          data = JSON.parse(text) as MukuruProductsResponse
        } catch {
          return this.defaultMethods(corridorId)
        }

        if (Array.isArray(data.products)) {
          const seenPayouts = new Set<string>()
          for (const product of data.products) {
            const title = product.title ?? product.name ?? ''
            if (!title) continue
            const normalizedPayout = inferPayoutMethod(title)
            if (seenPayouts.has(normalizedPayout)) continue
            seenPayouts.add(normalizedPayout)
            methods.push({
              corridorId,
              rawPayinLabel: 'bank_transfer',
              normalizedPayin: 'bank_transfer',
              rawPayoutLabel: title,
              normalizedPayout,
              unmapped: false,
            })
          }
        }
      }
    } catch (err) {
      this.logger.warn('mukuru_delivery_methods_error', {
        corridorId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    if (methods.length === 0) {
      return this.defaultMethods(corridorId)
    }

    return methods
  }

  /** Mukuru's baseline channel when the products endpoint is unavailable. */
  private defaultMethods(corridorId: string): DiscoveredDeliveryMethod[] {
    return [
      {
        corridorId,
        rawPayinLabel: 'bank_transfer',
        normalizedPayin: 'bank_transfer',
        rawPayoutLabel: 'Cash Send',
        normalizedPayout: 'cash_pickup',
        unmapped: false,
      },
    ]
  }

  protected async detectPromotions(
    browser: DiscoveryBrowser,
  ): Promise<DiscoveredPromotion[]> {
    const promos: DiscoveredPromotion[] = []

    try {
      const content = await browser.content()
      const promoPatterns: Array<{ regex: RegExp; type: DiscoveredPromotionType }> = [
        { regex: /first\s+transfer\s+free/i,            type: 'first_transfer' },
        { regex: /(?:no|zero|0)\s*(?:transfer\s+)?fee/i, type: 'zero_fee' },
        { regex: /fee[\s-]*free/i,                       type: 'zero_fee' },
        { regex: /(?:reduced?|discount)\s+fee/i,         type: 'reduced_fee' },
        { regex: /refer\s+(?:a\s+)?friend/i,             type: 'referral' },
        { regex: /special\s+(?:exchange\s+)?rate/i,      type: 'bonus_rate' },
        { regex: /send\s+more\s+save\s+more/i,           type: 'reduced_fee' },
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
      this.logger.warn('mukuru_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('mukuru_promos_detected', { count: promos.length })
    return promos
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
