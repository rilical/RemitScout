/**
 * Pangea discovery script.
 *
 * API-first approach:
 * - GET: hits api.gopangea.com/api/v1/marketing/fx-calc/calculate
 *   with country + amount + inputType=send params.
 * - USD is the only supported source currency.
 * - Response: { SendingAmount, ReceivingAmount, StandardRate: { Rate }, PromotionalRate: { Rate } }
 * - No delivery/payment method info in API — defaults to bank_transfer → bank_deposit.
 *
 * Entry URL: https://pangeamoneytransfer.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// Pangea only supports USD source (from rights matrix)
const SOURCE_COUNTRIES = ['US']

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD',
  MX: 'MXN', PH: 'PHP', GT: 'GTQ', HN: 'HNL', CO: 'COP', SV: 'USD',
  BD: 'BDT', BF: 'XOF', CI: 'XOF', DO: 'DOP', FR: 'EUR', DE: 'EUR',
  GH: 'GHS', IN: 'INR', ID: 'IDR', IT: 'EUR', KE: 'KES', MY: 'MYR',
  NP: 'NPR', SN: 'XOF', SG: 'SGD', TH: 'THB', UG: 'UGX', VN: 'VND',
}

// All 24 destinations from rights matrix
const PROBE_DESTINATIONS = [
  'MX', 'PH', 'GT', 'HN', 'CO', 'SV', 'BD', 'BF', 'CI', 'DO',
  'FR', 'DE', 'GH', 'IN', 'ID', 'IT', 'KE', 'MY', 'NP', 'SN',
  'SG', 'TH', 'UG', 'VN',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const QUOTES_ENDPOINT = 'https://api.gopangea.com/api/v1/marketing/fx-calc/calculate'

type PangeaResponse = {
  SendingAmount?: { Amount?: string; Currency?: string } | null
  ReceivingAmount?: { Amount?: string; Currency?: string } | null
  StandardRate?: { RateType?: string; Rate?: string } | null
  PromotionalRate?: { RateType?: string; Rate?: string } | null
}

const PANGEA_HEADERS = {
  'accept': 'application/json, text/javascript, */*; q=0.01',
  'accept-language': 'en-US,en;q=0.9',
  'origin': 'https://pangeamoneytransfer.com',
  'referer': 'https://pangeamoneytransfer.com/',
  'user-agent': UA,
  'cache-control': 'no-cache',
  'pragma': 'no-cache',
  'sec-fetch-site': 'cross-site',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
}

export class PangeaDiscovery extends ProviderDiscovery {
  constructor() {
    super('pangea', 'Pangea')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://pangeamoneytransfer.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('pangea_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    if (sourceCountry !== 'US') {
      this.logger.info('pangea_dest_countries_discovered', {
        sourceCountry,
        count: 0,
        reason: 'non_us_source',
      })
      return []
    }

    const destinations: string[] = []

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue

      try {
        const params = new URLSearchParams({
          country: dest.toLowerCase(),
          amount: '500',
          inputType: 'send',
        })
        const url = `${QUOTES_ENDPOINT}?${params.toString()}`

        const resp = await fetch(url, { headers: PANGEA_HEADERS })

        if (resp.status === 429) {
          this.logger.warn('pangea_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as PangeaResponse
          const rate = parseFloat(data.StandardRate?.Rate ?? '0')
          if (rate > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('pangea_dest_countries_discovered', {
      sourceCountry,
      count: destinations.length,
    })
    return destinations
  }

  protected async discoverDeliveryMethods(
    _browser: DiscoveryBrowser,
    corridorId: string,
  ): Promise<DiscoveredDeliveryMethod[]> {
    // Pangea API does not expose delivery/payment methods — always bank_deposit
    return [{
      corridorId,
      rawPayinLabel: 'bank_transfer',
      normalizedPayin: 'bank_transfer',
      rawPayoutLabel: 'bank_deposit',
      normalizedPayout: 'bank_deposit',
      unmapped: false,
    }]
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

      // API-based promo: check if PromotionalRate differs from StandardRate
      try {
        const params = new URLSearchParams({ country: 'mx', amount: '500', inputType: 'send' })
        const resp = await fetch(`${QUOTES_ENDPOINT}?${params.toString()}`, {
          headers: PANGEA_HEADERS,
        })
        if (resp.status === 200) {
          const data = await resp.json() as PangeaResponse
          const stdRate = parseFloat(data.StandardRate?.Rate ?? '0')
          const promoRate = parseFloat(data.PromotionalRate?.Rate ?? '0')
          if (promoRate > 0 && stdRate > 0 && promoRate > stdRate) {
            promos.push({
              type: 'bonus_rate',
              corridorId: 'US-MX-USD-MXN',
              rawText: `Promotional rate ${promoRate} vs standard ${stdRate}`,
              strikethroughDetected: false,
              originalValue: String(stdRate),
              promoValue: String(promoRate),
              expiresAt: null,
              bannerSelector: null,
            })
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('pangea_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('pangea_promos_detected', { count: promos.length })
    return promos
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
