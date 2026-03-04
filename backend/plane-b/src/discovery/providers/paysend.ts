/**
 * Paysend discovery script.
 *
 * Hybrid approach:
 * - Playwright: scrapes corridor links from paysend.com homepage and corridor
 *   pages. Paysend lists destination countries as `<a>` tags with href pattern
 *   `/en-us/send-money/from-X-to-Y`. There are NO interactive dropdowns —
 *   the country "selector" is actually a grid of link cards with styled-component
 *   class `CountryName-sc-*`.
 * - API: hits paysend.com/api/en-us/send-money/from-X-to-Y to get quotes,
 *   delivery methods, and check corridor availability.
 *
 * Known gap: Paysend serves Algeria (DZ) but our rights_matrix may be missing it.
 *
 * Entry URL: https://paysend.com (NOT /en/send-money which 404s)
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// Reverse slug → ISO code mapping for common countries
const SLUG_TO_COUNTRY: Record<string, string> = {
  'algeria': 'DZ', 'andorra': 'AD', 'argentina': 'AR', 'armenia': 'AM',
  'australia': 'AU', 'austria': 'AT', 'azerbaijan': 'AZ', 'bangladesh': 'BD',
  'belgium': 'BE', 'belize': 'BZ', 'benin': 'BJ', 'bhutan': 'BT',
  'botswana': 'BW', 'brazil': 'BR', 'bulgaria': 'BG', 'burundi': 'BI',
  'cameroon': 'CM', 'canada': 'CA', 'cape-verde': 'CV', 'chile': 'CL',
  'china': 'CN', 'colombia': 'CO', 'costa-rica': 'CR', 'cyprus': 'CY',
  'czech-republic': 'CZ', 'denmark': 'DK', 'djibouti': 'DJ', 'dominica': 'DM',
  'dominican-republic': 'DO', 'ecuador': 'EC', 'egypt': 'EG',
  'el-salvador': 'SV', 'estonia': 'EE', 'fiji': 'FJ', 'finland': 'FI',
  'france': 'FR', 'gambia': 'GM', 'georgia': 'GE', 'germany': 'DE',
  'ghana': 'GH', 'greece': 'GR', 'guatemala': 'GT', 'guinea': 'GN',
  'guyana': 'GY', 'honduras': 'HN', 'hong-kong': 'HK', 'hungary': 'HU',
  'iceland': 'IS', 'india': 'IN', 'indonesia': 'ID', 'ireland': 'IE',
  'israel': 'IL', 'italy': 'IT', 'jamaica': 'JM', 'japan': 'JP',
  'jordan': 'JO', 'kazakhstan': 'KZ', 'kenya': 'KE', 'kyrgyzstan': 'KG',
  'latvia': 'LV', 'liechtenstein': 'LI', 'lithuania': 'LT',
  'luxembourg': 'LU', 'madagascar': 'MG', 'malaysia': 'MY',
  'malta': 'MT', 'mauritania': 'MR', 'mauritius': 'MU', 'mexico': 'MX',
  'moldova': 'MD', 'mongolia': 'MN', 'montenegro': 'ME', 'morocco': 'MA',
  'mozambique': 'MZ', 'namibia': 'NA', 'nepal': 'NP',
  'the-netherlands': 'NL', 'netherlands': 'NL',
  'new-zealand': 'NZ', 'nigeria': 'NG', 'north-macedonia': 'MK',
  'norway': 'NO', 'pakistan': 'PK', 'paraguay': 'PY', 'peru': 'PE',
  'philippines': 'PH', 'poland': 'PL', 'portugal': 'PT', 'qatar': 'QA',
  'romania': 'RO', 'rwanda': 'RW', 'san-marino': 'SM',
  'saudi-arabia': 'SA', 'senegal': 'SN', 'serbia': 'RS',
  'sierra-leone': 'SL', 'sierraleone': 'SL', 'singapore': 'SG', 'slovakia': 'SK',
  'slovenia': 'SI', 'south-africa': 'ZA', 'south-korea': 'KR',
  'spain': 'ES', 'sri-lanka': 'LK', 'sweden': 'SE', 'switzerland': 'CH',
  'tajikistan': 'TJ', 'tanzania': 'TZ', 'thailand': 'TH', 'togo': 'TG',
  'turkey': 'TR', 'uganda': 'UG', 'ukraine': 'UA',
  'the-united-arab-emirates': 'AE', 'united-arab-emirates': 'AE', 'uae': 'AE',
  'the-united-kingdom': 'GB', 'united-kingdom': 'GB',
  'the-united-states-of-america': 'US', 'united-states': 'US',
  'uruguay': 'UY', 'uzbekistan': 'UZ', 'vietnam': 'VN', 'zambia': 'ZM',
  'kuwait': 'KW', 'croatia': 'HR',
}

// Country → currency map for all Paysend-served countries
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  DZ: 'DZD', AD: 'EUR', AR: 'ARS', AM: 'AMD', AU: 'AUD', AT: 'EUR',
  AZ: 'AZN', BD: 'BDT', BE: 'EUR', BZ: 'BZD', BJ: 'XOF', BT: 'BTN',
  BW: 'BWP', BR: 'BRL', BG: 'BGN', BI: 'BIF', CM: 'XAF', CA: 'CAD',
  CV: 'CVE', CL: 'CLP', CN: 'CNY', CO: 'COP', CR: 'CRC', CY: 'EUR',
  CZ: 'CZK', DK: 'DKK', DJ: 'DJF', DM: 'XCD', DO: 'DOP', EC: 'USD',
  EG: 'EGP', SV: 'USD', EE: 'EUR', FJ: 'FJD', FI: 'EUR', FR: 'EUR',
  GM: 'GMD', GE: 'GEL', DE: 'EUR', GH: 'GHS', GR: 'EUR', GT: 'GTQ',
  GN: 'GNF', GY: 'GYD', HN: 'HNL', HK: 'HKD', HU: 'HUF', IS: 'ISK',
  IN: 'INR', ID: 'IDR', IE: 'EUR', IL: 'ILS', IT: 'EUR', JM: 'JMD',
  JP: 'JPY', JO: 'JOD', KZ: 'KZT', KE: 'KES', KG: 'KGS', LV: 'EUR',
  LI: 'CHF', LT: 'EUR', LU: 'EUR', MG: 'MGA', MY: 'MYR', MT: 'EUR',
  MR: 'MRU', MU: 'MUR', MX: 'MXN', MD: 'MDL', MN: 'MNT', ME: 'EUR',
  MA: 'MAD', MZ: 'MZN', NA: 'NAD', NP: 'NPR', NL: 'EUR', NZ: 'NZD',
  NG: 'NGN', MK: 'MKD', NO: 'NOK', PK: 'PKR', PY: 'PYG', PE: 'PEN',
  PH: 'PHP', PL: 'PLN', PT: 'EUR', QA: 'QAR', RO: 'RON', RW: 'RWF',
  SM: 'EUR', SA: 'SAR', SN: 'XOF', RS: 'RSD', SL: 'SLE', SG: 'SGD',
  SK: 'EUR', SI: 'EUR', ZA: 'ZAR', KR: 'KRW', ES: 'EUR', LK: 'LKR',
  SE: 'SEK', CH: 'CHF', TJ: 'TJS', TZ: 'TZS', TH: 'THB', TG: 'XOF',
  TR: 'TRY', UG: 'UGX', UA: 'UAH', AE: 'AED', GB: 'GBP', US: 'USD',
  UY: 'UYU', UZ: 'UZS', VN: 'VND', ZM: 'ZMW', KW: 'KWD', HR: 'EUR',
}

export class PaysendDiscovery extends ProviderDiscovery {
  constructor() {
    super('paysend', 'Paysend')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://paysend.com'
  }

  /**
   * Discover source countries.
   *
   * Paysend homepage auto-detects the source country from GeoIP.
   * To discover ALL source countries, we parse the `/en-{cc}/` locale paths
   * from the page links. Paysend supports ~50 source countries.
   */
  protected async discoverSourceCountries(
    browser: DiscoveryBrowser,
  ): Promise<string[]> {
    const page = browser.page()
    const countries: string[] = []

    try {
      await page.waitForTimeout(2000)

      // Paysend's corridor links contain the source country locale:
      // /en-us/send-money/from-X-to-Y
      const links = await page.$$('a[href*="/send-money/from-"]')
      const locales = new Set<string>()
      for (const link of links) {
        const href: string = (await link.getAttribute('href')) ?? ''
        const match = href.match(/\/en-([a-z]{2})\/send-money\//)
        if (match) locales.add(match[1].toUpperCase())
      }

      countries.push(...locales)

      // If we only got one locale (the auto-detected one), hardcode known sources
      if (countries.length <= 1) {
        // Paysend supports sending from these countries (from supported-corridors.ts)
        const knownSources = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'RO']
        for (const c of knownSources) {
          if (!countries.includes(c)) countries.push(c)
        }
      }
    } catch (err) {
      this.logger.warn('paysend_source_discovery_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('paysend_source_countries_discovered', { count: countries.length })
    return countries
  }

  /**
   * Discover destination countries from corridor links.
   *
   * Paysend lists destinations as link cards on the corridor page with
   * href pattern: /en-us/send-money/from-X-to-{destination-slug}
   * and styled-component divs with class `CountryName-sc-*`.
   *
   * The homepage also includes these links (114 destinations found in testing).
   */
  protected async discoverDestinationCountries(
    browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    let page: any
    try {
      page = browser.page()
    } catch {
      // No Playwright browser — fall back to static COUNTRY_TO_CURRENCY map
      const staticDests = Object.keys(COUNTRY_TO_CURRENCY).filter((c) => c !== sourceCountry)
      this.logger.info('paysend_dest_countries_static_fallback', { count: staticDests.length })
      return staticDests
    }

    const destinations: string[] = []

    try {
      // Navigate to a corridor page which lists all destination countries
      const locale = sourceCountry.toLowerCase()
      const url = `https://paysend.com/en-${locale}/send-money/from-${this.getCountrySlug(sourceCountry)}-to-mexico`
      const result = await browser.goto(url)

      if (result.blocked || result.robotsDisallowed) {
        // Fall back to homepage
        await browser.goto('https://paysend.com')
      }
      await page.waitForTimeout(2000)

      // Extract destination slugs from corridor links
      const links = await page.$$('a[href*="/send-money/from-"]')
      for (const link of links) {
        const href: string = (await link.getAttribute('href')) ?? ''
        const toMatch = href.match(/-to-([a-z][a-z0-9-]+?)(?:\?|$|#)/)
        if (toMatch) {
          const slug = toMatch[1]
          const code = SLUG_TO_COUNTRY[slug]
          if (code && !destinations.includes(code)) {
            destinations.push(code)
          }
        }
      }

      // Also try the Paysend API to validate a few corridors
      if (destinations.length === 0) {
        try {
          const apiResp = await fetch(
            `https://paysend.com/api/en-${locale}/send-money/from-${this.getCountrySlug(sourceCountry)}-to-mexico?fromCurrId=840&toCurrId=484&isFrom=true`,
            {
              method: 'POST',
              headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'origin': 'https://paysend.com',
                'user-agent': 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)',
              },
              body: '',
            },
          )
          const data = await apiResp.json() as {
            extra?: {
              geo?: {
                countries?: Array<{ code?: string }>
              }
            }
          }
          const apiCountries = data?.extra?.geo?.countries ?? []
          for (const c of apiCountries) {
            if (c.code) {
              const code = c.code.toUpperCase()
              if (!destinations.includes(code)) destinations.push(code)
            }
          }
        } catch {
          // API fallback failed
        }
      }
    } catch (err) {
      this.logger.warn('paysend_dest_discovery_error', {
        sourceCountry,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // If browser + API both returned nothing, fall back to static map
    if (destinations.length === 0) {
      const staticDests = Object.keys(COUNTRY_TO_CURRENCY).filter((c) => c !== sourceCountry)
      this.logger.info('paysend_dest_countries_static_fallback', { count: staticDests.length })
      return staticDests
    }

    this.logger.info('paysend_dest_countries_discovered', {
      sourceCountry,
      count: destinations.length,
    })
    return destinations
  }

  /**
   * Discover delivery methods via Paysend API.
   *
   * The API at paysend.com/api/en-us/send-money/from-X-to-Y returns
   * commission details and paymentForm with payin/payout method info.
   */
  protected async discoverDeliveryMethods(
    browser: DiscoveryBrowser,
    corridorId: string,
  ): Promise<DiscoveredDeliveryMethod[]> {
    const methods: DiscoveredDeliveryMethod[] = []

    try {
      const parts = corridorId.split('-')
      if (parts.length < 4) return methods
      const [sourceCountry, destCountry] = parts
      const sourceSlug = this.getCountrySlug(sourceCountry)
      const destSlug = this.getCountrySlugByCode(destCountry)

      const url = `https://paysend.com/api/en-${sourceCountry.toLowerCase()}/send-money/from-${sourceSlug}-to-${destSlug}?fromCurrId=840&toCurrId=0&isFrom=true`

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'origin': 'https://paysend.com',
          'user-agent': 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)',
        },
        body: '',
      })

      if (resp.status !== 200) return methods

      const data = await resp.json() as {
        paymentForm?: {
          payIn?: string; payOut?: string
          payInMethod?: string; payOutMethod?: string
          description?: string
        }
        countryFrom?: Array<{ paySystems?: unknown }>
        countryTo?: Array<{ paySystems?: unknown }>
      }

      const payIn = data.paymentForm?.payIn ?? data.paymentForm?.payInMethod ?? 'card'
      const payOut = data.paymentForm?.payOut ?? data.paymentForm?.payOutMethod ?? 'bank_deposit'

      methods.push({
        corridorId,
        rawPayinLabel: payIn,
        normalizedPayin: this.normalizePayin(payIn),
        rawPayoutLabel: payOut,
        normalizedPayout: this.normalizePayout(payOut),
        unmapped: false,
      })
    } catch (err) {
      this.logger.warn('paysend_method_discovery_error', {
        corridorId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    return methods
  }

  /**
   * Detect promotions from Paysend page content.
   *
   * Tested 2026-03-03: homepage contains "promo"/"offer" text.
   * Paysend frequently advertises "$0 fee" for first transfers.
   */
  protected async detectPromotions(
    browser: DiscoveryBrowser,
  ): Promise<DiscoveredPromotion[]> {
    const promos: DiscoveredPromotion[] = []

    try {
      const content = await browser.content()

      const promoPatterns: Array<{ regex: RegExp; type: DiscoveredPromotionType }> = [
        { regex: /first\s+(?:money\s+)?transfer\s+(?:is\s+)?free/i, type: 'first_transfer' },
        { regex: /new\s+customer\s+offer/i, type: 'first_transfer' },
        { regex: /(?:no|zero|0)\s*(?:transfer\s+)?fee/i, type: 'zero_fee' },
        { regex: /(?:£|€|\$)0(?:\.00)?\s+(?:fee|commission)/i, type: 'zero_fee' },
        { regex: /(?:reduced|lower|discount)\s+(?:fee|commission)/i, type: 'reduced_fee' },
        { regex: /better\s+(?:exchange\s+)?rate|rate\s+boost/i, type: 'bonus_rate' },
        { regex: /refer\s+(?:a\s+)?friend/i, type: 'referral' },
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

      // Also check the API for $0 fee corridors
      try {
        const resp = await fetch(
          'https://paysend.com/api/en-us/send-money/from-the-united-states-of-america-to-mexico?fromCurrId=840&toCurrId=484&isFrom=true',
          {
            method: 'POST',
            headers: {
              'accept': 'application/json, text/plain, */*',
              'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
              'origin': 'https://paysend.com',
              'user-agent': 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)',
            },
            body: '',
          },
        )
        const data = await resp.json() as { commission?: { fee?: number } }
        if (data.commission?.fee === 0) {
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
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('paysend_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('paysend_promos_detected', { count: promos.length })
    return promos
  }

  private getCountrySlug(countryCode: string): string {
    const slugs: Record<string, string> = {
      US: 'the-united-states-of-america', GB: 'the-united-kingdom',
      CA: 'canada', AU: 'australia', DE: 'germany', FR: 'france',
      ES: 'spain', IT: 'italy', NL: 'the-netherlands', BE: 'belgium',
      AT: 'austria', CH: 'switzerland', SE: 'sweden', NO: 'norway',
      DK: 'denmark', FI: 'finland', PL: 'poland', CZ: 'czech-republic',
      HU: 'hungary', RO: 'romania', IE: 'ireland',
    }
    return slugs[countryCode.toUpperCase()] ?? countryCode.toLowerCase()
  }

  private getCountrySlugByCode(code: string): string {
    // Reverse lookup from SLUG_TO_COUNTRY
    for (const [slug, isoCode] of Object.entries(SLUG_TO_COUNTRY)) {
      if (isoCode === code.toUpperCase()) return slug
    }
    return code.toLowerCase()
  }

  private normalizePayin(raw: string): string {
    const lower = raw.toLowerCase()
    if (/visa|mastercard|card|debit/i.test(lower)) return 'debit_card'
    if (/credit/i.test(lower)) return 'credit_card'
    if (/bank|sepa|transfer|swift/i.test(lower)) return 'bank_transfer'
    if (/apple/i.test(lower)) return 'apple_pay'
    if (/google/i.test(lower)) return 'google_pay'
    return 'debit_card'
  }

  private normalizePayout(raw: string): string {
    const lower = raw.toLowerCase()
    if (/bank|deposit|transfer/i.test(lower)) return 'bank_deposit'
    if (/card/i.test(lower)) return 'debit_card'
    if (/cash/i.test(lower)) return 'cash_pickup'
    if (/wallet|mobile/i.test(lower)) return 'mobile_wallet'
    return 'bank_deposit'
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_TO_CURRENCY[countryCode] ?? null
  }
}
