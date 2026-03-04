/**
 * Dahabshiil discovery script.
 *
 * API-first approach:
 * - GET: hits apigw-us.dahabshiil.com/remit/transaction/get-charges-anonymous
 *   with source_country_code, destination_country_iso2, amount, destination_currency, type params.
 * - 20 source countries (US, GB, EU, CH, CA).
 * - 33 destination countries (Horn of Africa focused).
 * - Three payout types probed: Cash Collection, Bank Deposit, Mobile Wallet.
 * - Response: { status, code, data: { charges: { rate, commission, ... } } }
 *
 * Entry URL: https://www.dahabshiil.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// Dahabshiil source countries (from rights matrix)
const SOURCE_COUNTRIES = [
  'US', 'GB', 'HR', 'GR', 'AT', 'BG', 'FI', 'ES', 'BE', 'NL',
  'DE', 'NO', 'DK', 'SE', 'IT', 'IE', 'FR', 'CH', 'PT', 'CA',
]

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', CH: 'CHF',
  HR: 'EUR', GR: 'EUR', AT: 'EUR', BG: 'BGN', FI: 'EUR', ES: 'EUR',
  BE: 'EUR', NL: 'EUR', DE: 'EUR', NO: 'NOK', DK: 'DKK', SE: 'SEK',
  IT: 'EUR', IE: 'EUR', FR: 'EUR', PT: 'EUR',
  SO: 'USD', KE: 'KES', AU: 'AUD', BH: 'BHD', DJ: 'USD', EG: 'EGP',
  ER: 'ERN', MY: 'MYR', MR: 'MRU', NP: 'NPR', NZ: 'NZD', QA: 'QAR',
  RW: 'RWF', SA: 'SAR', SS: 'USD', SD: 'USD', TR: 'TRY', AE: 'AED',
  UG: 'USD', YE: 'YER', CD: 'USD', BI: 'BIF', GM: 'GMD', MA: 'MAD',
  KW: 'KWD',
}

// Dahabshiil destinations (from rights matrix)
const PROBE_DESTINATIONS = [
  'SO', 'KE', 'AU', 'BH', 'CA', 'DJ', 'EG', 'ER', 'FI', 'FR',
  'IE', 'IT', 'KW', 'MY', 'MR', 'NP', 'NZ', 'QA', 'RW', 'SA',
  'SS', 'SD', 'SE', 'TR', 'AE', 'UG', 'GB', 'YE', 'CD', 'NL',
  'BI', 'GM', 'MA',
]

// Dahabshiil payout types to probe
const PAYOUT_TYPES = [
  { apiLabel: 'Cash Collection', canonical: 'cash_pickup' },
  { apiLabel: 'Bank Deposit', canonical: 'bank_deposit' },
  { apiLabel: 'Mobile Wallet', canonical: 'mobile_wallet' },
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const CHARGES_ENDPOINT = 'https://apigw-us.dahabshiil.com/remit/transaction/get-charges-anonymous'

type DahabshiilResponse = {
  status?: string | null
  code?: number | null
  data?: {
    charges?: {
      rate?: number | null
      base_rate?: number | null
      commission?: number | null
      source_amount?: number | null
      destination_amount?: number | null
      source_currency?: string | null
      destination_currency?: string | null
    } | null
  } | null
}

const DAHABSHIIL_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'en-US',
  'cache-control': 'no-cache',
  'pragma': 'no-cache',
  'origin': 'https://www.dahabshiil.com',
  'referer': 'https://www.dahabshiil.com/',
  'user-agent': UA,
}

export class DahabshiilDiscovery extends ProviderDiscovery {
  constructor() {
    super('dahabshiil', 'Dahabshiil')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.dahabshiil.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('dahabshiil_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const destinations: string[] = []

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue

      try {
        const params = new URLSearchParams({
          source_country_code: sourceCountry,
          destination_country_iso2: dest,
          amount_type: 'SOURCE',
          amount: '500.00',
          destination_currency: destCurrency,
          type: 'Cash Collection',
        })
        const url = `${CHARGES_ENDPOINT}?${params.toString()}`

        const resp = await fetch(url, { headers: DAHABSHIIL_HEADERS })

        if (resp.status === 429) {
          this.logger.warn('dahabshiil_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as DahabshiilResponse
          const rate = data.data?.charges?.rate
          if (rate != null && rate > 0 && data.status === 'Success') {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    // If API returned 0 destinations, fall back to static list
    if (destinations.length === 0) {
      const staticDests = PROBE_DESTINATIONS.filter((d) => d !== sourceCountry)
      this.logger.info('dahabshiil_dest_countries_static_fallback', {
        sourceCountry,
        count: staticDests.length,
      })
      return staticDests
    }

    this.logger.info('dahabshiil_dest_countries_discovered', {
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
    const [srcCountry, destCountry, _srcCurrency, destCurrency] = parts

    // Probe each payout type to see which are supported
    for (const { apiLabel, canonical } of PAYOUT_TYPES) {
      try {
        const params = new URLSearchParams({
          source_country_code: srcCountry,
          destination_country_iso2: destCountry,
          amount_type: 'SOURCE',
          amount: '500.00',
          destination_currency: destCurrency,
          type: apiLabel,
        })
        const url = `${CHARGES_ENDPOINT}?${params.toString()}`

        const resp = await fetch(url, { headers: DAHABSHIIL_HEADERS })

        if (resp.status === 429) {
          this.logger.warn('dahabshiil_rate_limited_methods', { corridorId, apiLabel })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as DahabshiilResponse
          const rate = data.data?.charges?.rate
          if (rate != null && rate > 0 && data.status === 'Success') {
            methods.push({
              corridorId,
              rawPayinLabel: 'bank_transfer',
              normalizedPayin: 'bank_transfer',
              rawPayoutLabel: apiLabel,
              normalizedPayout: canonical,
              unmapped: false,
            })
          }
        }

        await new Promise((r) => setTimeout(r, 300))
      } catch {
        // Skip on error
      }
    }

    // If no methods found, default to cash_pickup (Dahabshiil's primary channel)
    if (methods.length === 0) {
      methods.push({
        corridorId,
        rawPayinLabel: 'bank_transfer',
        normalizedPayin: 'bank_transfer',
        rawPayoutLabel: 'Cash Collection',
        normalizedPayout: 'cash_pickup',
        unmapped: false,
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
        { regex: /(?:no|zero|0)\s*(?:transfer\s+)?fee/i, type: 'zero_fee' },
        { regex: /fee[\s-]*free/i, type: 'zero_fee' },
        { regex: /(?:reduced?|discount)\s+fee/i, type: 'reduced_fee' },
        { regex: /refer\s+(?:a\s+)?friend/i, type: 'referral' },
        { regex: /special\s+(?:exchange\s+)?rate/i, type: 'bonus_rate' },
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
      this.logger.warn('dahabshiil_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('dahabshiil_promos_detected', { count: promos.length })
    return promos
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
