/**
 * Al Ansari Exchange discovery script.
 *
 * Hybrid static/dynamic approach:
 * - GET: fetches homepage to extract CSRF nonce from CC_Ajax_Object / BN_Ajax_Object
 *   JavaScript objects embedded in the page HTML.
 * - POST: https://alansariexchange.com/wp-admin/admin-ajax.php with WordPress AJAX
 *   action=convert_action to probe whether a corridor is active.
 * - If nonce extraction fails, falls back to a static PROBE_DESTINATIONS list
 *   (known from the rights matrix — Al Ansari supports 227 destinations).
 * - Source country: AE only.
 * - Primary delivery methods: cash_pickup and bank_deposit.
 *
 * Note: Al Ansari requires numeric countryId + currencyId for the AJAX endpoint.
 * A mapping for the top destinations is hardcoded below. Destinations not in the
 * map are validated via the static fallback only.
 *
 * Entry URL: https://alansariexchange.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// Al Ansari only sends from the UAE
const SOURCE_COUNTRIES = ['AE']

const COUNTRY_CURRENCY: Record<string, string> = {
  AE: 'AED',
  US: 'USD', GB: 'GBP', IN: 'INR', PH: 'PHP', PK: 'PKR', BD: 'BDT',
  EG: 'EGP', LK: 'LKR', NP: 'NPR', JO: 'JOD', LB: 'LBP', SA: 'SAR',
  KW: 'KWD', BH: 'BHD', OM: 'OMR', QA: 'QAR', ID: 'IDR', TH: 'THB',
  MY: 'MYR', SG: 'SGD', AU: 'AUD', CA: 'CAD', NZ: 'NZD', ZA: 'ZAR',
  KE: 'KES', NG: 'NGN', GH: 'GHS', TR: 'TRY', CN: 'CNY', JP: 'JPY',
  KR: 'KRW', VN: 'VND',
}

// Focused probe list (Al Ansari has 227 destinations; we probe a representative subset)
const PROBE_DESTINATIONS = [
  'US', 'GB', 'IN', 'PH', 'PK', 'BD', 'EG', 'LK', 'NP', 'JO',
  'LB', 'SA', 'KW', 'BH', 'OM', 'QA', 'ID', 'TH', 'MY', 'SG',
  'AU', 'CA', 'NZ', 'ZA', 'KE', 'NG', 'GH', 'TR', 'CN', 'JP',
  'KR', 'VN',
]

// Numeric IDs required by the WordPress AJAX endpoint (sourced from provider frontend JS)
const DESTINATION_IDS: Record<string, { countryId: string; currencyId: string }> = {
  IN: { countryId: '100', currencyId: '54' },
  PH: { countryId: '172', currencyId: '142' },
  PK: { countryId: '165', currencyId: '144' },
  BD: { countryId: '17',  currencyId: '18' },
  EG: { countryId: '63',  currencyId: '48' },
  LK: { countryId: '204', currencyId: '88' },
  US: { countryId: '231', currencyId: '170' },
  GB: { countryId: '232', currencyId: '62' },
}

// Source currency ID for AED on the Al Ansari AJAX endpoint
const AED_CURRENCY_ID = '91'

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const HOMEPAGE_URL = 'https://alansariexchange.com'
const AJAX_ENDPOINT = 'https://alansariexchange.com/wp-admin/admin-ajax.php'

const HOMEPAGE_HEADERS = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'user-agent': UA,
}

const AJAX_HEADERS = {
  'accept': '*/*',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'origin': 'https://alansariexchange.com',
  'referer': 'https://alansariexchange.com/',
  'user-agent': UA,
  'x-requested-with': 'XMLHttpRequest',
}

// Nonce patterns embedded in WordPress page scripts
const NONCE_PATTERNS = [
  /"security"\s*:\s*"([a-f0-9]{10,})"/,
  /nonce['"]\s*:\s*['"]([a-f0-9]{10,})['"]/,
  /['"]nonce['"]\s*,\s*['"]([a-f0-9]{10,})['"]/,
]

type AjaxConvertResponse = {
  success?: boolean
  data?: {
    rate?: string | number | null
    currency?: string | null
  } | null
}

/**
 * Attempt to extract the WordPress CSRF nonce from the homepage HTML.
 * Returns null if no nonce is found (caller falls back to static list).
 */
function extractNonce(html: string): string | null {
  for (const pattern of NONCE_PATTERNS) {
    const match = pattern.exec(html)
    if (match?.[1]) return match[1]
  }
  return null
}

export class AlAnsariDiscovery extends ProviderDiscovery {
  constructor() {
    super('alansari', 'Al Ansari Exchange')
  }

  protected get entryUrl(): string {
    return super.entryUrl || HOMEPAGE_URL
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('alansari_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    // Step 1: try to fetch the homepage and extract the nonce
    let nonce: string | null = null
    try {
      const homepageResp = await fetch(HOMEPAGE_URL, { headers: HOMEPAGE_HEADERS })
      if (homepageResp.ok) {
        const html = await homepageResp.text()
        nonce = extractNonce(html)
      }
    } catch (err) {
      this.logger.warn('alansari_nonce_fetch_failed', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Step 2: if nonce extraction failed, fall back to the static probe list
    if (!nonce) {
      this.logger.warn('alansari_nonce_not_found_using_static_fallback', { sourceCountry })
      const staticList = PROBE_DESTINATIONS.filter((d) => d !== sourceCountry)
      this.logger.info('alansari_dest_countries_discovered', {
        sourceCountry,
        count: staticList.length,
        method: 'static_fallback',
      })
      return staticList
    }

    // Step 3: probe destinations that have known numeric IDs via the AJAX endpoint
    const confirmed: string[] = []
    const noIdFallback: string[] = []

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue

      const ids = DESTINATION_IDS[dest]
      if (!ids) {
        // No numeric IDs available — include in fallback list (corridor likely exists)
        noIdFallback.push(dest)
        continue
      }

      try {
        const body = new URLSearchParams({
          action: 'convert_action',
          currfrom: AED_CURRENCY_ID,
          currto: ids.currencyId,
          cntcode: ids.countryId,
          amt: '500',
          security: nonce,
          trtype: 'CP',
        })

        const resp = await fetch(AJAX_ENDPOINT, {
          method: 'POST',
          headers: AJAX_HEADERS,
          body: body.toString(),
        })

        if (resp.status === 429) {
          this.logger.warn('alansari_rate_limited', { sourceCountry, dest })
          // Include remaining destinations via static fallback
          noIdFallback.push(dest)
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as AjaxConvertResponse
          if (data.success === true && data.data?.rate != null) {
            confirmed.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error — include in fallback
        noIdFallback.push(dest)
      }
    }

    const destinations = [...new Set([...confirmed, ...noIdFallback])]
    this.logger.info('alansari_dest_countries_discovered', {
      sourceCountry,
      count: destinations.length,
      confirmedViaApi: confirmed.length,
      staticFallback: noIdFallback.length,
      method: 'hybrid',
    })
    return destinations
  }

  protected async discoverDeliveryMethods(
    _browser: DiscoveryBrowser,
    corridorId: string,
  ): Promise<DiscoveredDeliveryMethod[]> {
    // Al Ansari's two primary delivery channels
    return [
      {
        corridorId,
        rawPayinLabel: 'cash',
        normalizedPayin: 'cash',
        rawPayoutLabel: 'Cash Pickup',
        normalizedPayout: 'cash_pickup',
        unmapped: false,
      },
      {
        corridorId,
        rawPayinLabel: 'cash',
        normalizedPayin: 'cash',
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
        { regex: /best\s+(?:exchange\s+)?rate/i,         type: 'bonus_rate' },
        { regex: /ramadan\s+offer/i,                     type: 'seasonal' },
        { regex: /eid\s+offer/i,                         type: 'seasonal' },
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
      this.logger.warn('alansari_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('alansari_promos_detected', { count: promos.length })
    return promos
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
