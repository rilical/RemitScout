/**
 * TransferGo discovery script.
 *
 * API-first approach:
 * - REST: hits my.transfergo.com/api/booking/quotes to discover delivery
 *   options, fees, and promotional pricing per corridor.
 * - Response includes options[] with payIn/payOut codes, fee breakdowns,
 *   and promotion flags.
 * - European-focused provider with ~150 corridors.
 *
 * Entry URL: https://www.transfergo.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// TransferGo source countries (EU/EEA focused, from rights matrix)
const SOURCE_COUNTRIES = [
  'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'IE', 'PT',
  'FI', 'SE', 'NO', 'DK', 'PL', 'CZ', 'RO', 'HU', 'BG', 'HR',
  'SK', 'SI', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU', 'GR', 'CH',
  'AL', 'CR', 'IS', 'MC', 'MD', 'ME', 'SM', 'TR',
]

const COUNTRY_CURRENCY: Record<string, string> = {
  GB: 'GBP', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR',
  CY: 'EUR', MT: 'EUR', SI: 'EUR', SK: 'EUR', EE: 'EUR', LT: 'EUR',
  LV: 'EUR', LU: 'EUR', SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF',
  PL: 'PLN', CZ: 'CZK', RO: 'RON', HU: 'HUF', BG: 'BGN', HR: 'EUR',
  AL: 'ALL', CR: 'CRC', IS: 'ISK', MC: 'EUR', MD: 'MDL', ME: 'EUR',
  SM: 'EUR', TR: 'TRY',
  MX: 'MXN', PH: 'PHP', IN: 'INR', NG: 'NGN', PK: 'PKR', BD: 'BDT',
  UA: 'UAH', GH: 'GHS', KE: 'KES', TH: 'THB', VN: 'VND',
  CN: 'CNY', ZA: 'ZAR', BR: 'BRL', GE: 'GEL', MA: 'MAD', NP: 'NPR',
}

// Destinations to probe
const PROBE_DESTINATIONS = [
  'PL', 'TR', 'UA', 'IN', 'PH', 'NG', 'GH', 'KE', 'BD', 'PK',
  'TH', 'VN', 'CN', 'ZA', 'BR', 'GE', 'MA', 'NP', 'MX', 'RO',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

export class TransferGoDiscovery extends ProviderDiscovery {
  constructor() {
    super('transfergo', 'TransferGo')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.transfergo.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('transfergo_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const destinations: string[] = []
    const srcCurrency = COUNTRY_CURRENCY[sourceCountry] ?? 'EUR'

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue

      try {
        const url = new URL('https://my.transfergo.com/api/booking/quotes')
        url.searchParams.set('fromCurrencyCode', srcCurrency)
        url.searchParams.set('toCurrencyCode', destCurrency)
        url.searchParams.set('fromCountryCode', sourceCountry)
        url.searchParams.set('toCountryCode', dest)
        url.searchParams.set('amount', '500')
        url.searchParams.set('calculationBase', 'sendAmount')
        url.searchParams.set('business', '0')

        const resp = await fetch(url.toString(), {
          headers: { 'accept': 'application/json', 'user-agent': UA },
        })

        if (resp.status === 429) {
          this.logger.warn('transfergo_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as {
            options?: Array<{ availability?: { isAvailable?: boolean } }>
          }
          const available = (data.options ?? []).some(
            (o) => o.availability?.isAvailable !== false,
          )
          if (available) destinations.push(dest)
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('transfergo_dest_countries_discovered', {
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
      const url = new URL('https://my.transfergo.com/api/booking/quotes')
      url.searchParams.set('fromCurrencyCode', srcCurrency)
      url.searchParams.set('toCurrencyCode', destCurrency)
      url.searchParams.set('fromCountryCode', srcCountry)
      url.searchParams.set('toCountryCode', destCountry)
      url.searchParams.set('amount', '500')
      url.searchParams.set('calculationBase', 'sendAmount')
      url.searchParams.set('business', '0')

      const resp = await fetch(url.toString(), {
        headers: { 'accept': 'application/json', 'user-agent': UA },
      })

      if (resp.status !== 200) return methods

      const data = await resp.json() as {
        options?: Array<{
          payIn?: { code?: string }
          payOut?: { code?: string }
          availability?: { isAvailable?: boolean }
          fee?: { value?: number; valueBeforeDiscount?: number }
          promotion?: { isApplied?: boolean; isFxDiscountApplied?: boolean }
        }>
      }

      const seenPairs = new Set<string>()
      for (const opt of data.options ?? []) {
        if (opt.availability?.isAvailable === false) continue
        const payIn = opt.payIn?.code ?? 'BANK'
        const payOut = opt.payOut?.code ?? 'BANK'
        const key = `${payIn}→${payOut}`
        if (seenPairs.has(key)) continue
        seenPairs.add(key)

        methods.push({
          corridorId,
          rawPayinLabel: payIn,
          normalizedPayin: this.normalizePayin(payIn),
          rawPayoutLabel: payOut,
          normalizedPayout: this.normalizePayout(payOut),
          unmapped: false,
        })
      }
    } catch (err) {
      this.logger.warn('transfergo_method_discovery_error', {
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

      // API-based promo detection: check a sample corridor for fee discounts
      try {
        const resp = await fetch(
          'https://my.transfergo.com/api/booking/quotes?fromCurrencyCode=GBP&toCurrencyCode=PLN&fromCountryCode=GB&toCountryCode=PL&amount=500&calculationBase=sendAmount&business=0',
          { headers: { 'accept': 'application/json', 'user-agent': UA } },
        )
        if (resp.status === 200) {
          const data = await resp.json() as {
            options?: Array<{
              fee?: { value?: number; valueBeforeDiscount?: number }
              promotion?: { isApplied?: boolean; isFxDiscountApplied?: boolean }
              payIn?: { code?: string }
            }>
          }
          for (const opt of data.options ?? []) {
            const fee = opt.fee?.value
            const baseFee = opt.fee?.valueBeforeDiscount
            if (baseFee != null && fee != null && baseFee > fee) {
              promos.push({
                type: 'reduced_fee',
                corridorId: 'GB-PL-GBP-PLN',
                rawText: `Fee reduced from ${baseFee} to ${fee} on ${opt.payIn?.code}`,
                strikethroughDetected: false,
                originalValue: String(baseFee),
                promoValue: String(fee),
                expiresAt: null,
                bannerSelector: null,
              })
              break
            }
            if (opt.promotion?.isFxDiscountApplied) {
              promos.push({
                type: 'bonus_rate',
                corridorId: 'GB-PL-GBP-PLN',
                rawText: `FX discount applied on ${opt.payIn?.code}`,
                strikethroughDetected: false,
                originalValue: null,
                promoValue: null,
                expiresAt: null,
                bannerSelector: null,
              })
              break
            }
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('transfergo_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('transfergo_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayin(code: string): string {
    const map: Record<string, string> = {
      BANK: 'bank_transfer', BANK_TRANSFER: 'bank_transfer',
      DEBIT: 'debit_card', DEBIT_CARD: 'debit_card', CARD: 'debit_card',
      CREDIT: 'credit_card', CREDIT_CARD: 'credit_card',
      OPEN_BANKING: 'bank_transfer',
      APPLE_PAY: 'apple_pay', GOOGLE_PAY: 'google_pay',
    }
    return map[code.toUpperCase()] ?? 'bank_transfer'
  }

  private normalizePayout(code: string): string {
    const map: Record<string, string> = {
      IBAN: 'bank_deposit', BANK: 'bank_deposit', AC: 'bank_deposit',
      CARD: 'bank_deposit', BANK_ACCOUNT: 'bank_deposit',
      CASH: 'cash_pickup', CASH_PICKUP: 'cash_pickup',
      WALLET: 'mobile_wallet', MOBILE: 'mobile_wallet',
      AIRTIME: 'airtime',
    }
    return map[code.toUpperCase()] ?? 'bank_deposit'
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
