/**
 * RemitBee discovery script.
 *
 * API-first approach:
 * - POST: hits api.remitbee.com/public-services/compressed/calculate-money-transfer
 *   with transfer_amount, country_id, currency_code, include_timeline, is_special_rate params.
 * - One source country: CA (Canada only).
 * - 35 destination countries (global focused).
 * - Delivery methods default to bank_transfer → bank_deposit (API does not expose methods).
 * - Response: exchange rate / amount fields indicating corridor support.
 *
 * Entry URL: https://www.remitbee.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// RemitBee source countries (from rights matrix)
const SOURCE_COUNTRIES = ['CA']

const COUNTRY_CURRENCY: Record<string, string> = {
  CA: 'CAD',
  IN: 'INR', PH: 'PHP', LK: 'LKR', BD: 'BDT', PK: 'PKR', GH: 'GHS',
  KE: 'KES', NG: 'NGN', UG: 'UGX', ZM: 'ZMW', CO: 'COP', DO: 'DOP',
  SV: 'USD', GT: 'GTQ', HN: 'HNL', JM: 'JMD', CR: 'CRC', EC: 'USD',
  PE: 'PEN', CL: 'CLP', AR: 'ARS', UY: 'USD', BJ: 'XOF', BW: 'BWP',
  CM: 'XAF', CI: 'XOF', SN: 'XOF', TG: 'XOF', RO: 'RON', UA: 'UAH',
  JO: 'JOD', KR: 'KRW', ID: 'IDR', HT: 'USD', RW: 'RWF',
}

// Country IDs required by the RemitBee API
const COUNTRY_ID: Record<string, number> = {
  IN: 101, PH: 174, LK: 199, BD: 19, PK: 167, GH: 83, KE: 113,
  NG: 161, UG: 231, ZM: 246, CO: 49, DO: 62, SV: 66, GT: 90,
  HN: 97, JM: 109, CR: 53, EC: 63, PE: 172, CL: 44, AR: 11,
  UY: 236, BJ: 24, BW: 29, CM: 38, CI: 108, SN: 195, TG: 217,
  RO: 182, UA: 230, JO: 111, KR: 117, ID: 100, HT: 95, RW: 185,
}

// RemitBee destinations (from rights matrix)
const PROBE_DESTINATIONS = [
  'IN', 'PH', 'LK', 'BD', 'PK', 'GH', 'KE', 'NG', 'UG', 'ZM',
  'CO', 'DO', 'SV', 'GT', 'HN', 'JM', 'CR', 'EC', 'PE', 'CL',
  'AR', 'UY', 'BJ', 'BW', 'CM', 'CI', 'SN', 'TG', 'RO', 'UA',
  'JO', 'KR', 'ID', 'HT', 'RW',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const CALCULATE_ENDPOINT = 'https://api.remitbee.com/public-services/compressed/calculate-money-transfer'

type RemitBeeResponse = {
  exchange_rate?: number | string | null
  exchangeRate?: number | string | null
  rate?: number | string | null
  receiving_amount?: number | string | null
  transfer_amount?: number | string | null
  data?: {
    exchange_rate?: number | string | null
    rate?: number | string | null
    receiving_amount?: number | string | null
  } | null
  success?: boolean | null
  error?: string | null
}

const REMITBEE_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'content-type': 'application/json',
  'origin': 'https://www.remitbee.com',
  'referer': 'https://www.remitbee.com/',
  'user-agent': UA,
}

function extractRate(data: RemitBeeResponse): number {
  const candidates = [
    data.exchange_rate,
    data.exchangeRate,
    data.rate,
    data.data?.exchange_rate,
    data.data?.rate,
  ]
  for (const candidate of candidates) {
    if (candidate != null) {
      const parsed = parseFloat(String(candidate))
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  }
  return 0
}

export class RemitBeeDiscovery extends ProviderDiscovery {
  constructor() {
    super('remitbee', 'RemitBee')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.remitbee.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('remitbee_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    if (sourceCountry !== 'CA') return []

    const destinations: string[] = []
    let cloudflareBlocked = false

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      const countryId = COUNTRY_ID[dest]
      if (!destCurrency || countryId == null) continue

      if (cloudflareBlocked) {
        // API is behind Cloudflare; include remaining destinations via static fallback
        destinations.push(dest)
        continue
      }

      try {
        const body = {
          transfer_amount: '500.00',
          country_id: countryId,
          currency_code: destCurrency,
          include_timeline: true,
          is_special_rate: true,
        }

        const resp = await fetch(CALCULATE_ENDPOINT, {
          method: 'POST',
          headers: REMITBEE_HEADERS,
          body: JSON.stringify(body),
        })

        if (resp.status === 429) {
          this.logger.warn('remitbee_rate_limited', { sourceCountry, dest })
          destinations.push(dest)
          break
        }

        if (resp.status === 403) {
          // Cloudflare challenge — fall back to static list for remaining destinations
          this.logger.warn('remitbee_cloudflare_blocked', { sourceCountry, dest })
          cloudflareBlocked = true
          destinations.push(dest)
          continue
        }

        if (resp.status === 200) {
          const contentType = resp.headers.get('content-type') ?? ''
          if (!contentType.includes('json')) {
            // HTML challenge page — treat as Cloudflare block
            this.logger.warn('remitbee_cloudflare_html_response', { sourceCountry, dest })
            cloudflareBlocked = true
            destinations.push(dest)
            continue
          }
          const data = await resp.json() as RemitBeeResponse
          const rate = extractRate(data)
          if (rate > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Network error — include destination conservatively
        destinations.push(dest)
      }
    }

    this.logger.info('remitbee_dest_countries_discovered', {
      sourceCountry,
      count: destinations.length,
      cloudflareBlocked,
      method: cloudflareBlocked ? 'static_fallback' : 'api',
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
    const [_srcCountry, destCountry, _srcCurrency, destCurrency] = parts

    const countryId = COUNTRY_ID[destCountry]
    if (countryId == null) {
      // Default to bank_deposit when no country ID mapping exists
      methods.push({
        corridorId,
        rawPayinLabel: 'bank_transfer',
        normalizedPayin: 'bank_transfer',
        rawPayoutLabel: 'bank_account',
        normalizedPayout: 'bank_deposit',
        unmapped: false,
      })
      return methods
    }

    try {
      const body = {
        transfer_amount: '500.00',
        country_id: countryId,
        currency_code: destCurrency,
        include_timeline: true,
        is_special_rate: true,
      }

      const resp = await fetch(CALCULATE_ENDPOINT, {
        method: 'POST',
        headers: REMITBEE_HEADERS,
        body: JSON.stringify(body),
      })

      if (resp.status === 200) {
        const contentType = resp.headers.get('content-type') ?? ''
        if (contentType.includes('json')) {
          const data = await resp.json() as RemitBeeResponse
          const rate = extractRate(data)
          if (rate > 0) {
            // RemitBee API does not expose delivery methods — default to bank_deposit
            methods.push({
              corridorId,
              rawPayinLabel: 'bank_transfer',
              normalizedPayin: 'bank_transfer',
              rawPayoutLabel: 'bank_account',
              normalizedPayout: 'bank_deposit',
              unmapped: false,
            })
          }
        }
      }
    } catch (err) {
      this.logger.warn('remitbee_method_discovery_error', {
        corridorId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Fallback — always return bank_deposit (RemitBee's primary channel)
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

      // API-based promo: check is_special_rate vs standard rate for CA→IN
      try {
        const bodySpecial = {
          transfer_amount: '500.00',
          country_id: COUNTRY_ID['IN'],
          currency_code: 'INR',
          include_timeline: true,
          is_special_rate: true,
        }
        const bodyStandard = {
          transfer_amount: '500.00',
          country_id: COUNTRY_ID['IN'],
          currency_code: 'INR',
          include_timeline: true,
          is_special_rate: false,
        }

        const [respSpecial, respStandard] = await Promise.all([
          fetch(CALCULATE_ENDPOINT, {
            method: 'POST',
            headers: REMITBEE_HEADERS,
            body: JSON.stringify(bodySpecial),
          }),
          fetch(CALCULATE_ENDPOINT, {
            method: 'POST',
            headers: REMITBEE_HEADERS,
            body: JSON.stringify(bodyStandard),
          }),
        ])

        if (respSpecial.status === 200 && respStandard.status === 200) {
          const dataSpecial = await respSpecial.json() as RemitBeeResponse
          const dataStandard = await respStandard.json() as RemitBeeResponse
          const specialRate = extractRate(dataSpecial)
          const standardRate = extractRate(dataStandard)
          if (specialRate > 0 && standardRate > 0 && specialRate > standardRate) {
            promos.push({
              type: 'bonus_rate',
              corridorId: 'CA-IN-CAD-INR',
              rawText: `Special rate ${specialRate} vs standard ${standardRate}`,
              strikethroughDetected: false,
              originalValue: String(standardRate),
              promoValue: String(specialRate),
              expiresAt: null,
              bannerSelector: null,
            })
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('remitbee_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('remitbee_promos_detected', { count: promos.length })
    return promos
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
