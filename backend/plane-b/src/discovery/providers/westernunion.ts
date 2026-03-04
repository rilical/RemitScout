/**
 * Western Union discovery script.
 *
 * API-first approach:
 * - REST: hits westernunion.com/wuconnect/prices/catalog to discover
 *   service groups (delivery methods), payment methods, fees, and promos.
 * - Response contains services_groups[] → pay_groups[] with full pricing.
 * - Promo detection: promotional_fx_rate field + net_fee < gross_fee.
 * - Largest corridor space (99k+); we sample high-traffic corridors.
 *
 * Entry URL: https://www.westernunion.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// WU source countries (major send markets)
const SOURCE_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE',
  'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'NZ',
  'SG', 'JP', 'AE', 'SA', 'KW', 'QA', 'HK',
]

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', DE: 'EUR', FR: 'EUR',
  IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', CH: 'CHF',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', FI: 'EUR', IE: 'EUR', PT: 'EUR',
  GR: 'EUR', NZ: 'NZD', SG: 'SGD', JP: 'JPY', AE: 'AED', SA: 'SAR',
  KW: 'KWD', QA: 'QAR', HK: 'HKD',
  MX: 'MXN', PH: 'PHP', IN: 'INR', NG: 'NGN', PK: 'PKR',
  BD: 'BDT', GH: 'GHS', KE: 'KES', EG: 'EGP', MA: 'MAD',
  CO: 'COP', GT: 'GTQ', SV: 'USD', HN: 'HNL', DO: 'DOP',
  JM: 'JMD', TH: 'THB', VN: 'VND', CN: 'CNY', UA: 'UAH',
}

const PROBE_DESTINATIONS = [
  'MX', 'PH', 'IN', 'NG', 'PK', 'BD', 'GH', 'KE', 'EG', 'MA',
  'CO', 'GT', 'SV', 'HN', 'DO', 'JM', 'TH', 'VN', 'CN', 'UA',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

// WU service code → canonical delivery method
const SERVICE_CODE_MAP: Record<string, string> = {
  '000': 'cash_pickup',
  '001': 'bank_deposit', '002': 'bank_deposit',
  '500': 'bank_deposit', '501': 'bank_deposit',
  '050': 'mobile_wallet', '801': 'mobile_wallet',
  '100': 'home_delivery', '700': 'home_delivery',
  '115': 'bank_deposit', // UPI → treat as bank deposit
  '080': 'debit_card', // Prepaid card
}

// WU fund_in code → canonical payin method
const FUND_IN_MAP: Record<string, string> = {
  BA: 'bank_transfer', AC: 'bank_transfer',
  CC: 'credit_card', DC: 'debit_card',
  CA: 'cash', AP: 'apple_pay', GP: 'google_pay',
}

export class WesternUnionDiscovery extends ProviderDiscovery {
  constructor() {
    super('westernunion', 'Western Union')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.westernunion.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('wu_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
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
        const resp = await this.callWuCatalog(
          sourceCountry, srcCurrency, dest, destCurrency, 500,
        )

        if (resp === 'rate_limited') {
          this.logger.warn('wu_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp && (resp.services_groups ?? []).length > 0) {
          destinations.push(dest)
        }

        await new Promise((r) => setTimeout(r, 800))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('wu_dest_countries_discovered', {
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
      const data = await this.callWuCatalog(
        srcCountry, srcCurrency, destCountry, destCurrency, 500,
      )
      if (!data || data === 'rate_limited') return methods

      const seenPairs = new Set<string>()
      for (const sg of data.services_groups ?? []) {
        const serviceCode = sg.service ?? '000'
        const normalizedPayout = SERVICE_CODE_MAP[serviceCode] ?? 'cash_pickup'

        for (const pg of sg.pay_groups ?? []) {
          const fundIn = pg.fund_in ?? 'BA'
          const normalizedPayin = FUND_IN_MAP[fundIn] ?? 'bank_transfer'
          const key = `${normalizedPayin}→${normalizedPayout}`
          if (seenPairs.has(key)) continue
          seenPairs.add(key)

          methods.push({
            corridorId,
            rawPayinLabel: fundIn,
            normalizedPayin,
            rawPayoutLabel: `${serviceCode}:${sg.service_name ?? ''}`,
            normalizedPayout,
            unmapped: false,
          })
        }
      }
    } catch (err) {
      this.logger.warn('wu_method_discovery_error', {
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
      // Page-based detection
      const content = await browser.content()
      const promoPatterns: Array<{ regex: RegExp; type: DiscoveredPromotionType }> = [
        { regex: /first\s+transfer\s+free/i, type: 'first_transfer' },
        { regex: /(?:no|zero)\s*(?:transfer\s+)?fee/i, type: 'zero_fee' },
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

      // API-based promo detection on sample corridor
      try {
        const data = await this.callWuCatalog('US', 'USD', 'MX', 'MXN', 500)
        if (data && data !== 'rate_limited') {
          for (const sg of data.services_groups ?? []) {
            for (const pg of sg.pay_groups ?? []) {
              // Check for promotional FX rate
              const promoRate = pg.promotional_fx_rate ?? pg.promo_fx_rate
              if (promoRate && pg.fx_rate && promoRate !== pg.fx_rate) {
                promos.push({
                  type: 'bonus_rate',
                  corridorId: 'US-MX-USD-MXN',
                  rawText: `Promo rate ${promoRate} vs base ${pg.fx_rate} on ${sg.service_name}`,
                  strikethroughDetected: false,
                  originalValue: String(pg.fx_rate),
                  promoValue: String(promoRate),
                  expiresAt: null,
                  bannerSelector: null,
                })
                break
              }
              // Check for fee discount (net_fee < gross_fee)
              if (pg.net_fee != null && pg.gross_fee != null && pg.net_fee < pg.gross_fee) {
                promos.push({
                  type: 'reduced_fee',
                  corridorId: 'US-MX-USD-MXN',
                  rawText: `Fee reduced from ${pg.gross_fee} to ${pg.net_fee} on ${sg.service_name}`,
                  strikethroughDetected: false,
                  originalValue: String(pg.gross_fee),
                  promoValue: String(pg.net_fee),
                  expiresAt: null,
                  bannerSelector: null,
                })
                break
              }
            }
            if (promos.length > 0) break
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('wu_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('wu_promos_detected', { count: promos.length })
    return promos
  }

  private async callWuCatalog(
    srcCountry: string,
    srcCurrency: string,
    destCountry: string,
    destCurrency: string,
    amount: number,
  ): Promise<WuCatalogResponse | 'rate_limited' | null> {
    const resp = await fetch(
      'https://www.westernunion.com/wuconnect/prices/catalog',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': UA,
        },
        body: JSON.stringify({
          header_request: { version: '0.5', request_type: 'PRICECATALOG' },
          sender: {
            client: 'WUCOM',
            channel: 'WWEB',
            funds_in: '*',
            curr_iso3: srcCurrency,
            cty_iso2_ext: srcCountry,
            send_amount: String(amount),
          },
          receiver: {
            curr_iso3: destCurrency,
            cty_iso2_ext: destCountry,
            cty_iso2: destCountry,
          },
        }),
      },
    )

    if (resp.status === 429) return 'rate_limited'
    if (resp.status !== 200) return null

    return resp.json() as Promise<WuCatalogResponse>
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}

type WuCatalogResponse = {
  services_groups?: Array<{
    service?: string
    service_name?: string
    pay_groups?: Array<{
      fund_in?: string
      fx_rate?: number
      promotional_fx_rate?: number
      promo_fx_rate?: number
      gross_fee?: number
      net_fee?: number
    }>
  }>
}
