/**
 * WorldRemit discovery script.
 *
 * API-first approach:
 * - GraphQL: hits api.worldremit.com/graphql to discover payout methods
 *   and calculate quotes with fee/rate/promo data per corridor.
 * - No Playwright needed — pure HTTP API calls.
 *
 * Entry URL: https://www.worldremit.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// WorldRemit uses these source countries (from supported-corridors.ts)
const KNOWN_SOURCE_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'NZ', 'FR', 'DE', 'IT', 'ES', 'NL',
  'BE', 'AT', 'IE', 'PT', 'FI', 'NO', 'SE', 'DK', 'CH', 'SG',
  'JP', 'ZA', 'AE', 'HK',
]

// Default currency per country for API calls
const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD',
  FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR',
  NO: 'NOK', SE: 'SEK', DK: 'DKK', CH: 'CHF', SG: 'SGD',
  JP: 'JPY', ZA: 'ZAR', AE: 'AED', HK: 'HKD',
  MX: 'MXN', PH: 'PHP', IN: 'INR', NG: 'NGN', PK: 'PKR',
  BD: 'BDT', LK: 'LKR', GH: 'GHS', KE: 'KES', VN: 'VND',
  TH: 'THB', CN: 'CNY', ID: 'IDR', MY: 'MYR', BR: 'BRL',
  CO: 'COP', PE: 'PEN', EG: 'EGP', MA: 'MAD', TZ: 'TZS',
  UG: 'UGX', RW: 'RWF', ET: 'ETB', CM: 'XAF', SN: 'XOF',
}

// Sample destinations for discovery (high-traffic corridors)
const PROBE_DESTINATIONS = [
  'MX', 'PH', 'IN', 'NG', 'PK', 'BD', 'LK', 'GH', 'KE', 'VN',
  'TH', 'CN', 'ID', 'MY', 'BR', 'CO', 'PE', 'EG', 'MA', 'TZ',
  'UG', 'RW', 'ET', 'CM', 'SN', 'ZA', 'TR', 'UA', 'JO', 'NP',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const PAYOUT_METHODS_QUERY = `
  query PayoutMethods($sendCountry: CountryCode!, $receiveCountry: CountryCode!, $receiveCurrency: CurrencyCode!) {
    payOutMethods(
      payOutMethodsInput: {sendCountry: $sendCountry, receiveCountry: $receiveCountry, receiveCurrency: $receiveCurrency}
    ) {
      code
      payOutTimeEstimate
    }
  }
`

export class WorldRemitDiscovery extends ProviderDiscovery {
  constructor() {
    super('worldremit', 'WorldRemit')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.worldremit.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('worldremit_source_countries_discovered', {
      count: KNOWN_SOURCE_COUNTRIES.length,
    })
    return [...KNOWN_SOURCE_COUNTRIES]
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
        const resp = await fetch('https://api.worldremit.com/graphql', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'user-agent': UA,
            'origin': 'https://www.worldremit.com',
            'referer': 'https://www.worldremit.com/',
            'x-wr-platform': 'Web',
          },
          body: JSON.stringify({
            operationName: 'PayoutMethods',
            query: PAYOUT_METHODS_QUERY,
            variables: {
              sendCountry: sourceCountry,
              receiveCountry: dest,
              receiveCurrency: destCurrency,
            },
          }),
        })

        if (resp.status === 429) {
          this.logger.warn('worldremit_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as {
            data?: { payOutMethods?: Array<{ code?: string }> }
          }
          if ((data.data?.payOutMethods ?? []).length > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('worldremit_dest_countries_discovered', {
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
      const resp = await fetch('https://api.worldremit.com/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': UA,
          'origin': 'https://www.worldremit.com',
          'referer': 'https://www.worldremit.com/',
          'x-wr-platform': 'Web',
        },
        body: JSON.stringify({
          operationName: 'PayoutMethods',
          query: PAYOUT_METHODS_QUERY,
          variables: {
            sendCountry: srcCountry,
            receiveCountry: destCountry,
            receiveCurrency: destCurrency,
          },
        }),
      })

      if (resp.status !== 200) return methods

      const data = await resp.json() as {
        data?: {
          payOutMethods?: Array<{ code?: string; name?: string }>
        }
      }

      const seenCodes = new Set<string>()
      for (const m of data.data?.payOutMethods ?? []) {
        const code = m.code ?? 'UNKNOWN'
        if (seenCodes.has(code)) continue
        seenCodes.add(code)

        methods.push({
          corridorId,
          rawPayinLabel: 'BANK_TRANSFER',
          normalizedPayin: 'bank_transfer',
          rawPayoutLabel: code,
          normalizedPayout: this.normalizePayout(code),
          unmapped: false,
        })
      }
    } catch (err) {
      this.logger.warn('worldremit_method_discovery_error', {
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
        { regex: /promo(?:tion)?|special\s+offer/i, type: 'unknown' },
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
      this.logger.warn('worldremit_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('worldremit_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayout(code: string): string {
    const map: Record<string, string> = {
      BNK: 'bank_deposit', BANK: 'bank_deposit',
      CSH: 'cash_pickup', CASH: 'cash_pickup',
      MOB: 'mobile_wallet', MOBILE_WALLET: 'mobile_wallet',
      ATP: 'airtime', AIRTIME: 'airtime',
    }
    return map[code.toUpperCase()] ?? 'bank_deposit'
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
