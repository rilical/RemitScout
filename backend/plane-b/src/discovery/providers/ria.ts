/**
 * RIA Money Transfer discovery script.
 *
 * API-first approach:
 * - REST POST: hits public.riamoneytransfer.com/MoneyTransferCalculator/Calculate
 *   to probe corridor availability and delivery methods.
 * - No Playwright needed — pure HTTP API calls.
 *
 * Entry URL: https://www.riamoneytransfer.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// RIA supports many source countries — these are major ones
const KNOWN_SOURCE_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'NZ', 'FR', 'DE', 'IT', 'ES', 'NL',
  'BE', 'AT', 'IE', 'PT', 'FI', 'NO', 'SE', 'DK', 'CH', 'SG',
  'AE', 'HK', 'PL', 'CZ', 'RO', 'HU', 'GR', 'HR', 'BG', 'LT',
  'LV', 'EE', 'SK', 'SI', 'CY', 'MT', 'LU', 'JP', 'KR', 'ZA',
  'MY',
]

// Default currency per country
const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD',
  FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR',
  NO: 'NOK', SE: 'SEK', DK: 'DKK', CH: 'CHF', SG: 'SGD',
  AE: 'AED', HK: 'HKD', PL: 'PLN', CZ: 'CZK', RO: 'RON',
  HU: 'HUF', GR: 'EUR', HR: 'EUR', BG: 'BGN', LT: 'EUR',
  LV: 'EUR', EE: 'EUR', SK: 'EUR', SI: 'EUR', CY: 'EUR',
  MT: 'EUR', LU: 'EUR', JP: 'JPY', KR: 'KRW', ZA: 'ZAR',
  MY: 'MYR',
  MX: 'MXN', PH: 'PHP', IN: 'INR', NG: 'NGN', PK: 'PKR',
  BD: 'BDT', LK: 'LKR', GH: 'GHS', KE: 'KES', VN: 'VND',
  TH: 'THB', CN: 'CNY', ID: 'IDR', BR: 'BRL', CO: 'COP',
  PE: 'PEN', EG: 'EGP', MA: 'MAD', TZ: 'TZS', UG: 'UGX',
  RW: 'RWF', ET: 'ETB', CM: 'XAF', SN: 'XOF', GT: 'GTQ',
  HN: 'HNL', SV: 'USD', DO: 'DOP', JM: 'JMD', TR: 'TRY',
  UA: 'UAH', NP: 'NPR', EC: 'USD', BO: 'BOB', PY: 'PYG',
  NI: 'NIO', CR: 'CRC',
}

// RIA maps Kosovo as KV instead of XK
const COUNTRY_CODE_MAP: Record<string, string> = { XK: 'KV' }

const mapCountry = (code: string) => COUNTRY_CODE_MAP[code] ?? code

// High-traffic destinations to probe
export const RIA_PROBE_DESTINATIONS = [
  'MX', 'PH', 'IN', 'NG', 'PK', 'BD', 'LK', 'GH', 'KE', 'VN',
  'TH', 'CN', 'ID', 'BR', 'CO', 'PE', 'EG', 'MA', 'TZ', 'UG',
  'GT', 'HN', 'SV', 'DO', 'JM', 'TR', 'UA', 'NP', 'EC', 'AL',
  'RW',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const riaEndpoint = 'https://public.riamoneytransfer.com/MoneyTransferCalculator/Calculate'

// Response is nested under model.transferDetails
type RiaResponse = {
  model?: {
    transferDetails?: {
      calculations?: {
        exchangeRate?: number
        exchangeRatePromo?: number
        transferFee?: number
      }
      transferOptions?: {
        paymentMethods?: Array<{ value?: string; text?: string }>
        deliveryMethods?: Array<{ value?: string; text?: string }>
      }
    }
  }
}

export class RiaDiscovery extends ProviderDiscovery {
  constructor() {
    super('ria', 'RIA Money Transfer')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.riamoneytransfer.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('ria_source_countries_discovered', {
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

    for (const dest of RIA_PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue

      try {
        const resp = await fetch(riaEndpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'accept': '*/*',
            'user-agent': UA,
            'origin': 'https://www.riamoneytransfer.com',
            'referer': 'https://www.riamoneytransfer.com/',
            'client-type': 'PublicSite',
            'appversion': '4.0',
          },
          body: JSON.stringify({
            selections: {
              countryFrom: mapCountry(sourceCountry),
              countryTo: mapCountry(dest),
              currencyFrom: srcCurrency,
              currencyTo: destCurrency,
              amountFrom: 500,
              paymentMethod: 'BankAccount',
              deliveryMethod: 'BankDeposit',
              promoId: 0,
              shouldCalcAmountFrom: false,
              shouldCalcVariableRates: true,
              locale: 'en-us',
            },
          }),
        })

        if (resp.status === 429) {
          this.logger.warn('ria_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as RiaResponse
          const rate = data.model?.transferDetails?.calculations?.exchangeRate
          if (rate && rate > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('ria_dest_countries_discovered', {
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
      // Single call with shouldCalcVariableRates returns all delivery + payment methods
      const resp = await fetch(riaEndpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'accept': '*/*',
          'user-agent': UA,
          'origin': 'https://www.riamoneytransfer.com',
          'referer': 'https://www.riamoneytransfer.com/',
          'client-type': 'PublicSite',
          'appversion': '4.0',
        },
        body: JSON.stringify({
          selections: {
            countryFrom: mapCountry(srcCountry),
            countryTo: mapCountry(destCountry),
            currencyFrom: srcCurrency,
            currencyTo: destCurrency,
            amountFrom: 500,
            paymentMethod: 'BankAccount',
            deliveryMethod: 'BankDeposit',
            promoId: 0,
            shouldCalcAmountFrom: false,
            shouldCalcVariableRates: true,
            locale: 'en-us',
          },
        }),
      })

      if (resp.status !== 200) return methods

      const data = await resp.json() as RiaResponse
      const options = data.model?.transferDetails?.transferOptions
      if (!options) return methods

      const payinMethods = options.paymentMethods ?? []
      const payoutMethods = options.deliveryMethods ?? []

      for (const payout of payoutMethods) {
        const payoutCode = payout.value ?? 'BankDeposit'
        for (const payin of payinMethods) {
          const payinCode = payin.value ?? 'BankAccount'
          methods.push({
            corridorId,
            rawPayinLabel: payinCode,
            normalizedPayin: this.normalizePayin(payinCode),
            rawPayoutLabel: payoutCode,
            normalizedPayout: this.normalizePayout(payoutCode),
            unmapped: false,
          })
        }
      }
    } catch (err) {
      this.logger.warn('ria_method_discovery_error', {
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
      this.logger.warn('ria_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('ria_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayin(raw: string): string {
    const map: Record<string, string> = {
      BankAccount: 'bank_transfer',
      BankTransfer: 'bank_transfer',
      DirectDebit: 'bank_transfer',
      DebitCard: 'debit_card',
      CreditCard: 'credit_card',
      ApplePay: 'apple_pay',
      GooglePay: 'google_pay',
      Cash: 'cash',
    }
    return map[raw] ?? 'bank_transfer'
  }

  private normalizePayout(raw: string): string {
    const map: Record<string, string> = {
      BankDeposit: 'bank_deposit',
      BankAccount: 'bank_deposit',
      CashPayout: 'cash_pickup',
      CashPickup: 'cash_pickup',
      OfficePickup: 'cash_pickup',
      MobileWallet: 'mobile_wallet',
      MobilePayment: 'mobile_wallet',
    }
    return map[raw] ?? 'bank_deposit'
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
