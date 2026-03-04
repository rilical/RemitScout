/**
 * OrbitRemit discovery script.
 *
 * API-first approach:
 * - POST: hits www.orbitremit.com/api/rates
 *   with sendCurrency, payoutCurrency, amount, recipientType, focus params.
 * - Two source countries: AU, NZ.
 * - 26 destination countries (Asia-Pacific and global focused).
 * - Three recipient types probed: bank_account, person, wallet.
 * - Response: exchange rate object with valid rate > 0.
 *
 * Entry URL: https://www.orbitremit.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// OrbitRemit source countries (from rights matrix)
const SOURCE_COUNTRIES = ['AU', 'NZ']

const COUNTRY_CURRENCY: Record<string, string> = {
  AU: 'AUD', NZ: 'NZD',
  BD: 'BDT', BN: 'BND', CN: 'CNY', FJ: 'FJD', HK: 'HKD', IN: 'INR',
  ID: 'IDR', JP: 'JPY', KE: 'KES', MY: 'MYR', NP: 'NPR', PK: 'PKR',
  PH: 'PHP', WS: 'WST', SG: 'SGD', ZA: 'ZAR', KR: 'KRW', LK: 'LKR',
  TH: 'THB', TO: 'TOP', GB: 'GBP', US: 'USD', VN: 'VND', VU: 'VUV',
}

// OrbitRemit destinations (from rights matrix)
const PROBE_DESTINATIONS = [
  'BD', 'BN', 'CN', 'FJ', 'HK', 'IN', 'ID', 'JP', 'KE', 'MY',
  'NP', 'PK', 'PH', 'WS', 'SG', 'ZA', 'KR', 'LK', 'TH', 'TO',
  'GB', 'US', 'VN', 'VU',
]

// OrbitRemit payout recipient types to probe
const RECIPIENT_TYPES = [
  { apiLabel: 'bank_account', canonical: 'bank_deposit' },
  { apiLabel: 'person', canonical: 'cash_pickup' },
  { apiLabel: 'wallet', canonical: 'mobile_wallet' },
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const RATES_ENDPOINT = 'https://www.orbitremit.com/api/rates'

type OrbitRemitRateResponse = {
  rate?: number | null
  exchangeRate?: number | null
  payoutRate?: number | null
  error?: string | null
  success?: boolean | null
  // Nested JSON:API-style response: { data: { data: { attributes: { ... } } } }
  data?: {
    data?: {
      attributes?: {
        send_amount?: string | number | null
        payout_amount?: string | number | null
        rate?: number | null
        exchange_rate?: number | null
      } | null
    } | null
    attributes?: {
      send_amount?: string | number | null
      payout_amount?: string | number | null
      rate?: number | null
      exchange_rate?: number | null
    } | null
  } | null
}

const ORBITREMIT_HEADERS = {
  'accept': '*/*',
  'content-type': 'application/json',
  'origin': 'https://www.orbitremit.com',
  'referer': 'https://www.orbitremit.com',
  'user-agent': UA,
}

/**
 * Extract a valid rate from OrbitRemit's response.
 * The API may return a flat structure or nested JSON:API format.
 */
function extractRate(data: OrbitRemitRateResponse): number {
  const candidates = [
    data.rate,
    data.exchangeRate,
    data.payoutRate,
    data.data?.data?.attributes?.rate,
    data.data?.data?.attributes?.exchange_rate,
    data.data?.attributes?.rate,
    data.data?.attributes?.exchange_rate,
  ]
  for (const candidate of candidates) {
    if (candidate != null) {
      const parsed = typeof candidate === 'number' ? candidate : parseFloat(String(candidate))
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  }
  // Fallback: if payout_amount exists and is non-zero, the corridor is active
  const payoutAmount = data.data?.data?.attributes?.payout_amount ?? data.data?.attributes?.payout_amount
  if (payoutAmount != null) {
    const parsed = typeof payoutAmount === 'number' ? payoutAmount : parseFloat(String(payoutAmount))
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return 0
}

export class OrbitRemitDiscovery extends ProviderDiscovery {
  constructor() {
    super('orbitremit', 'OrbitRemit')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.orbitremit.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('orbitremit_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const destinations: string[] = []
    const srcCurrency = COUNTRY_CURRENCY[sourceCountry]
    if (!srcCurrency) return destinations

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue

      try {
        const body = {
          sendCurrency: srcCurrency,
          payoutCurrency: destCurrency,
          amount: '500.00',
          recipientType: 'bank_account',
          focus: 'send',
        }

        const resp = await fetch(RATES_ENDPOINT, {
          method: 'POST',
          headers: ORBITREMIT_HEADERS,
          body: JSON.stringify(body),
        })

        if (resp.status === 429) {
          this.logger.warn('orbitremit_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.ok) {
          const data = await resp.json() as OrbitRemitRateResponse
          const rate = extractRate(data)
          if (rate > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('orbitremit_dest_countries_discovered', {
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
    const [_srcCountry, _destCountry, srcCurrency, destCurrency] = parts

    // Probe each recipient type to see which are supported
    for (const { apiLabel, canonical } of RECIPIENT_TYPES) {
      try {
        const body = {
          sendCurrency: srcCurrency,
          payoutCurrency: destCurrency,
          amount: '500.00',
          recipientType: apiLabel,
          focus: 'send',
        }

        const resp = await fetch(RATES_ENDPOINT, {
          method: 'POST',
          headers: ORBITREMIT_HEADERS,
          body: JSON.stringify(body),
        })

        if (resp.status === 429) {
          this.logger.warn('orbitremit_rate_limited_methods', { corridorId, apiLabel })
          break
        }

        if (resp.ok) {
          const data = await resp.json() as OrbitRemitRateResponse
          const rate = extractRate(data)
          if (rate > 0) {
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

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    // If no methods found, default to bank_deposit (OrbitRemit's primary channel)
    if (methods.length === 0) {
      methods.push({
        corridorId,
        rawPayinLabel: 'bank_transfer',
        normalizedPayin: 'bank_transfer',
        rawPayoutLabel: 'bank_account',
        normalizedPayout: 'bank_deposit',
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

      // API-based promo: check AU→NZ corridor for promotional rate vs standard
      try {
        const body = {
          sendCurrency: 'AUD',
          payoutCurrency: 'NZD',
          amount: '500.00',
          recipientType: 'bank_account',
          focus: 'send',
        }
        const resp = await fetch(RATES_ENDPOINT, {
          method: 'POST',
          headers: ORBITREMIT_HEADERS,
          body: JSON.stringify(body),
        })
        if (resp.status === 200) {
          const data = await resp.json() as OrbitRemitRateResponse & { baseRate?: number | null; promoRate?: number | null }
          const currentRate = extractRate(data)
          const baseRate = data.baseRate
          if (currentRate > 0 && baseRate != null && baseRate > 0 && currentRate > baseRate) {
            promos.push({
              type: 'bonus_rate',
              corridorId: 'AU-NZ-AUD-NZD',
              rawText: `Promo rate ${currentRate} vs base ${baseRate}`,
              strikethroughDetected: false,
              originalValue: String(baseRate),
              promoValue: String(currentRate),
              expiresAt: null,
              bannerSelector: null,
            })
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('orbitremit_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('orbitremit_promos_detected', { count: promos.length })
    return promos
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
