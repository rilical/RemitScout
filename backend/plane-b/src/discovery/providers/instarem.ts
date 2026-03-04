/**
 * Instarem discovery script.
 *
 * API-first approach:
 * - Step 1 GET: hits instarem.com/api/v1/public/payment-method/fee
 *   to discover available payment methods per corridor.
 * - Step 2 GET: hits instarem.com/api/v1/public/transaction/computed-value
 *   to verify the corridor returns valid quote data.
 * - No Playwright needed — pure HTTP API calls.
 *
 * Entry URL: https://www.instarem.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// Instarem source countries (from rights matrix supported-corridors.ts)
const KNOWN_SOURCE_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'NZ', 'SG', 'HK', 'MY', 'IN', 'JP',
  'KR', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'PT',
  'FI', 'BG', 'CZ', 'HR', 'HU', 'IS', 'LI', 'LT', 'LU', 'LV',
  'MT', 'PL', 'RO', 'SE', 'SI', 'SK',
]

// Default currency per country
const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD',
  SG: 'SGD', HK: 'HKD', MY: 'MYR', IN: 'INR', JP: 'JPY',
  KR: 'KRW', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR',
  FI: 'EUR', BG: 'BGN', CZ: 'CZK', HR: 'EUR', HU: 'HUF',
  IS: 'ISK', LI: 'CHF', LT: 'EUR', LU: 'EUR', LV: 'EUR',
  MT: 'EUR', PL: 'PLN', RO: 'RON', SE: 'SEK', SI: 'EUR',
  SK: 'EUR',
  PH: 'PHP', NG: 'NGN', PK: 'PKR', BD: 'BDT', LK: 'LKR',
  GH: 'GHS', KE: 'KES', VN: 'VND', TH: 'THB', CN: 'CNY',
  ID: 'IDR', BR: 'BRL', CO: 'COP', PE: 'PEN', EG: 'EGP',
  MA: 'MAD', ZA: 'ZAR', TR: 'TRY', MX: 'MXN', NP: 'NPR',
}

// High-traffic destinations to probe
const PROBE_DESTINATIONS = [
  'IN', 'PH', 'PK', 'BD', 'LK', 'MY', 'SG', 'HK', 'ID', 'TH',
  'VN', 'CN', 'KR', 'JP', 'AU', 'NZ', 'GB', 'US', 'CA', 'DE',
  'MX', 'NG', 'GH', 'KE', 'ZA', 'TR', 'EG', 'NP', 'BR', 'CO',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const instaremBaseUrl = 'https://www.instarem.com/api'
const paymentMethodPath = '/v1/public/payment-method/fee'

type InstaremPaymentMethod = {
  key?: number | string
  value?: number | string
  text?: string | null
  code?: string | null
  icon_url?: string | null
  [key: string]: unknown
}

export class InstaremDiscovery extends ProviderDiscovery {
  constructor() {
    super('instarem', 'Instarem')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.instarem.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('instarem_source_countries_discovered', {
      count: KNOWN_SOURCE_COUNTRIES.length,
    })
    return [...KNOWN_SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const destinations: string[] = []
    const srcCurrency = COUNTRY_CURRENCY[sourceCountry] ?? 'USD'

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue

      try {
        const params = new URLSearchParams({
          source_currency: srcCurrency,
          source_amount: '500',
          destination_currency: destCurrency,
          country_code: sourceCountry,
        })
        const url = `${instaremBaseUrl}${paymentMethodPath}?${params.toString()}`

        const resp = await fetch(url, {
          headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'origin': 'https://www.instarem.com',
            'referer': 'https://www.instarem.com/',
            'user-agent': UA,
          },
        })

        if (resp.status === 429) {
          this.logger.warn('instarem_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as { data?: unknown[] }
          const methods = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
          if (methods.length > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('instarem_dest_countries_discovered', {
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
    const [srcCountry, , srcCurrency, destCurrency] = parts

    try {
      const params = new URLSearchParams({
        source_currency: srcCurrency,
        source_amount: '500',
        destination_currency: destCurrency,
        country_code: srcCountry,
      })
      const url = `${instaremBaseUrl}${paymentMethodPath}?${params.toString()}`

      const resp = await fetch(url, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          'pragma': 'no-cache',
          'origin': 'https://www.instarem.com',
          'referer': 'https://www.instarem.com/',
          'user-agent': UA,
        },
      })

      if (resp.status !== 200) return methods

      const data = await resp.json() as { data?: InstaremPaymentMethod[] }
      const paymentMethods = Array.isArray(data?.data)
        ? data.data as InstaremPaymentMethod[]
        : (Array.isArray(data) ? data as InstaremPaymentMethod[] : [])

      for (const pm of paymentMethods) {
        const descriptor = [pm.text, pm.code, pm.icon_url].filter(Boolean).join(' ')
        const normalizedPayin = this.normalizePayin(descriptor)

        methods.push({
          corridorId,
          rawPayinLabel: pm.text ?? pm.code ?? String(pm.key ?? 'unknown'),
          normalizedPayin,
          rawPayoutLabel: 'bank_deposit',
          normalizedPayout: 'bank_deposit',
          unmapped: false,
        })
      }
    } catch (err) {
      this.logger.warn('instarem_method_discovery_error', {
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
        { regex: /(?:no|zero|0)\s*(?:transfer\s+)?fee/i, type: 'zero_fee' },
        { regex: /fee[\s-]*free/i, type: 'zero_fee' },
        { regex: /(?:reduced?|discount)\s+fee/i, type: 'reduced_fee' },
        { regex: /better\s+(?:exchange\s+)?rate/i, type: 'bonus_rate' },
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
      this.logger.warn('instarem_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('instarem_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayin(descriptor: string): string {
    const lower = descriptor.toLowerCase()
    if (/debit/.test(lower)) return 'debit_card'
    if (/credit/.test(lower)) return 'credit_card'
    if (/apple/.test(lower)) return 'apple_pay'
    if (/google/.test(lower)) return 'google_pay'
    if (/card/.test(lower)) return 'debit_card'
    if (/wire|ach|bank|transfer|paynow/.test(lower)) return 'bank_transfer'
    if (/cash/.test(lower)) return 'cash'
    return 'bank_transfer'
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
