/**
 * Wells Fargo discovery script.
 *
 * API-first approach:
 * - POST: hits wellsfargo.com/as/grs/country/rnm/paymentMethod/amount
 *   with URL-encoded body: country, location, method, sendAmount, lang.
 * - 1 source country: US (only market).
 * - 1 destination country: MX (only supported destination).
 * - Single delivery method: bank_deposit (ACCT_TO_ACCT).
 * - Response: JSON with rate/fee data indicating corridor availability.
 *
 * Wells Fargo ExpressSend is a dedicated remittance product targeting
 * the US→Mexico corridor via bank account transfers.
 *
 * Entry URL: https://www.wellsfargo.com/international-remittances/cost-estimator/
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// Wells Fargo only supports sending from the US
const SOURCE_COUNTRIES = ['US']

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD',
  MX: 'MXN',
}

// Only destination supported by Wells Fargo ExpressSend
const PROBE_DESTINATIONS = ['MX']

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const COST_ESTIMATOR_ENDPOINT = 'https://www.wellsfargo.com/as/grs/country/rnm/paymentMethod/amount'

const WELLSFARGO_HEADERS = {
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'accept': 'application/json, text/javascript, */*; q=0.01',
  'origin': 'https://www.wellsfargo.com',
  'referer': 'https://www.wellsfargo.com/international-remittances/cost-estimator/',
  'user-agent': UA,
  'x-requested-with': 'XMLHttpRequest',
}

type WellsFargoResponse = {
  exchangeRate?: number | string | null
  fee?: number | string | null
  totalAmount?: number | string | null
  destinationAmount?: number | string | null
  errorMessage?: string | null
  errorCode?: string | null
}

export class WellsFargoDiscovery extends ProviderDiscovery {
  constructor() {
    super('wellsfargo', 'Wells Fargo')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.wellsfargo.com/international-remittances/cost-estimator/'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('wellsfargo_source_countries_discovered', {
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

      try {
        const body = new URLSearchParams({
          country: dest,
          location: '9',
          method: 'ACCT_TO_ACCT',
          sendAmount: '500',
          lang: 'en',
        }).toString()

        const resp = await fetch(COST_ESTIMATOR_ENDPOINT, {
          method: 'POST',
          headers: WELLSFARGO_HEADERS,
          body,
        })

        if (resp.status === 429) {
          this.logger.warn('wellsfargo_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as WellsFargoResponse
          const rate = data.exchangeRate
          const hasError = data.errorCode != null && data.errorCode !== ''
          if (rate != null && !hasError) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    // If API returned 0 destinations, fall back to static list (WF only serves MX)
    if (destinations.length === 0) {
      const staticDests = PROBE_DESTINATIONS.filter((d) => d !== sourceCountry)
      this.logger.info('wellsfargo_dest_countries_static_fallback', {
        sourceCountry,
        count: staticDests.length,
      })
      return staticDests
    }

    this.logger.info('wellsfargo_dest_countries_discovered', {
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
    const [_srcCountry, destCountry] = parts

    try {
      const body = new URLSearchParams({
        country: destCountry,
        location: '9',
        method: 'ACCT_TO_ACCT',
        sendAmount: '500',
        lang: 'en',
      }).toString()

      const resp = await fetch(COST_ESTIMATOR_ENDPOINT, {
        method: 'POST',
        headers: WELLSFARGO_HEADERS,
        body,
      })

      if (resp.status === 429) {
        this.logger.warn('wellsfargo_rate_limited_methods', { corridorId })
        return methods
      }

      if (resp.status === 200) {
        const data = await resp.json() as WellsFargoResponse
        const rate = data.exchangeRate
        const hasError = data.errorCode != null && data.errorCode !== ''
        if (rate != null && !hasError) {
          methods.push({
            corridorId,
            rawPayinLabel: 'ACCT_TO_ACCT',
            normalizedPayin: 'bank_transfer',
            rawPayoutLabel: 'ACCT_TO_ACCT',
            normalizedPayout: 'bank_deposit',
            unmapped: false,
          })
        }
      }
    } catch (err) {
      this.logger.warn('wellsfargo_method_discovery_error', {
        corridorId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // If no methods found, default to bank_transfer + bank_deposit
    if (methods.length === 0) {
      methods.push({
        corridorId,
        rawPayinLabel: 'ACCT_TO_ACCT',
        normalizedPayin: 'bank_transfer',
        rawPayoutLabel: 'ACCT_TO_ACCT',
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
        { regex: /waived?\s+fee|no\s+charge/i, type: 'zero_fee' },
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

      // API-based promo: check if fee returns 0 on the US→MX corridor
      try {
        const body = new URLSearchParams({
          country: 'MX',
          location: '9',
          method: 'ACCT_TO_ACCT',
          sendAmount: '500',
          lang: 'en',
        }).toString()

        const resp = await fetch(COST_ESTIMATOR_ENDPOINT, {
          method: 'POST',
          headers: WELLSFARGO_HEADERS,
          body,
        })
        if (resp.status === 200) {
          const data = await resp.json() as WellsFargoResponse
          const fee = parseFloat(String(data.fee ?? '1'))
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
      this.logger.warn('wellsfargo_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('wellsfargo_promos_detected', { count: promos.length })
    return promos
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
