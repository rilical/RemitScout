/**
 * Placid discovery script.
 *
 * Hybrid static/HTML-parse approach:
 * - GET: https://www.placid.net/ first to warm a session (cookies).
 * - GET: https://www.placid.net/rates-fees.php using the session cookies.
 * - The endpoint returns HTML (not JSON). The HTML is scanned for each destination
 *   currency code to confirm the corridor is present in the rate table.
 * - If the HTML fetch fails, falls back to the static PROBE_DESTINATIONS list
 *   (all known from rights matrix).
 * - Source country: US only (all quotes are in USD).
 * - Primary delivery method: bank_deposit.
 *
 * Entry URL: https://www.placid.net
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// Placid only processes USD sends from the US
const SOURCE_COUNTRIES = ['US']

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD',
  BD: 'BDT', GH: 'GHS', IN: 'INR', KE: 'KES', NP: 'NPR', PK: 'PKR',
  PH: 'PHP', SN: 'XOF', LK: 'LKR', TH: 'THB', VN: 'VND',
}

const PROBE_DESTINATIONS = [
  'BD', 'GH', 'IN', 'KE', 'NP', 'PK', 'PH', 'SN', 'LK', 'TH', 'VN',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const BASE_URL = 'https://www.placid.net'
const RATES_URL = 'https://www.placid.net/rates-fees.php'

const WARMUP_HEADERS = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'user-agent': UA,
}

const RATES_HEADERS = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'user-agent': UA,
  'origin': BASE_URL,
  'referer': `${BASE_URL}/`,
}

/**
 * Extract Set-Cookie headers from a fetch Response and format them as a
 * Cookie request header value (name=value pairs, semicolon separated).
 */
function extractCookies(resp: Response): string {
  const raw = resp.headers.get('set-cookie')
  if (!raw) return ''
  // set-cookie header may contain multiple values joined by comma (non-standard)
  return raw
    .split(/,(?=[^;]+=[^;])/)
    .map((c) => c.split(';')[0].trim())
    .join('; ')
}

export class PlacidDiscovery extends ProviderDiscovery {
  constructor() {
    super('placid', 'Placid')
  }

  protected get entryUrl(): string {
    return super.entryUrl || BASE_URL
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('placid_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    // Step 1: warm up the session to acquire cookies
    let cookieHeader = ''
    try {
      const warmupResp = await fetch(BASE_URL, {
        headers: WARMUP_HEADERS,
        redirect: 'follow',
      })
      cookieHeader = extractCookies(warmupResp)
    } catch (err) {
      this.logger.warn('placid_warmup_failed', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Step 2: fetch the rates-fees page
    let ratesHtml: string | null = null
    try {
      const headers: Record<string, string> = { ...RATES_HEADERS }
      if (cookieHeader) headers['cookie'] = cookieHeader

      const ratesResp = await fetch(RATES_URL, { headers, redirect: 'follow' })

      if (ratesResp.ok) {
        ratesHtml = await ratesResp.text()
      } else {
        this.logger.warn('placid_rates_page_error', {
          status: ratesResp.status,
          sourceCountry,
        })
      }
    } catch (err) {
      this.logger.warn('placid_rates_fetch_failed', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Step 3: if HTML unavailable, return static list
    if (!ratesHtml) {
      const staticList = PROBE_DESTINATIONS.filter((d) => d !== sourceCountry)
      this.logger.info('placid_dest_countries_discovered', {
        sourceCountry,
        count: staticList.length,
        method: 'static_fallback',
      })
      return staticList
    }

    // Step 4: scan the HTML for each destination currency code
    const confirmed: string[] = []
    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const currency = COUNTRY_CURRENCY[dest]
      if (!currency) continue

      // Look for the currency code as a standalone token in the HTML
      const currencyPattern = new RegExp(`\\b${currency}\\b`)
      if (currencyPattern.test(ratesHtml)) {
        confirmed.push(dest)
      }
    }

    // If HTML parsing yielded nothing useful, fall back to the full static list
    const destinations = confirmed.length > 0
      ? confirmed
      : PROBE_DESTINATIONS.filter((d) => d !== sourceCountry)

    this.logger.info('placid_dest_countries_discovered', {
      sourceCountry,
      count: destinations.length,
      method: confirmed.length > 0 ? 'html_parse' : 'static_fallback',
    })
    return destinations
  }

  protected async discoverDeliveryMethods(
    _browser: DiscoveryBrowser,
    corridorId: string,
  ): Promise<DiscoveredDeliveryMethod[]> {
    // Placid's primary channel is bank deposit
    return [
      {
        corridorId,
        rawPayinLabel: 'bank_transfer',
        normalizedPayin: 'bank_transfer',
        rawPayoutLabel: 'Bank Deposit',
        normalizedPayout: 'bank_deposit',
        unmapped: false,
      },
    ]
  }

  protected async detectPromotions(
    browser: DiscoveryBrowser,
  ): Promise<DiscoveredPromotion[]> {
    const promos: DiscoveredPromotion[] = []

    try {
      const content = await browser.content()
      const promoPatterns: Array<{ regex: RegExp; type: DiscoveredPromotionType }> = [
        { regex: /first\s+transfer\s+free/i,            type: 'first_transfer' },
        { regex: /(?:no|zero|0)\s*(?:transfer\s+)?fee/i, type: 'zero_fee' },
        { regex: /fee[\s-]*free/i,                       type: 'zero_fee' },
        { regex: /(?:reduced?|discount)\s+fee/i,         type: 'reduced_fee' },
        { regex: /refer\s+(?:a\s+)?friend/i,             type: 'referral' },
        { regex: /special\s+(?:exchange\s+)?rate/i,      type: 'bonus_rate' },
        { regex: /best\s+exchange\s+rate/i,              type: 'bonus_rate' },
        { regex: /low(?:est)?\s+fee/i,                   type: 'reduced_fee' },
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
      this.logger.warn('placid_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('placid_promos_detected', { count: promos.length })
    return promos
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
