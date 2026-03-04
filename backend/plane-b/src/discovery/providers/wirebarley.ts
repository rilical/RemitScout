/**
 * WireBarley discovery script.
 *
 * API-first approach:
 * - GET: hits wirebarley.com/kr/remittance/api/v1/exrate/{country}/{currency}
 *   to discover available corridors and delivery methods.
 * - KR (KRW) is the only source country.
 * - Single call returns data.exRates[] with ALL destinations.
 * - Each exRate entry has country, currency, paymentFees[] (with option field
 *   like KR_OPEN_API, BANK_ACCOUNT), and transferFees[].
 *
 * Entry URL: https://www.wirebarley.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

const SOURCE_COUNTRIES = ['KR']

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const EXRATE_BASE = 'https://www.wirebarley.com/kr/remittance/api/v1/exrate'

type WireBarleyPaymentFee = {
  option?: string | null
  country?: string | null
  dest?: string | null
  fee1?: number | null
  discountFee1?: number | null
}

type WireBarleyExRate = {
  country?: string | null
  currency?: string | null
  wbRate?: number | null
  baseRate?: number | null
  status?: string | null
  paymentFees?: WireBarleyPaymentFee[] | null
}

type WireBarleyResponse = {
  data?: {
    exRates?: WireBarleyExRate[] | null
  } | null
  status?: string | null
}

const HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'content-type': 'application/json',
  'accept-language': 'en-US',
  'device-type': 'WEB',
  'device-model': 'Chrome',
  'device-version': '143.0.0.0',
  'lang': 'en',
  'origin': 'https://www.wirebarley.com',
  'referer': 'https://www.wirebarley.com/',
  'user-agent': UA,
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  KR: 'KRW',
}

export class WireBarleyDiscovery extends ProviderDiscovery {
  constructor() {
    super('wirebarley', 'WireBarley')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.wirebarley.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('wirebarley_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const srcCurrency = sourceCountry === 'KR' ? 'KRW' : 'KRW'

    try {
      const url = `${EXRATE_BASE}/${sourceCountry}/${srcCurrency}`
      const resp = await fetch(url, { headers: HEADERS })

      if (resp.status === 429) {
        this.logger.warn('wirebarley_rate_limited', { sourceCountry })
        return []
      }

      if (resp.status !== 200) return []

      const data = await resp.json() as WireBarleyResponse
      const exRates = data.data?.exRates ?? []

      // Extract unique destination countries and cache currencies
      const activeRates = exRates.filter((r) => r.country && r.status === 'ACTIVE')
      for (const rate of activeRates) {
        if (rate.country && rate.currency) {
          this.discoveredCurrencies[rate.country] = rate.currency
        }
      }
      this.discoveredCurrencies[sourceCountry] = srcCurrency

      const destinations = [...new Set(
        activeRates.map((r) => r.country as string),
      )]

      this.logger.info('wirebarley_dest_countries_discovered', {
        sourceCountry,
        count: destinations.length,
      })
      return destinations
    } catch {
      this.logger.warn('wirebarley_dest_discovery_error', { sourceCountry })
      return []
    }
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
      const url = `${EXRATE_BASE}/${srcCountry}/${srcCurrency}`
      const resp = await fetch(url, { headers: HEADERS })

      if (resp.status !== 200) return methods

      const data = await resp.json() as WireBarleyResponse
      const exRates = data.data?.exRates ?? []

      // Find the exRate entry matching this corridor's destination
      const entry = exRates.find(
        (r) => r.country === destCountry && r.currency === destCurrency,
      )
      if (!entry) return methods

      // Extract payin methods from paymentFees[].option
      const seenMethods = new Set<string>()
      for (const fee of entry.paymentFees ?? []) {
        const rawPayin = fee.option ?? 'KR_OPEN_API'
        if (seenMethods.has(rawPayin)) continue
        seenMethods.add(rawPayin)

        methods.push({
          corridorId,
          rawPayinLabel: rawPayin,
          normalizedPayin: this.normalizePayin(rawPayin),
          rawPayoutLabel: 'bank_account',
          normalizedPayout: 'bank_deposit',
          unmapped: false,
        })
      }

      // If no methods found, add default
      if (methods.length === 0) {
        methods.push({
          corridorId,
          rawPayinLabel: 'KR_OPEN_API',
          normalizedPayin: 'bank_transfer',
          rawPayoutLabel: 'bank_account',
          normalizedPayout: 'bank_deposit',
          unmapped: false,
        })
      }
    } catch (err) {
      this.logger.warn('wirebarley_method_discovery_error', {
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
        { regex: /refer\s+(?:a\s+)?friend/i, type: 'referral' },
        { regex: /coupon|promo(?:tion)?(?:\s+code)?/i, type: 'reduced_fee' },
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

      // API-based promo: check if any exRate entry has discount fees
      try {
        const resp = await fetch(`${EXRATE_BASE}/KR/KRW`, { headers: HEADERS })
        if (resp.status === 200) {
          const data = await resp.json() as WireBarleyResponse
          for (const entry of data.data?.exRates ?? []) {
            for (const fee of entry.paymentFees ?? []) {
              if (fee.discountFee1 != null && fee.fee1 != null && fee.discountFee1 < fee.fee1) {
                promos.push({
                  type: 'reduced_fee',
                  corridorId: entry.country ? `KR-${entry.country}-KRW-${entry.currency}` : null,
                  rawText: `Fee discounted from ${fee.fee1} to ${fee.discountFee1} on ${fee.option}`,
                  strikethroughDetected: false,
                  originalValue: String(fee.fee1),
                  promoValue: String(fee.discountFee1),
                  expiresAt: null,
                  bannerSelector: null,
                })
                break
              }
            }
            if (promos.some((p) => p.type === 'reduced_fee' && p.corridorId)) break
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('wirebarley_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('wirebarley_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayin(option: string): string {
    const upper = option.toUpperCase()
    if (upper.includes('OPEN_API')) return 'bank_transfer'
    if (upper.includes('BANK')) return 'bank_transfer'
    if (upper.includes('CARD')) return 'debit_card'
    return 'bank_transfer'
  }

  protected getCurrency(countryCode: string): string | null {
    return COUNTRY_TO_CURRENCY[countryCode] ?? this.discoveredCurrencies[countryCode] ?? null
  }
}
