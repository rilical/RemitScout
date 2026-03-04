/**
 * Xoom (PayPal) discovery script.
 *
 * API approach:
 * - GET: fetches xoom.com transfer pages and extracts embedded JSON
 *   remittance data containing disbursement types per corridor.
 * - No Playwright needed — pure HTTP GET with HTML parsing.
 *
 * Entry URL: https://www.xoom.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// Xoom source currencies
const SOURCE_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: 'US', EUR: 'DE', GBP: 'GB', CAD: 'CA', AUD: 'AU',
}

// Default currency per country
const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', DE: 'EUR',
  MX: 'MXN', PH: 'PHP', IN: 'INR', NG: 'NGN', PK: 'PKR',
  BD: 'BDT', LK: 'LKR', GH: 'GHS', KE: 'KES', VN: 'VND',
  TH: 'THB', CN: 'CNY', ID: 'IDR', MY: 'MYR', BR: 'BRL',
  CO: 'COP', PE: 'PEN', EG: 'EGP', MA: 'MAD', ZA: 'ZAR',
  TR: 'TRY', UA: 'UAH', JP: 'JPY', KR: 'KRW', NP: 'NPR',
  GT: 'GTQ', HN: 'HNL', SV: 'USD', DO: 'DOP', JM: 'JMD',
  EC: 'USD', NI: 'NIO', CR: 'CRC', HT: 'HTG',
}

// High-traffic destinations to probe
const PROBE_DESTINATIONS = [
  'MX', 'PH', 'IN', 'NG', 'PK', 'BD', 'LK', 'GH', 'KE', 'VN',
  'TH', 'CN', 'ID', 'MY', 'BR', 'CO', 'PE', 'EG', 'MA', 'ZA',
  'TR', 'UA', 'JP', 'NP', 'GT', 'HN', 'SV', 'DO', 'JM', 'EC',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

// Extract embedded remittance JSON from Xoom HTML (matching fetch.ts pattern)
function extractRemittanceFromHtml(html: string): XoomRemittance | null {
  const marker = '\\"remittance\\":'
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) return null

  const start = html.indexOf('{', markerIndex)
  if (start === -1) return null

  let depth = 0
  let end = -1
  for (let i = start; i < html.length; i += 1) {
    const char = html[i]
    if (char === '{') depth += 1
    if (char === '}') depth -= 1
    if (depth === 0 && i > start) {
      end = i
      break
    }
  }

  if (end === -1) return null

  const raw = html.slice(start, end + 1)
  const unescaped = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\')

  try {
    return JSON.parse(unescaped) as XoomRemittance
  } catch {
    return null
  }
}

type XoomRemittance = {
  selectedDisbursementType?: string | null
  sourceCountry?: string | null
  sourceCurrency?: string | null
  destinationCountry?: string | null
  destinationCurrency?: string | null
  quote?: {
    pricing?: Array<{
      disbursementType?: string | null
      [key: string]: unknown
    }> | null
  } | null
}

export class XoomDiscovery extends ProviderDiscovery {
  constructor() {
    super('xoom', 'Xoom')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.xoom.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    const countries = SOURCE_CURRENCIES
      .map((c) => CURRENCY_TO_COUNTRY[c])
      .filter((c): c is string => !!c)
    this.logger.info('xoom_source_countries_discovered', { count: countries.length })
    return countries
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
          countryCode: dest,
          sendAmount: '500.00',
          destinationCurrencyCode: destCurrency,
        })
        const url = `https://www.xoom.com/en-us/${srcCurrency.toLowerCase()}/send-money/transfer?${params.toString()}`

        const resp = await fetch(url, {
          headers: {
            'accept': 'text/html,application/xhtml+xml',
            'accept-language': 'en-US,en;q=0.9',
            'user-agent': UA,
            'referer': 'https://www.xoom.com',
          },
        })

        if (resp.status === 429) {
          this.logger.warn('xoom_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const html = await resp.text()
          const remittance = extractRemittanceFromHtml(html)
          if (remittance?.quote?.pricing && remittance.quote.pricing.length > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 1000))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('xoom_dest_countries_discovered', {
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
    const [, destCountry, srcCurrency, destCurrency] = parts

    try {
      const params = new URLSearchParams({
        countryCode: destCountry,
        sendAmount: '500.00',
        destinationCurrencyCode: destCurrency,
      })
      const url = `https://www.xoom.com/en-us/${srcCurrency.toLowerCase()}/send-money/transfer?${params.toString()}`

      const resp = await fetch(url, {
        headers: {
          'accept': 'text/html,application/xhtml+xml',
          'accept-language': 'en-US,en;q=0.9',
          'user-agent': UA,
          'referer': 'https://www.xoom.com',
        },
      })

      if (resp.status !== 200) return methods

      const html = await resp.text()
      const remittance = extractRemittanceFromHtml(html)
      if (!remittance?.quote?.pricing) return methods

      const seenTypes = new Set<string>()
      for (const pricing of remittance.quote.pricing) {
        const disbType = pricing.disbursementType ?? 'DEPOSIT'
        if (seenTypes.has(disbType)) continue
        seenTypes.add(disbType)

        methods.push({
          corridorId,
          rawPayinLabel: 'BANK_TRANSFER',
          normalizedPayin: 'bank_transfer',
          rawPayoutLabel: disbType,
          normalizedPayout: this.normalizePayout(disbType),
          unmapped: false,
        })
      }
    } catch (err) {
      this.logger.warn('xoom_method_discovery_error', {
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
      this.logger.warn('xoom_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('xoom_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayout(raw: string): string {
    const upper = raw.toUpperCase()
    const map: Record<string, string> = {
      DEPOSIT: 'bank_deposit',
      BANK_DEPOSIT: 'bank_deposit',
      UPI_DEPOSIT: 'bank_deposit',
      CARD_DEPOSIT: 'bank_deposit',
      PICKUP: 'cash_pickup',
      CASH_PICKUP: 'cash_pickup',
      DELIVERY: 'home_delivery',
      MOBILE_WALLET: 'mobile_wallet',
    }
    return map[upper] ?? 'bank_deposit'
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
