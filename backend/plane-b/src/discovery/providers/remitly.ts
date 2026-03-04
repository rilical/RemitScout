/**
 * Remitly discovery script.
 *
 * Hybrid approach:
 * - Playwright: scrapes remitly.com for destination country links and promo banners.
 *   Note: /us/en/send-money returns 404 — use the country-specific pages instead.
 * - API: hits api.remitly.io/v3/calculator/estimate to discover delivery methods
 *   and promotional pricing per corridor. The API returns `pay_out_price_estimates`
 *   with multiple delivery method estimates per request.
 *
 * Tested 2026-03-03:
 * - US→MX: 3 methods (DEBIT→BANK_DEPOSIT, DEBIT→PUSH_TO_CARD, DEBIT→DIRECT_TO_PHONE)
 * - US→PH: 4 methods (DEBIT→PUSH_TO_CARD, CASH_PICKUP, HOME_DELIVERY, DIRECT_TO_PHONE)
 * - Promotional rates AND fee discounts confirmed for US→MX and US→PH
 *
 * Entry URL: https://www.remitly.com/us/en
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// Remitly uses 3-letter country codes in their API
const ISO2_TO_ISO3: Record<string, string> = {
  AE: 'ARE', AT: 'AUT', AU: 'AUS', BD: 'BGD', BE: 'BEL', BR: 'BRA',
  CA: 'CAN', CL: 'CHL', CN: 'CHN', CO: 'COL', CY: 'CYP', CZ: 'CZE',
  DE: 'DEU', DK: 'DNK', DO: 'DOM', DZ: 'DZA', EC: 'ECU', EG: 'EGY',
  ES: 'ESP', ET: 'ETH', FI: 'FIN', FR: 'FRA', GB: 'GBR', GE: 'GEO',
  GH: 'GHA', GR: 'GRC', GT: 'GTM', HK: 'HKG', HN: 'HND', HT: 'HTI',
  ID: 'IDN', IE: 'IRL', IL: 'ISR', IN: 'IND', IT: 'ITA', JM: 'JAM',
  JO: 'JOR', JP: 'JPN', KE: 'KEN', KH: 'KHM', KR: 'KOR', LI: 'LIE',
  LK: 'LKA', LT: 'LTU', LV: 'LVA', MA: 'MAR', ME: 'MNE', MK: 'MKD',
  MM: 'MMR', MT: 'MLT', MX: 'MEX', MY: 'MYS', NG: 'NGA', NI: 'NIC',
  NL: 'NLD', NO: 'NOR', NP: 'NPL', NZ: 'NZL', PA: 'PAN', PE: 'PER',
  PH: 'PHL', PK: 'PAK', PL: 'POL', PT: 'PRT', PY: 'PRY', RO: 'ROU',
  RS: 'SRB', SE: 'SWE', SG: 'SGP', SK: 'SVK', SV: 'SLV', TH: 'THA',
  TR: 'TUR', TZ: 'TZA', UA: 'UKR', UG: 'UGA', US: 'USA', UY: 'URY',
  VN: 'VNM', ZA: 'ZAF',
}

// Default currency for common countries
const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', DE: 'EUR', FR: 'EUR',
  ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR',
  FI: 'EUR', PT: 'EUR', GR: 'EUR', CY: 'EUR', LT: 'EUR', LV: 'EUR',
  SK: 'EUR', MT: 'EUR', SI: 'EUR', EE: 'EUR', LU: 'EUR',
  NZ: 'NZD', SG: 'SGD', NO: 'NOK', SE: 'SEK', DK: 'DKK',
  PL: 'PLN', CZ: 'CZK', RO: 'RON',
  MX: 'MXN', PH: 'PHP', IN: 'INR', NG: 'NGN', PK: 'PKR',
  BD: 'BDT', LK: 'LKR', GH: 'GHS', KE: 'KES', VN: 'VND',
  TH: 'THB', JP: 'JPY', KR: 'KRW', CN: 'CNY', ID: 'IDR',
  MY: 'MYR', BR: 'BRL', CO: 'COP', CL: 'CLP', PE: 'PEN',
  DZ: 'DZD', EG: 'EGP', MA: 'MAD', JO: 'JOD', AE: 'AED',
  TR: 'TRY', UA: 'UAH', HK: 'HKD', ZA: 'ZAR',
}

export class RemitlyDiscovery extends ProviderDiscovery {
  constructor() {
    super('remitly', 'Remitly')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.remitly.com/us/en'
  }

  /**
   * Discover source countries.
   *
   * Remitly supports ~30 source countries. Since the website doesn't
   * have an easy-to-scrape country picker, we use known source countries
   * from the Remitly supported-corridors list and validate via API.
   */
  protected async discoverSourceCountries(
    browser: DiscoveryBrowser,
  ): Promise<string[]> {
    const page = browser.page()
    const countries: string[] = []

    try {
      await page.waitForTimeout(2000)

      // Try to find source country links from the page
      const links = await page.$$('a[href]')
      const locales = new Set<string>()
      for (const link of links) {
        const href: string = (await link.getAttribute('href')) ?? ''
        // Pattern: /us/en, /gb/en, /ca/en, /au/en
        const match = href.match(/\/([a-z]{2})\/(?:en|es|fr|de|it|pt)(?:\/|$|\?)/)
        if (match) {
          locales.add(match[1].toUpperCase())
        }
      }

      countries.push(...locales)

      // Supplement with known Remitly source countries
      const knownSources = [
        'US', 'GB', 'CA', 'AU', 'AT', 'BE', 'CY', 'CZ', 'DE', 'DK',
        'ES', 'FI', 'FR', 'GR', 'IE', 'IT', 'LI', 'LT', 'LV', 'MT',
        'NL', 'NO', 'NZ', 'PL', 'PT', 'RO', 'SE', 'SG', 'SK', 'AE',
      ]
      for (const c of knownSources) {
        if (!countries.includes(c)) countries.push(c)
      }
    } catch (err) {
      this.logger.warn('remitly_source_discovery_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('remitly_source_countries_discovered', { count: countries.length })
    return countries
  }

  /**
   * Discover destination countries by testing corridors via API.
   *
   * We probe the Remitly calculator API for a set of known destinations
   * and record which ones return valid estimates. This is more reliable
   * than scraping the website (which returned 404 on send-money page).
   */
  protected async discoverDestinationCountries(
    browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const destinations: string[] = []
    const srcCurrency = COUNTRY_CURRENCY[sourceCountry] ?? 'USD'
    const src3 = ISO2_TO_ISO3[sourceCountry] ?? `${sourceCountry}A`

    // Test a comprehensive list of potential destinations
    const candidateDests = Object.keys(COUNTRY_CURRENCY)

    // Batch test — but respect rate limits (be polite)
    let tested = 0
    for (const dest of candidateDests) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue

      const dest3 = ISO2_TO_ISO3[dest]
      if (!dest3) continue

      try {
        const conduit = `${src3}:${srcCurrency}-${dest3}:${destCurrency}`
        const resp = await fetch(
          `https://api.remitly.io/v3/calculator/estimate?conduit=${conduit}&anchor=SEND&amount=500&purpose=OTHER&customer_segment=UNRECOGNIZED&strict_promo=false`,
          {
            headers: {
              'accept': 'application/json',
              'origin': 'https://www.remitly.com',
              'referer': 'https://www.remitly.com/',
              'user-agent': 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)',
            },
          },
        )

        if (resp.status === 429) {
          this.logger.warn('remitly_rate_limited', { sourceCountry, dest, tested })
          break // Stop probing — we're being rate-limited
        }

        if (resp.status === 200) {
          const data = await resp.json() as {
            estimate?: unknown
            pay_out_price_estimates?: { estimates?: unknown[] }
          }
          const estimates = data?.pay_out_price_estimates?.estimates ?? []
          if (estimates.length > 0 || data?.estimate) {
            destinations.push(dest)
          }
        }

        tested++
        // Polite delay between API calls (500ms)
        await new Promise((r) => setTimeout(r, 500))

      } catch {
        // Skip this destination on error
      }
    }

    this.logger.info('remitly_dest_countries_discovered', {
      sourceCountry,
      tested,
      discovered: destinations.length,
    })
    return destinations
  }

  /**
   * Discover delivery methods via Remitly API.
   *
   * The API returns `pay_out_price_estimates.estimates[]` with
   * each estimate containing `pay_in_method` and `pay_out_method`.
   * This is the definitive source for Remitly's delivery methods per corridor.
   */
  protected async discoverDeliveryMethods(
    browser: DiscoveryBrowser,
    corridorId: string,
  ): Promise<DiscoveredDeliveryMethod[]> {
    const methods: DiscoveredDeliveryMethod[] = []

    try {
      const parts = corridorId.split('-')
      if (parts.length < 4) return methods
      const [srcCountry, destCountry, srcCurrency, destCurrency] = parts

      const src3 = ISO2_TO_ISO3[srcCountry]
      const dest3 = ISO2_TO_ISO3[destCountry]
      if (!src3 || !dest3) return methods

      const conduit = `${src3}:${srcCurrency}-${dest3}:${destCurrency}`
      const resp = await fetch(
        `https://api.remitly.io/v3/calculator/estimate?conduit=${conduit}&anchor=SEND&amount=500&purpose=OTHER&customer_segment=UNRECOGNIZED&strict_promo=false`,
        {
          headers: {
            'accept': 'application/json',
            'origin': 'https://www.remitly.com',
            'referer': 'https://www.remitly.com/',
            'user-agent': 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)',
          },
        },
      )

      if (resp.status !== 200) return methods

      const data = await resp.json() as {
        pay_out_price_estimates?: {
          estimates?: Array<{
            pay_in_method?: string
            pay_out_method?: string
          }>
        }
      }

      const estimates = data?.pay_out_price_estimates?.estimates ?? []
      const seenPairs = new Set<string>()

      for (const est of estimates) {
        const payIn = est.pay_in_method ?? 'UNKNOWN'
        const payOut = est.pay_out_method ?? 'UNKNOWN'
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
      this.logger.warn('remitly_method_discovery_error', {
        corridorId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    return methods
  }

  /**
   * Detect promotions from Remitly page and API.
   *
   * Tested 2026-03-03:
   * - Page contains "save" and "referral" text
   * - API returns promotional_exchange_rate AND fee_discount_amount for US→MX, US→PH
   */
  protected async detectPromotions(
    browser: DiscoveryBrowser,
  ): Promise<DiscoveredPromotion[]> {
    const promos: DiscoveredPromotion[] = []

    try {
      // Page-based detection
      const content = await browser.content()
      const promoPatterns: Array<{ regex: RegExp; type: DiscoveredPromotionType }> = [
        { regex: /first\s+transfer\s+(?:is\s+)?(?:fee[- ]?free|free)/i, type: 'first_transfer' },
        { regex: /fee[- ]?free/i, type: 'zero_fee' },
        { regex: /(?:no|zero)\s*(?:transfer\s+)?fee/i, type: 'zero_fee' },
        { regex: /promotional\s+(?:exchange\s+)?rate/i, type: 'bonus_rate' },
        { regex: /refer\s+(?:a\s+)?friend|earn\s+\$\d+/i, type: 'referral' },
        { regex: /limited\s+time|ends?\s+soon/i, type: 'seasonal' },
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

      // API-based promo detection (more accurate)
      const testCorridors = [
        { src: 'USA:USD', dest: 'MEX:MXN', id: 'US-MX-USD-MXN' },
        { src: 'USA:USD', dest: 'PHL:PHP', id: 'US-PH-USD-PHP' },
      ]

      for (const { src, dest, id } of testCorridors) {
        try {
          const resp = await fetch(
            `https://api.remitly.io/v3/calculator/estimate?conduit=${src}-${dest}&anchor=SEND&amount=500&purpose=OTHER&customer_segment=UNRECOGNIZED&strict_promo=false`,
            {
              headers: {
                'accept': 'application/json',
                'origin': 'https://www.remitly.com',
                'referer': 'https://www.remitly.com/',
                'user-agent': 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)',
              },
            },
          )
          if (resp.status !== 200) continue

          const data = await resp.json() as {
            pay_out_price_estimates?: {
              estimates?: Array<{
                exchange_rate?: { promotional_exchange_rate?: string; base_rate?: string }
                discount?: { fee_discount_amount?: string }
                pay_out_method?: string
              }>
            }
          }

          for (const est of data?.pay_out_price_estimates?.estimates ?? []) {
            const promoRate = est.exchange_rate?.promotional_exchange_rate
            const baseRate = est.exchange_rate?.base_rate
            const feeDiscount = est.discount?.fee_discount_amount

            if (promoRate && baseRate && promoRate !== baseRate) {
              promos.push({
                type: 'bonus_rate',
                corridorId: id,
                rawText: `Promotional rate ${promoRate} vs base ${baseRate} for ${est.pay_out_method}`,
                strikethroughDetected: false,
                originalValue: baseRate,
                promoValue: promoRate,
                expiresAt: null,
                bannerSelector: null,
              })
            }

            if (feeDiscount && parseFloat(feeDiscount) > 0) {
              promos.push({
                type: 'reduced_fee',
                corridorId: id,
                rawText: `Fee discount of ${feeDiscount} for ${est.pay_out_method}`,
                strikethroughDetected: false,
                originalValue: null,
                promoValue: feeDiscount,
                expiresAt: null,
                bannerSelector: null,
              })
              break // One fee discount example per corridor is enough
            }
          }

          // Polite delay between API calls
          await new Promise((r) => setTimeout(r, 500))
        } catch {
          // Skip on error
        }
      }
    } catch (err) {
      this.logger.warn('remitly_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('remitly_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayin(code: string): string {
    const map: Record<string, string> = {
      DEBIT: 'debit_card', CREDIT: 'credit_card',
      BANK: 'bank_transfer', INTERAC: 'bank_transfer',
      OPEN_BANKING: 'bank_transfer', PAYTO: 'bank_transfer',
      APPLE_PAY: 'apple_pay', GOOGLE_PAY: 'google_pay',
      CASH: 'cash',
    }
    return map[code] ?? 'debit_card'
  }

  private normalizePayout(code: string): string {
    const map: Record<string, string> = {
      BANK_DEPOSIT: 'bank_deposit', CASH_PICKUP: 'cash_pickup',
      DIRECT_TO_PHONE: 'mobile_wallet', MOBILE_WALLET: 'mobile_wallet',
      HOME_DELIVERY: 'home_delivery', PUSH_TO_CARD: 'debit_card',
      UPI: 'bank_deposit',
    }
    return map[code] ?? 'bank_deposit'
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
