/**
 * Intermex discovery script.
 *
 * API-first approach:
 * - GET: hits api.imxi.com/pricing/api/v3/feesrates
 *   with DestCountryAbbr, DestCurrency, OriCountryAbbr, OriStateAbbr, StyleId,
 *   TranTypeId, DeliveryType, OriCurrency, ChannelId, OriAmount, DestAmount,
 *   and SenderPaymentMethodId params.
 * - 1 source country: US (Intermex's primary market).
 * - 35 destination countries (Latin America and Asia focused).
 * - Two payout types probed: TranTypeId=1 (cash_pickup), TranTypeId=3 (bank_deposit).
 * - Two payin types probed: SenderPaymentMethodId=3 (debit_card), SenderPaymentMethodId=4 (credit_card).
 * - Response: JSON with rate/fee fields indicating corridor availability.
 *
 * Entry URL: https://www.intermexonline.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// Intermex source countries (primary market is US)
const SOURCE_COUNTRIES = ['US']

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD',
  MX: 'MXN', GT: 'GTQ', HN: 'HNL', SV: 'USD', DO: 'DOP', CO: 'COP',
  EC: 'USD', NI: 'NIO', BR: 'BRL', PE: 'PEN', PY: 'PYG', BO: 'BOB',
  CR: 'CRC', PA: 'USD', CL: 'CLP', AR: 'ARS', UY: 'UYU', VE: 'VES',
  JM: 'JMD', TT: 'TTD', GY: 'GYD', HT: 'HTG', BZ: 'BZD',
  IN: 'INR', PH: 'PHP', PK: 'PKR', BD: 'BDT', NP: 'NPR', LK: 'LKR',
  GH: 'GHS', KE: 'KES', NG: 'NGN', UG: 'UGX', SN: 'XOF', CM: 'XAF',
}

// Intermex destination countries to probe (Latin America focus + Asia/Africa)
const PROBE_DESTINATIONS = [
  'MX', 'GT', 'HN', 'SV', 'DO', 'CO', 'EC', 'NI', 'BR', 'PE',
  'PY', 'BO', 'CR', 'PA', 'CL', 'AR', 'UY', 'VE', 'JM', 'TT',
  'GY', 'HT', 'BZ', 'IN', 'PH', 'PK', 'BD', 'NP', 'LK',
  'GH', 'KE', 'NG', 'UG', 'SN', 'CM',
]

// Payout types to probe (TranTypeId → canonical label)
const PAYOUT_TYPES = [
  { tranTypeId: '1', canonical: 'cash_pickup' },
  { tranTypeId: '3', canonical: 'bank_deposit' },
]

// Payin types to probe (SenderPaymentMethodId → canonical label)
const PAYIN_TYPES = [
  { paymentMethodId: '3', canonical: 'debit_card' },
  { paymentMethodId: '4', canonical: 'credit_card' },
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const FEES_RATES_ENDPOINT = 'https://api.imxi.com/pricing/api/v3/feesrates'

const INTERMEX_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'channelid': '1',
  'languageid': '1',
  'partnerid': '1',
  'ocp-apim-subscription-key': '2162a586e2164623a1cd9b6b2d300b4c',
  'origin': 'https://www.intermexonline.com',
  'referer': 'https://www.intermexonline.com/',
  'user-agent': UA,
}

type IntermexResponse = {
  ExchangeRate?: number | string | null
  Fee?: number | string | null
  TotalFee?: number | string | null
  DestinationAmount?: number | string | null
  OriginAmount?: number | string | null
  ErrorCode?: number | null
  ErrorMessage?: string | null
}

export class IntermexDiscovery extends ProviderDiscovery {
  constructor() {
    super('intermex', 'Intermex')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.intermexonline.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('intermex_source_countries_discovered', {
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
          DestCountryAbbr: dest,
          DestCurrency: destCurrency,
          OriCountryAbbr: 'USA',
          OriStateAbbr: 'PA',
          StyleId: '3',
          TranTypeId: '1',
          DeliveryType: 'W',
          OriCurrency: 'USD',
          ChannelId: '1',
          OriAmount: '500',
          DestAmount: '0',
          SenderPaymentMethodId: '3',
        })
        const url = `${FEES_RATES_ENDPOINT}?${params.toString()}`

        const resp = await fetch(url, { headers: INTERMEX_HEADERS })

        if (resp.status === 429) {
          this.logger.warn('intermex_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as IntermexResponse
          const rate = data.ExchangeRate
          const hasError = data.ErrorCode != null && data.ErrorCode !== 0
          if (rate != null && !hasError) {
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
      this.logger.info('intermex_dest_countries_static_fallback', {
        sourceCountry,
        count: staticDests.length,
      })
      return staticDests
    }

    this.logger.info('intermex_dest_countries_discovered', {
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
    const [_srcCountry, destCountry, _srcCurrency, destCurrency] = parts

    // Probe each combination of payout type and payin type
    for (const payout of PAYOUT_TYPES) {
      for (const payin of PAYIN_TYPES) {
        try {
          const params = new URLSearchParams({
            DestCountryAbbr: destCountry,
            DestCurrency: destCurrency,
            OriCountryAbbr: 'USA',
            OriStateAbbr: 'PA',
            StyleId: '3',
            TranTypeId: payout.tranTypeId,
            DeliveryType: 'W',
            OriCurrency: 'USD',
            ChannelId: '1',
            OriAmount: '500',
            DestAmount: '0',
            SenderPaymentMethodId: payin.paymentMethodId,
          })
          const url = `${FEES_RATES_ENDPOINT}?${params.toString()}`

          const resp = await fetch(url, { headers: INTERMEX_HEADERS })

          if (resp.status === 429) {
            this.logger.warn('intermex_rate_limited_methods', { corridorId })
            return methods
          }

          if (resp.status === 200) {
            const data = await resp.json() as IntermexResponse
            const rate = data.ExchangeRate
            const hasError = data.ErrorCode != null && data.ErrorCode !== 0
            if (rate != null && !hasError) {
              methods.push({
                corridorId,
                rawPayinLabel: payin.canonical,
                normalizedPayin: payin.canonical,
                rawPayoutLabel: payout.canonical,
                normalizedPayout: payout.canonical,
                unmapped: false,
              })
            }
          }

          await new Promise((r) => setTimeout(r, 300))
        } catch {
          // Skip on error
        }
      }
    }

    // If no methods found, default to debit_card + bank_deposit
    if (methods.length === 0) {
      methods.push({
        corridorId,
        rawPayinLabel: 'debit_card',
        normalizedPayin: 'debit_card',
        rawPayoutLabel: 'bank_deposit',
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
        { regex: /promo(?:tion(?:al)?)?|limited[\s-]+time\s+offer/i, type: 'unknown' },
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

      // API-based promo: check if fee returns 0 on a known corridor
      try {
        const params = new URLSearchParams({
          DestCountryAbbr: 'MX',
          DestCurrency: 'MXN',
          OriCountryAbbr: 'USA',
          OriStateAbbr: 'PA',
          StyleId: '3',
          TranTypeId: '3',
          DeliveryType: 'W',
          OriCurrency: 'USD',
          ChannelId: '1',
          OriAmount: '500',
          DestAmount: '0',
          SenderPaymentMethodId: '3',
        })
        const url = `${FEES_RATES_ENDPOINT}?${params.toString()}`
        const resp = await fetch(url, { headers: INTERMEX_HEADERS })
        if (resp.status === 200) {
          const data = await resp.json() as IntermexResponse
          const fee = parseFloat(String(data.Fee ?? '1'))
          if (fee === 0) {
            promos.push({
              type: 'zero_fee',
              corridorId: 'US-MX-USD-MXN',
              rawText: 'API returned fee=0 for US→MX',
              strikethroughDetected: false,
              originalValue: null,
              promoValue: '$0.00',
              expiresAt: null,
              bannerSelector: null,
            })
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('intermex_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('intermex_promos_detected', { count: promos.length })
    return promos
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
