/**
 * KoronaPay discovery script.
 *
 * API-first approach:
 * - GET: hits koronapay.com/api/transfers/tariffs
 *   with sendingCountryId (ISO 3166-1 alpha-3), receivingCountryId (alpha-3),
 *   sendingCurrencyId (numeric ISO 4217), receivingCurrencyId (numeric),
 *   sendingAmount (in minor units), paymentMethod, receivingMethod,
 *   and paidNotificationEnabled params.
 * - 10 source countries probed (Western/Northern European focus).
 * - 33 destination countries (CIS, Asia, MENA, LATAM).
 * - Payout types probed: cash (cash_pickup), card (bank_deposit).
 * - Response: JSON array of tariff objects; non-empty array = corridor supported.
 *
 * Note: KoronaPay uses ISO 3166-1 alpha-3 country codes and numeric
 * ISO 4217 currency codes in its API. Internal helpers translate
 * ISO 2-letter codes used throughout the discovery system.
 *
 * Entry URL: https://koronapay.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// KoronaPay source countries to probe (Western/Northern Europe)
const SOURCE_COUNTRIES = ['DE', 'GB', 'FR', 'ES', 'IT', 'AT', 'NL', 'PL', 'SE', 'NO']

const COUNTRY_CURRENCY: Record<string, string> = {
  DE: 'EUR', GB: 'GBP', FR: 'EUR', ES: 'EUR', IT: 'EUR', AT: 'EUR',
  NL: 'EUR', PL: 'PLN', SE: 'SEK', NO: 'NOK', BE: 'EUR', BG: 'BGN',
  CZ: 'CZK', DK: 'DKK', EE: 'EUR', FI: 'EUR', GR: 'EUR', HR: 'EUR',
  HU: 'HUF', IE: 'EUR', LT: 'EUR', LU: 'EUR', LV: 'EUR', MT: 'EUR',
  PT: 'EUR', RO: 'RON', SI: 'EUR', SK: 'EUR', CY: 'EUR', IS: 'ISK',
  LI: 'CHF', TR: 'TRY',
  IN: 'INR', PH: 'PHP', BD: 'BDT', PK: 'PKR', VN: 'VND', CN: 'CNY',
  UZ: 'UZS', KG: 'KGS', TJ: 'TJS', GE: 'GEL', AZ: 'AZN', AM: 'AMD',
  KZ: 'KZT', MN: 'MNT', BY: 'BYN', MD: 'MDL', UA: 'UAH', RU: 'RUB',
  AE: 'AED', BH: 'BHD', QA: 'QAR', OM: 'OMR', MA: 'MAD', TN: 'TND',
  DZ: 'DZD', EG: 'EGP', MX: 'MXN', BR: 'BRL', ID: 'IDR', MY: 'MYR',
  IL: 'ILS', HK: 'HKD',
}

// KoronaPay destination countries to probe
const PROBE_DESTINATIONS = [
  'IN', 'PH', 'BD', 'PK', 'VN', 'CN', 'UZ', 'KG', 'TJ', 'GE',
  'AZ', 'AM', 'KZ', 'MN', 'BY', 'MD', 'UA', 'AE', 'BH', 'QA',
  'OM', 'MA', 'TN', 'DZ', 'EG', 'MX', 'BR', 'ID', 'MY', 'IL',
  'HK', 'TR', 'RU',
]

// ISO 3166-1 alpha-2 → KoronaPay alpha-3 country code
const ISO2_TO_KORONA: Record<string, string> = {
  DE: 'DEU', GB: 'GBR', FR: 'FRA', ES: 'ESP', IT: 'ITA', AT: 'AUT',
  NL: 'NLD', PL: 'POL', SE: 'SWE', NO: 'NOR',
  IN: 'IND', PH: 'PHL', BD: 'BGD', PK: 'PAK', VN: 'VNM', CN: 'CHN',
  UZ: 'UZB', KG: 'KGZ', TJ: 'TJK', GE: 'GEO', AZ: 'AZE', AM: 'ARM',
  KZ: 'KAZ', MN: 'MNG', BY: 'BLR', MD: 'MDA', UA: 'UKR', RU: 'RUS',
  AE: 'ARE', BH: 'BHR', QA: 'QAT', OM: 'OMN', MA: 'MAR', TN: 'TUN',
  DZ: 'DZA', EG: 'EGY', MX: 'MEX', BR: 'BRA', ID: 'IDN', MY: 'MYS',
  IL: 'ISR', HK: 'HKG', TR: 'TUR',
}

// ISO 4217 alpha → numeric code (KoronaPay API requirement)
const CURRENCY_NUMERIC: Record<string, string> = {
  EUR: '978', GBP: '826', PLN: '985', SEK: '752', NOK: '578',
  INR: '356', PHP: '608', BDT: '050', PKR: '586', VND: '704',
  CNY: '156', UZS: '860', KGS: '417', TJS: '972', GEL: '981',
  AZN: '944', AMD: '051', KZT: '398', MNT: '496', BYN: '933',
  MDL: '498', UAH: '980', RUB: '643', AED: '784', BHD: '048',
  QAR: '634', OMR: '512', MAD: '504', TND: '788', DZD: '012',
  EGP: '818', MXN: '484', BRL: '986', IDR: '360', MYR: '458',
  ILS: '376', HKD: '344', TRY: '949', USD: '840',
}

// Payout methods to probe (receivingMethod → canonical label)
const PAYOUT_TYPES = [
  { receivingMethod: 'cash', canonical: 'cash_pickup' },
  { receivingMethod: 'card', canonical: 'bank_deposit' },
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const TARIFFS_ENDPOINT = 'https://koronapay.com/api/transfers/tariffs'

const KORONAPAY_HEADERS = {
  'accept': 'application/vnd.cft-data.v2.152+json',
  'pragma': 'no-cache',
  'cache-control': 'no-cache',
  'referer': 'https://koronapay.com/transfers/europe/en/',
  'user-agent': UA,
  'x-application': 'Qpay-Web/3.0',
}

type KoronaPayTariff = {
  sendingCurrency?: { id?: number | string | null } | null
  receivingCurrency?: { id?: number | string | null } | null
  exchangeRate?: number | string | null
  sendingAmountRange?: { min?: number | null; max?: number | null } | null
}

export class KoronaPayDiscovery extends ProviderDiscovery {
  constructor() {
    super('koronapay', 'KoronaPay')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://koronapay.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('koronapay_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const destinations: string[] = []

    const srcKorona = ISO2_TO_KORONA[sourceCountry]
    if (!srcKorona) return destinations
    const srcCurrency = COUNTRY_CURRENCY[sourceCountry]
    if (!srcCurrency) return destinations
    const srcCurrCode = CURRENCY_NUMERIC[srcCurrency]
    if (!srcCurrCode) return destinations

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const destKorona = ISO2_TO_KORONA[dest]
      if (!destKorona) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue
      const destCurrCode = CURRENCY_NUMERIC[destCurrency]
      if (!destCurrCode) continue

      try {
        const params = new URLSearchParams({
          sendingCountryId: srcKorona,
          receivingCountryId: destKorona,
          sendingCurrencyId: srcCurrCode,
          receivingCurrencyId: destCurrCode,
          sendingAmount: '50000',
          paymentMethod: 'debitCard',
          receivingMethod: 'cash',
          paidNotificationEnabled: 'false',
        })
        const url = `${TARIFFS_ENDPOINT}?${params.toString()}`

        const resp = await fetch(url, { headers: KORONAPAY_HEADERS })

        if (resp.status === 429) {
          this.logger.warn('koronapay_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as KoronaPayTariff[]
          if (Array.isArray(data) && data.length > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('koronapay_dest_countries_discovered', {
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

    const srcKorona = ISO2_TO_KORONA[srcCountry]
    const destKorona = ISO2_TO_KORONA[destCountry]
    const srcCurrCode = CURRENCY_NUMERIC[srcCurrency]
    const destCurrCode = CURRENCY_NUMERIC[destCurrency]

    if (!srcKorona || !destKorona || !srcCurrCode || !destCurrCode) {
      return methods
    }

    for (const payout of PAYOUT_TYPES) {
      try {
        const params = new URLSearchParams({
          sendingCountryId: srcKorona,
          receivingCountryId: destKorona,
          sendingCurrencyId: srcCurrCode,
          receivingCurrencyId: destCurrCode,
          sendingAmount: '50000',
          paymentMethod: 'debitCard',
          receivingMethod: payout.receivingMethod,
          paidNotificationEnabled: 'false',
        })
        const url = `${TARIFFS_ENDPOINT}?${params.toString()}`

        const resp = await fetch(url, { headers: KORONAPAY_HEADERS })

        if (resp.status === 429) {
          this.logger.warn('koronapay_rate_limited_methods', { corridorId })
          return methods
        }

        if (resp.status === 200) {
          const data = await resp.json() as KoronaPayTariff[]
          if (Array.isArray(data) && data.length > 0) {
            methods.push({
              corridorId,
              rawPayinLabel: 'debitCard',
              normalizedPayin: 'debit_card',
              rawPayoutLabel: payout.receivingMethod,
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

    // If no methods found, default to debit_card + cash_pickup (KoronaPay's primary channel)
    if (methods.length === 0) {
      methods.push({
        corridorId,
        rawPayinLabel: 'debitCard',
        normalizedPayin: 'debit_card',
        rawPayoutLabel: 'cash',
        normalizedPayout: 'cash_pickup',
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
        { regex: /promo(?:tion(?:al)?)?|special\s+offer/i, type: 'unknown' },
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

      // API-based promo: check if a well-known corridor returns zero fee
      try {
        const params = new URLSearchParams({
          sendingCountryId: 'DEU',
          receivingCountryId: 'UZB',
          sendingCurrencyId: '978',
          receivingCurrencyId: '860',
          sendingAmount: '50000',
          paymentMethod: 'debitCard',
          receivingMethod: 'cash',
          paidNotificationEnabled: 'false',
        })
        const url = `${TARIFFS_ENDPOINT}?${params.toString()}`
        const resp = await fetch(url, { headers: KORONAPAY_HEADERS })
        if (resp.status === 200) {
          const data = await resp.json() as Array<{
            commission?: { sendingAmount?: number | null; chargeAmount?: number | null } | null
          }>
          if (Array.isArray(data) && data.length > 0) {
            const tariff = data[0]
            const fee = tariff.commission?.chargeAmount ?? tariff.commission?.sendingAmount
            if (fee === 0) {
              promos.push({
                type: 'zero_fee',
                corridorId: 'DE-UZ-EUR-UZS',
                rawText: 'API returned zero commission for DE→UZ',
                strikethroughDetected: false,
                originalValue: null,
                promoValue: '€0.00',
                expiresAt: null,
                bannerSelector: null,
              })
            }
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('koronapay_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('koronapay_promos_detected', { count: promos.length })
    return promos
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
