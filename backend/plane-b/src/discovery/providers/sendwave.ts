/**
 * SendWave discovery script.
 *
 * API-first approach:
 * - Step 1 GET: hits app.sendwave.com/v2/pricing-segments
 *   to discover payout methods (payoutMethodsAndPrices[]).
 * - Uses lowercase country codes (sendCountryIso2, receiveCountryIso2).
 * - No Playwright needed — pure HTTP API calls.
 *
 * Entry URL: https://www.sendwave.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// SendWave source countries (from rights matrix supported-corridors.ts)
const KNOWN_SOURCE_COUNTRIES = [
  'US', 'GB', 'CA', 'IE', 'FR', 'IT', 'ES', 'BE', 'FI',
  'SE', 'DE', 'PT',
]

// Default currency per country
const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', IE: 'EUR', FR: 'EUR',
  IT: 'EUR', ES: 'EUR', BE: 'EUR', FI: 'EUR', SE: 'SEK',
  DE: 'EUR', PT: 'EUR',
  KE: 'KES', GH: 'GHS', NG: 'NGN', TZ: 'TZS', UG: 'UGX',
  SN: 'XOF', LR: 'LRD', CM: 'XAF', ET: 'ETB', RW: 'RWF',
  BD: 'BDT', PH: 'PHP', MW: 'MWK', MZ: 'MZN', ZM: 'ZMW',
  ZW: 'ZWL', CI: 'XOF', ML: 'XOF', BF: 'XOF', NE: 'XOF',
  TG: 'XOF', BJ: 'XOF', GN: 'GNF', GM: 'GMD', SL: 'SLL',
  SO: 'SOS', CD: 'CDF', BI: 'BIF', MG: 'MGA',
}

// SendWave destinations — primarily Africa + some Asia
const PROBE_DESTINATIONS = [
  'KE', 'GH', 'NG', 'TZ', 'UG', 'SN', 'LR', 'CM', 'ET', 'RW',
  'BD', 'PH', 'MW', 'MZ', 'ZM', 'ZW', 'CI', 'ML', 'BF', 'NE',
  'TG', 'BJ', 'GN', 'GM', 'SL', 'SO', 'CD', 'BI', 'MG',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const SEGMENTS_ENDPOINT = 'https://app.sendwave.com/v2/pricing-segments'

type SendwavePayoutGroup = {
  payoutMethod?: string | null
  label?: string | null
  bestPricedSegmentName?: string | null
  isBestPricedPayoutMethod?: boolean | null
  segments?: Array<{ segmentName?: string | null }> | null
}

type SendwaveSegmentsPayload = {
  payoutMethodsAndPrices?: SendwavePayoutGroup[] | null
}

export class SendwaveDiscovery extends ProviderDiscovery {
  constructor() {
    super('sendwave', 'SendWave')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.sendwave.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('sendwave_source_countries_discovered', {
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
        // SendWave uses lowercase country codes
        const params = new URLSearchParams({
          sendCountryIso2: sourceCountry.toLowerCase(),
          sendCurrency: srcCurrency,
          receiveCountryIso2: dest.toLowerCase(),
          receiveCurrency: destCurrency,
        })
        const url = `${SEGMENTS_ENDPOINT}?${params.toString()}`

        const resp = await fetch(url, {
          headers: {
            'accept': 'application/json, text/plain, */*',
            'origin': 'https://www.sendwave.com',
            'referer': 'https://www.sendwave.com/',
            'accept-language': 'en-US',
            'user-agent': UA,
          },
        })

        if (resp.status === 429) {
          this.logger.warn('sendwave_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as SendwaveSegmentsPayload
          const groups = data.payoutMethodsAndPrices ?? []
          if (groups.length > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('sendwave_dest_countries_discovered', {
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
      const params = new URLSearchParams({
        sendCountryIso2: srcCountry.toLowerCase(),
        sendCurrency: srcCurrency,
        receiveCountryIso2: destCountry.toLowerCase(),
        receiveCurrency: destCurrency,
      })
      const url = `${SEGMENTS_ENDPOINT}?${params.toString()}`

      const resp = await fetch(url, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'origin': 'https://www.sendwave.com',
          'referer': 'https://www.sendwave.com/',
          'accept-language': 'en-US',
          'user-agent': UA,
        },
      })

      if (resp.status !== 200) return methods

      const data = await resp.json() as SendwaveSegmentsPayload
      const groups = data.payoutMethodsAndPrices ?? []

      const seenMethods = new Set<string>()
      for (const group of groups) {
        const rawPayout = group.payoutMethod ?? group.label ?? 'unknown'
        if (seenMethods.has(rawPayout)) continue
        seenMethods.add(rawPayout)

        methods.push({
          corridorId,
          rawPayinLabel: 'debit_card',
          normalizedPayin: 'debit_card',
          rawPayoutLabel: rawPayout,
          normalizedPayout: this.normalizePayout(rawPayout),
          unmapped: false,
        })
      }
    } catch (err) {
      this.logger.warn('sendwave_method_discovery_error', {
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
      this.logger.warn('sendwave_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('sendwave_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayout(raw: string): string {
    const lower = raw.toLowerCase()

    if (/cash/.test(lower)) return 'cash_pickup'
    if (/bank|account|deposit/.test(lower)) return 'bank_deposit'
    if (/mobile|wallet|gcash|mpesa|m_pesa|momo|airtel|tigo|orange|mtn|wave|chipper|ecocash|vodafone|bkash/.test(lower)) {
      return 'mobile_wallet'
    }

    return 'mobile_wallet' // SendWave default is mobile money
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
