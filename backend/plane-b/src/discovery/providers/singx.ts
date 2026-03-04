/**
 * SingX discovery script.
 *
 * API-first approach:
 * - POST: hits api.singx.co/central/landing/fx/SG/exchange
 *   with fromCurrency, toCurrency, amount, type, swift, cashPickup, wallet, business params.
 * - Two source countries: SG, US.
 * - 38 destination currencies (Asia-Pacific and global focused).
 * - Three delivery modes probed via cashPickup and wallet boolean flags.
 * - Response: exchange rate / rate field indicating corridor support.
 *
 * Entry URL: https://www.singx.co
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// SingX source countries (from rights matrix)
const SOURCE_COUNTRIES = ['SG', 'US']

const SOURCE_CURRENCY: Record<string, string> = {
  SG: 'SGD',
  US: 'USD',
}

const COUNTRY_CURRENCY: Record<string, string> = {
  SG: 'SGD', US: 'USD',
  PL: 'PLN', PK: 'PKR', UG: 'UGX', BD: 'BDT', GB: 'GBP', IN: 'INR',
  PH: 'PHP', TH: 'THB', VN: 'VND', AU: 'AUD', LK: 'LKR', NP: 'NPR',
  ID: 'IDR', MY: 'MYR', CN: 'CNY', HK: 'HKD', JP: 'JPY', KR: 'KRW',
  EU: 'EUR', NZ: 'NZD', CA: 'CAD', ZA: 'ZAR', KE: 'KES', GH: 'GHS',
  MX: 'MXN', CO: 'COP', BW: 'BWP', MU: 'MUR', TZ: 'TZS', RW: 'RWF',
  NG: 'NGN', TR: 'TRY', AE: 'AED', MM: 'MMK', KH: 'KHR', BN: 'BND',
}

// SingX destinations (all currencies supported from SGD; USD supports a subset)
const PROBE_DESTINATIONS_SGD = [
  'PL', 'PK', 'UG', 'BD', 'GB', 'IN', 'PH', 'TH', 'VN', 'AU',
  'LK', 'NP', 'ID', 'MY', 'CN', 'HK', 'JP', 'KR', 'EU', 'NZ',
  'CA', 'ZA', 'KE', 'GH', 'MX', 'CO', 'BW', 'MU', 'TZ', 'RW',
  'NG', 'TR', 'AE', 'MM', 'KH', 'BN', 'US',
]

// USD source supports a narrower set of corridors
const PROBE_DESTINATIONS_USD = [
  'IN', 'PH', 'BD', 'LK', 'NP', 'PK', 'ID', 'MY', 'SG', 'CN',
  'HK', 'JP', 'KR', 'TH', 'VN', 'AU', 'GB', 'AE',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const EXCHANGE_ENDPOINT = 'https://api.singx.co/central/landing/fx/SG/exchange'

type SingXResponse = {
  exchangeRate?: number | string | null
  rate?: number | string | null
  fxRate?: number | string | null
  data?: {
    exchangeRate?: number | string | null
    rate?: number | string | null
  } | null
  error?: string | null
  success?: boolean | null
}

const SINGX_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'content-type': 'application/json',
  'origin': 'https://www.singx.co',
  'referer': 'https://www.singx.co/',
  'user-agent': UA,
}

// Delivery method probing configurations
const DELIVERY_METHOD_PROBES = [
  {
    cashPickup: false,
    wallet: false,
    rawPayoutLabel: 'bank_transfer',
    normalizedPayout: 'bank_deposit',
  },
  {
    cashPickup: true,
    wallet: false,
    rawPayoutLabel: 'cash_pickup',
    normalizedPayout: 'cash_pickup',
  },
  {
    cashPickup: false,
    wallet: true,
    rawPayoutLabel: 'wallet',
    normalizedPayout: 'mobile_wallet',
  },
]

function extractRate(data: SingXResponse): number {
  const candidates = [
    data.exchangeRate,
    data.rate,
    data.fxRate,
    data.data?.exchangeRate,
    data.data?.rate,
  ]
  for (const candidate of candidates) {
    if (candidate != null) {
      const parsed = parseFloat(String(candidate))
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  }
  return 0
}

export class SingXDiscovery extends ProviderDiscovery {
  constructor() {
    super('singx', 'SingX')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.singx.co'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('singx_source_countries_discovered', {
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

    const probeList = sourceCountry === 'US' ? PROBE_DESTINATIONS_USD : PROBE_DESTINATIONS_SGD

    for (const dest of probeList) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue

      try {
        const body = {
          fromCurrency: srcCurrency,
          toCurrency: destCurrency,
          amount: '500.00',
          type: 'Send',
          swift: false,
          cashPickup: false,
          wallet: false,
          business: false,
        }

        const resp = await fetch(EXCHANGE_ENDPOINT, {
          method: 'POST',
          headers: SINGX_HEADERS,
          body: JSON.stringify(body),
        })

        if (resp.status === 429) {
          this.logger.warn('singx_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as SingXResponse
          const rate = extractRate(data)
          if (rate > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('singx_dest_countries_discovered', {
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
    const [_srcCountry, _destCountry, srcCurrency, destCurrency] = parts

    // Probe each delivery mode by toggling cashPickup and wallet flags
    for (const probe of DELIVERY_METHOD_PROBES) {
      try {
        const body = {
          fromCurrency: srcCurrency,
          toCurrency: destCurrency,
          amount: '500.00',
          type: 'Send',
          swift: false,
          cashPickup: probe.cashPickup,
          wallet: probe.wallet,
          business: false,
        }

        const resp = await fetch(EXCHANGE_ENDPOINT, {
          method: 'POST',
          headers: SINGX_HEADERS,
          body: JSON.stringify(body),
        })

        if (resp.status === 429) {
          this.logger.warn('singx_rate_limited_methods', { corridorId, probe: probe.rawPayoutLabel })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as SingXResponse
          const rate = extractRate(data)
          if (rate > 0) {
            methods.push({
              corridorId,
              rawPayinLabel: 'bank_transfer',
              normalizedPayin: 'bank_transfer',
              rawPayoutLabel: probe.rawPayoutLabel,
              normalizedPayout: probe.normalizedPayout,
              unmapped: false,
            })
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    // If no methods found, default to bank_deposit (SingX's primary channel)
    if (methods.length === 0) {
      methods.push({
        corridorId,
        rawPayinLabel: 'bank_transfer',
        normalizedPayin: 'bank_transfer',
        rawPayoutLabel: 'bank_transfer',
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

      // API-based promo: probe SG→IN corridor for promotional vs standard rate
      try {
        const bodyStandard = {
          fromCurrency: 'SGD',
          toCurrency: 'INR',
          amount: '500.00',
          type: 'Send',
          swift: false,
          cashPickup: false,
          wallet: false,
          business: false,
        }
        const resp = await fetch(EXCHANGE_ENDPOINT, {
          method: 'POST',
          headers: SINGX_HEADERS,
          body: JSON.stringify(bodyStandard),
        })
        if (resp.status === 200) {
          const data = await resp.json() as SingXResponse & { baseRate?: number | null; promotionalRate?: number | null }
          const currentRate = extractRate(data)
          const baseRate = data.baseRate != null ? parseFloat(String(data.baseRate)) : null
          if (currentRate > 0 && baseRate != null && baseRate > 0 && currentRate > baseRate) {
            promos.push({
              type: 'bonus_rate',
              corridorId: 'SG-IN-SGD-INR',
              rawText: `Promo rate ${currentRate} vs base ${baseRate}`,
              strikethroughDetected: false,
              originalValue: String(baseRate),
              promoValue: String(currentRate),
              expiresAt: null,
              bannerSelector: null,
            })
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('singx_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('singx_promos_detected', { count: promos.length })
    return promos
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_CURRENCY[countryCode] ?? null
  }
}
