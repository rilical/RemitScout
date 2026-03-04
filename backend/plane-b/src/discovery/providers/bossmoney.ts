/**
 * BossMoney discovery script.
 *
 * API-first approach:
 * - POST: hits api.idtm.io/money-transfer/public/transfer/promo-calculation
 *   to discover corridors and delivery methods.
 * - Three source countries: US/USD, CA/CAD, AU/AUD.
 * - Requires sender_state_code (defaults to NJ/ON/NSW by country).
 * - Response: { pricing_fee: { fees_by_payment_method[] }, fx_rates: { sell_rate },
 *              amounts: { sender, recipient } }
 * - Payment methods from pricing_fee.fees_by_payment_method[].payment_method
 *   (credit, debit, mobile-pay, ach, boss-money-wallet).
 *
 * Entry URL: https://www.bossmoney.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

const SOURCE_COUNTRIES = ['US', 'CA', 'AU']

const SOURCE_CURRENCY: Record<string, string> = {
  US: 'USD',
  CA: 'CAD',
  AU: 'AUD',
}

// Default state codes per source country
const DEFAULT_STATE: Record<string, string> = {
  US: 'NJ',
  CA: 'ON',
  AU: 'NSW',
}

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', CA: 'CAD', AU: 'AUD',
  GN: 'GNF', BD: 'BDT', BJ: 'XOF', BO: 'BOB', BR: 'BRL', BF: 'XOF',
  CM: 'XAF', CO: 'COP', CR: 'CRC', CD: 'USD', DO: 'DOP', EC: 'USD',
  SV: 'USD', ER: 'ERN', ET: 'ETB', FR: 'EUR', DE: 'EUR', GH: 'GHS',
  GM: 'GMD', GR: 'EUR', GT: 'GTQ', HT: 'HTG', HN: 'HNL', IN: 'INR',
  IE: 'EUR', IT: 'EUR', CI: 'XOF', JM: 'JMD', KE: 'KES', LR: 'USD',
  MG: 'MGA', MW: 'MWK', MX: 'MXN', MZ: 'MZN', NP: 'NPR', NL: 'EUR',
  NI: 'USD', NG: 'NGN', PA: 'USD', PE: 'PEN', PH: 'PHP', PK: 'PKR',
  PT: 'EUR', RW: 'RWF', SN: 'XOF', SL: 'SLE', ES: 'EUR', TG: 'XOF',
  UG: 'UGX', GB: 'GBP', VE: 'VES', ZW: 'USD',
}

// All destinations from rights matrix
const PROBE_DESTINATIONS = [
  'GN', 'BD', 'BJ', 'BO', 'BR', 'BF', 'CM', 'CO', 'CR', 'CD',
  'DO', 'EC', 'SV', 'ER', 'ET', 'FR', 'DE', 'GH', 'GM', 'GR',
  'GT', 'HT', 'HN', 'IN', 'IE', 'IT', 'CI', 'JM', 'KE', 'LR',
  'MG', 'MW', 'MX', 'MZ', 'NP', 'NL', 'NI', 'NG', 'PA', 'PE',
  'PH', 'PK', 'PT', 'RW', 'SN', 'SL', 'ES', 'TG', 'UG', 'GB',
  'VE', 'ZW',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const QUOTES_ENDPOINT = 'https://api.idtm.io/money-transfer/public/transfer/promo-calculation'

type BossMoneyPaymentMethod = {
  payment_method?: string | null
  fee?: string | null
  status?: string | null
  is_enabled?: boolean | null
}

type BossMoneyResponse = {
  pricing_fee?: {
    fee?: string | null
    fees_by_payment_method?: BossMoneyPaymentMethod[] | null
  } | null
  promo_fee?: {
    fee?: string | null
    expiration_date?: number | null
  } | null
  fx_rates?: {
    sell_rate?: string | null
    base_sell_rate?: string | null
  } | null
  amounts?: {
    sender?: string | null
    recipient?: string | null
  } | null
}

const BOSSMONEY_HEADERS = {
  'accept': 'application/json',
  'accept-language': 'en-US',
  'content-type': 'application/json',
  'origin': 'https://www.bossmoney.com',
  'referer': 'https://www.bossmoney.com/',
  'user-agent': UA,
}

export class BossMoneyDiscovery extends ProviderDiscovery {
  constructor() {
    super('bossmoney', 'BossMoney')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.bossmoney.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('bossmoney_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const destinations: string[] = []
    const srcCurrency = SOURCE_CURRENCY[sourceCountry]
    if (!srcCurrency) return destinations

    const stateCode = DEFAULT_STATE[sourceCountry] ?? 'NJ'

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue

      try {
        const body = {
          amount_type: 'sender',
          recipient_country_code: dest,
          recipient_currency_code: destCurrency,
          sender_country_code: sourceCountry,
          sender_currency_code: srcCurrency,
          sender_state_code: stateCode,
          send_amount: '500.00',
        }

        const resp = await fetch(QUOTES_ENDPOINT, {
          method: 'POST',
          headers: BOSSMONEY_HEADERS,
          body: JSON.stringify(body),
        })

        if (resp.status === 429) {
          this.logger.warn('bossmoney_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as BossMoneyResponse
          const rate = parseFloat(data.fx_rates?.sell_rate ?? '0')
          if (rate > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('bossmoney_dest_countries_discovered', {
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

    const stateCode = DEFAULT_STATE[srcCountry] ?? 'NJ'

    try {
      const body = {
        amount_type: 'sender',
        recipient_country_code: destCountry,
        recipient_currency_code: destCurrency,
        sender_country_code: srcCountry,
        sender_currency_code: srcCurrency,
        sender_state_code: stateCode,
        send_amount: '500.00',
      }

      const resp = await fetch(QUOTES_ENDPOINT, {
        method: 'POST',
        headers: BOSSMONEY_HEADERS,
        body: JSON.stringify(body),
      })

      if (resp.status !== 200) return methods

      const data = await resp.json() as BossMoneyResponse
      const paymentMethods = data.pricing_fee?.fees_by_payment_method ?? []

      if (paymentMethods.length > 0) {
        const seenMethods = new Set<string>()
        for (const pm of paymentMethods) {
          const rawPayin = pm.payment_method ?? 'bank'
          if (seenMethods.has(rawPayin)) continue
          seenMethods.add(rawPayin)

          methods.push({
            corridorId,
            rawPayinLabel: rawPayin,
            normalizedPayin: this.normalizePayin(rawPayin),
            rawPayoutLabel: 'bank_account',
            normalizedPayout: 'bank_deposit',
            unmapped: false,
          })
        }
      } else {
        methods.push({
          corridorId,
          rawPayinLabel: 'bank',
          normalizedPayin: 'bank_transfer',
          rawPayoutLabel: 'bank_account',
          normalizedPayout: 'bank_deposit',
          unmapped: false,
        })
      }
    } catch (err) {
      this.logger.warn('bossmoney_method_discovery_error', {
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

      // API-based promo: check sell_rate vs base_sell_rate
      try {
        const body = {
          amount_type: 'sender',
          recipient_country_code: 'MX',
          recipient_currency_code: 'MXN',
          sender_country_code: 'US',
          sender_currency_code: 'USD',
          sender_state_code: 'NJ',
          send_amount: '500.00',
        }
        const resp = await fetch(QUOTES_ENDPOINT, {
          method: 'POST',
          headers: BOSSMONEY_HEADERS,
          body: JSON.stringify(body),
        })
        if (resp.status === 200) {
          const data = await resp.json() as BossMoneyResponse
          const sellRate = parseFloat(data.fx_rates?.sell_rate ?? '0')
          const baseRate = parseFloat(data.fx_rates?.base_sell_rate ?? '0')
          if (sellRate > 0 && baseRate > 0 && sellRate > baseRate) {
            promos.push({
              type: 'bonus_rate',
              corridorId: 'US-MX-USD-MXN',
              rawText: `Promo rate ${sellRate} vs base ${baseRate}`,
              strikethroughDetected: false,
              originalValue: String(baseRate),
              promoValue: String(sellRate),
              expiresAt: null,
              bannerSelector: null,
            })
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('bossmoney_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('bossmoney_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayin(raw: string): string {
    const lower = raw.toLowerCase()
    if (/credit/.test(lower)) return 'credit_card'
    if (/debit/.test(lower)) return 'debit_card'
    if (/ach|bank/.test(lower)) return 'bank_transfer'
    if (/apple/.test(lower)) return 'apple_pay'
    if (/google/.test(lower)) return 'google_pay'
    if (/mobile/.test(lower)) return 'apple_pay'
    return 'bank_transfer'
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
