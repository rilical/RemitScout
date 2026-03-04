/**
 * Wise discovery script.
 *
 * Hybrid approach:
 * - Playwright: opens wise.com/us/send-money/ and extracts currencies from
 *   the calculator dropdowns (clicks `button[aria-label="Select currency"]`,
 *   then reads `[role="option"]` items where text is `"USDUnited States dollar"`
 *   — 3-char currency prefix). First button = source, second = destination.
 * - API: hits wise.com/gateway/v3/quotes to discover payment options per corridor.
 *
 * Entry URL: https://wise.com/us/send-money/
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// Map 3-letter currency codes to default 2-letter country codes
const CURRENCY_TO_COUNTRY: Record<string, string> = {
  AED: 'AE', AUD: 'AU', BGN: 'BG', BRL: 'BR', CAD: 'CA', CHF: 'CH',
  CNY: 'CN', CZK: 'CZ', DKK: 'DK', EUR: 'DE', GBP: 'GB', HKD: 'HK',
  HUF: 'HU', IDR: 'ID', ILS: 'IL', INR: 'IN', JPY: 'JP', MYR: 'MY',
  NOK: 'NO', NZD: 'NZ', PHP: 'PH', PLN: 'PL', RON: 'RO', SEK: 'SE',
  SGD: 'SG', TRY: 'TR', UAH: 'UA', USD: 'US', ALL: 'AL', ARS: 'AR',
  AZN: 'AZ', BAM: 'BA', BDT: 'BD', BHD: 'BH', BOB: 'BO', BWP: 'BW',
  CLP: 'CL', COP: 'CO', CRC: 'CR', CVE: 'CV', DOP: 'DO', EGP: 'EG',
  GEL: 'GE', GHS: 'GH', GMD: 'GM', GNF: 'GN', GTQ: 'GT', HNL: 'HN',
  ISK: 'IS', JOD: 'JO', KES: 'KE', KGS: 'KG', KHR: 'KH', KRW: 'KR',
  KWD: 'KW', LAK: 'LA', LKR: 'LK', MAD: 'MA', MNT: 'MN', MOP: 'MO',
  MUR: 'MU', MXN: 'MX', NAD: 'NA', NGN: 'NG', NIO: 'NI', NPR: 'NP',
  OMR: 'OM', PEN: 'PE', PKR: 'PK', PYG: 'PY', QAR: 'QA', RSD: 'RS',
  RWF: 'RW', SAR: 'SA', SCR: 'SC', SRD: 'SR', THB: 'TH', TND: 'TN',
  TWD: 'TW', TZS: 'TZ', UGX: 'UG', UYU: 'UY', VND: 'VN', ZAR: 'ZA',
}

// Invert CURRENCY_TO_COUNTRY for getCurrency lookup
const COUNTRY_TO_CURRENCY: Record<string, string> = {}
for (const [currency, country] of Object.entries(CURRENCY_TO_COUNTRY)) {
  if (!COUNTRY_TO_CURRENCY[country]) COUNTRY_TO_CURRENCY[country] = currency
}

export class WiseDiscovery extends ProviderDiscovery {
  constructor() {
    super('wise', 'Wise')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://wise.com/us/send-money/'
  }

  /**
   * Discover source currencies/countries from Wise's calculator dropdown.
   *
   * Real UI structure (tested 2026-03-03):
   * - Source selector: first `button[aria-label="Select currency"]` (shows "USD")
   * - Options: `[role="option"]` with text like "USDUnited States dollar"
   * - Extract first 3 chars as currency code → map to country code
   */
  protected async discoverSourceCountries(
    browser: DiscoveryBrowser,
  ): Promise<string[]> {
    const page = browser.page()

    try {
      // The source currency selector is the first button[aria-label="Select currency"]
      // (shows "USD" text). The .form-control buttons are a different UI layer.
      const ariaBtns = await page.$$('button[aria-label="Select currency"]')
      if (ariaBtns.length === 0) {
        this.logger.warn('wise_source_selector_not_found')
        return []
      }
      await ariaBtns[0].click()

      await page.waitForTimeout(1500)

      const currencies = await this.extractCurrencyCodesFromDropdown(page)
      await page.keyboard.press('Escape')

      // Map currencies to country codes
      const countries = currencies
        .map((c) => CURRENCY_TO_COUNTRY[c])
        .filter((c): c is string => !!c)
      const unique = [...new Set(countries)]

      this.logger.info('wise_source_countries_discovered', {
        currencies: currencies.length,
        countries: unique.length,
      })
      return unique
    } catch (err) {
      this.logger.warn('wise_source_discovery_error', {
        error: err instanceof Error ? err.message : String(err),
      })
      return []
    }
  }

  /**
   * Discover destination currencies/countries.
   *
   * Uses the second `button[aria-label="Select currency"]` (shows "EUR" by default).
   * Debug confirmed: clicking ariaBtns[1] shows 85 destination currencies.
   */
  protected async discoverDestinationCountries(
    browser: DiscoveryBrowser,
    _sourceCountry: string,
  ): Promise<string[]> {
    let page: any
    try {
      page = browser.page()
    } catch {
      // No Playwright browser available — fall back to static CURRENCY_TO_COUNTRY map
      const staticDests = [...new Set(Object.values(CURRENCY_TO_COUNTRY))]
      this.logger.info('wise_dest_countries_static_fallback', { count: staticDests.length })
      return staticDests
    }

    try {
      // Re-navigate to get a clean state
      await browser.goto(this.entryUrl)
      await page.waitForTimeout(2000)

      // The destination currency selector is the second button[aria-label="Select currency"]
      const ariaBtns = await page.$$('button[aria-label="Select currency"]')
      if (ariaBtns.length < 2) {
        this.logger.warn('wise_dest_selector_not_found')
        // Fall back to static map
        return [...new Set(Object.values(CURRENCY_TO_COUNTRY))]
      }
      await ariaBtns[1].click()

      await page.waitForTimeout(1500)

      const currencies = await this.extractCurrencyCodesFromDropdown(page)
      await page.keyboard.press('Escape')

      const countries = currencies
        .map((c) => CURRENCY_TO_COUNTRY[c])
        .filter((c): c is string => !!c)
      const unique = [...new Set(countries)]

      this.logger.info('wise_dest_countries_discovered', {
        currencies: currencies.length,
        countries: unique.length,
      })
      return unique.length > 0 ? unique : [...new Set(Object.values(CURRENCY_TO_COUNTRY))]
    } catch (err) {
      this.logger.warn('wise_dest_discovery_error', {
        error: err instanceof Error ? err.message : String(err),
      })
      // Fall back to static map on any error
      return [...new Set(Object.values(CURRENCY_TO_COUNTRY))]
    }
  }

  /**
   * Discover delivery methods via Wise API.
   *
   * The Wise API at /gateway/v3/quotes returns paymentOptions[] with
   * payIn/payOut codes, fee details, and discount info.
   * This is far more reliable than scraping the UI for payment methods.
   */
  protected async discoverDeliveryMethods(
    browser: DiscoveryBrowser,
    corridorId: string,
  ): Promise<DiscoveredDeliveryMethod[]> {
    const methods: DiscoveredDeliveryMethod[] = []

    try {
      // Parse corridor ID: "US-PH-USD-PHP"
      const parts = corridorId.split('-')
      if (parts.length < 4) return methods
      const [sourceCountry, targetCountry, sourceCurrency, targetCurrency] = parts

      // Call the Wise API directly (identified as Remit-Scout)
      const resp = await fetch('https://wise.com/gateway/v3/quotes', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'origin': 'https://wise.com',
          'referer': 'https://wise.com/',
          'user-agent': 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)',
        },
        body: JSON.stringify({
          sourceCurrency,
          targetCurrency,
          sourceAmount: 500,
          targetAmount: null,
          sourceCountry,
          targetCountry,
          profile: 'personal',
          rateType: 'FIXED',
        }),
      })

      if (resp.status !== 200) {
        this.logger.warn('wise_api_error', { corridorId, status: resp.status })
        return methods
      }

      const data = await resp.json() as {
        paymentOptions?: Array<{
          payIn?: string
          payOut?: string
          disabled?: boolean
          fee?: { total?: number; discount?: number }
        }>
      }

      const seenPairs = new Set<string>()
      for (const opt of data.paymentOptions ?? []) {
        if (opt.disabled) continue
        const payIn = opt.payIn ?? 'UNKNOWN'
        const payOut = opt.payOut ?? 'UNKNOWN'
        const pairKey = `${payIn}→${payOut}`
        if (seenPairs.has(pairKey)) continue
        seenPairs.add(pairKey)

        methods.push({
          corridorId,
          rawPayinLabel: payIn,
          normalizedPayin: this.normalizeWisePayin(payIn),
          rawPayoutLabel: payOut,
          normalizedPayout: this.normalizeWisePayout(payOut),
          unmapped: false,
        })
      }
    } catch (err) {
      this.logger.warn('wise_method_discovery_error', {
        corridorId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    return methods
  }

  /**
   * Detect promotions on the Wise page.
   *
   * Tested 2026-03-03: Wise page contains "no fee", "fee-free", "discount" text.
   * Also check Wise API response for fee.discount > 0.
   */
  protected async detectPromotions(
    browser: DiscoveryBrowser,
  ): Promise<DiscoveredPromotion[]> {
    const promos: DiscoveredPromotion[] = []

    try {
      const content = await browser.content()

      const promoPatterns: Array<{ regex: RegExp; type: DiscoveredPromotionType }> = [
        { regex: /(?:first|1st)\s+transfer\s+free/i, type: 'first_transfer' },
        { regex: /no\s+fee|zero\s+fee|free\s+transfer|fee\s*:\s*\$?0\.00/i, type: 'zero_fee' },
        { regex: /fee[\s-]*free/i, type: 'zero_fee' },
        { regex: /reduced?\s+fee|discount|save\s+on\s+fee/i, type: 'reduced_fee' },
        { regex: /bonus\s+rate|better\s+rate|rate\s+boost/i, type: 'bonus_rate' },
        { regex: /refer\s+a\s+friend|referral/i, type: 'referral' },
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

      // Also check the API for fee discounts on a sample corridor
      try {
        const resp = await fetch('https://wise.com/gateway/v3/quotes', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'origin': 'https://wise.com',
            'referer': 'https://wise.com/',
            'user-agent': 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)',
          },
          body: JSON.stringify({
            sourceCurrency: 'USD', targetCurrency: 'PHP',
            sourceAmount: 500, targetAmount: null,
            sourceCountry: 'US', targetCountry: 'PH',
            profile: 'personal', rateType: 'FIXED',
          }),
        })
        const data = await resp.json() as {
          paymentOptions?: Array<{ fee?: { discount?: number; total?: number }; payIn?: string }>
        }
        for (const opt of data.paymentOptions ?? []) {
          if (opt.fee?.discount && opt.fee.discount > 0) {
            promos.push({
              type: 'reduced_fee',
              corridorId: 'US-PH-USD-PHP',
              rawText: `Fee discount: ${opt.fee.discount} on ${opt.payIn}`,
              strikethroughDetected: false,
              originalValue: String(opt.fee.total),
              promoValue: String((opt.fee.total ?? 0) - opt.fee.discount),
              expiresAt: null,
              bannerSelector: null,
            })
            break // One example is enough
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('wise_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('wise_promos_detected', { count: promos.length })
    return promos
  }

  /**
   * Extract 3-letter currency codes from an open Wise dropdown.
   *
   * Wise options render as: "USDUnited States dollar" — text starts
   * with exactly 3 uppercase letters followed by a capital (currency name).
   */
  private async extractCurrencyCodesFromDropdown(page: any): Promise<string[]> {
    const codes: string[] = []

    const options = await page.$$('[role="option"]')
    for (const opt of options) {
      const text = (await opt.textContent())?.trim() ?? ''
      // Pattern: "USDUnited States dollar" → extract "USD"
      const match = text.match(/^([A-Z]{3})[A-Z]/)
      if (match) {
        codes.push(match[1])
      }
    }

    return codes
  }

  /** Map Wise API payIn codes to canonical names */
  private normalizeWisePayin(code: string): string {
    const map: Record<string, string> = {
      BANK_TRANSFER: 'bank_transfer',
      DEBIT: 'debit_card', CARD: 'debit_card',
      MAESTRO: 'debit_card', MC_DEBIT_OR_PREPAID: 'debit_card',
      VISA_DEBIT_OR_PREPAID: 'debit_card', VISA_BUSINESS_DEBIT: 'debit_card',
      MC_BUSINESS_DEBIT: 'debit_card', INTERNATIONAL_DEBIT: 'debit_card',
      INT_DEBIT_WITH_EUROPEAN_CARD: 'debit_card',
      CREDIT: 'credit_card', MC_CREDIT: 'credit_card',
      VISA_CREDIT: 'credit_card', INTERNATIONAL_CREDIT: 'credit_card',
      INT_CREDIT_WITH_EUROPEAN_CARD: 'credit_card',
      MC_BUSINESS_CREDIT: 'credit_card', VISA_BUSINESS_CREDIT: 'credit_card',
      APPLE_PAY: 'apple_pay',
      GOOGLE_PAY: 'google_pay',
      CASH: 'cash',
    }
    return map[code] ?? 'bank_transfer'
  }

  /** Map Wise API payOut codes to canonical names */
  private normalizeWisePayout(code: string): string {
    const map: Record<string, string> = {
      BANK_TRANSFER: 'bank_deposit', BANK: 'bank_deposit',
      CASH: 'cash_pickup',
      MOBILE_WALLET: 'mobile_wallet',
      AIRTIME: 'airtime',
    }
    return map[code] ?? 'bank_deposit'
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_TO_CURRENCY[countryCode] ?? null
  }
}
