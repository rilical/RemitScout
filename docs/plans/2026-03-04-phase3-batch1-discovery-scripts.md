# Phase 3 Batch 1: Discovery Scripts for WorldRemit, XE, TransferGo, Western Union

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build discovery scripts for the next 4 providers, following the same pattern established by Wise/Paysend/Remitly in Phase 2. Each script discovers corridors, delivery methods, and promotions from live provider APIs.

**Architecture:** Each provider gets a `ProviderDiscovery` subclass in `backend/plane-b/src/discovery/providers/`. All 4 use HTTP APIs (no Playwright browser automation needed). Scripts are registered in `discovery-runner.ts` for orchestrated scanning.

**Tech Stack:** TypeScript, Node.js `fetch()`, existing `ProviderDiscovery` base class, existing code-map normalizers.

**Reference files:**
- Base class: `backend/plane-b/src/discovery/discovery-base.ts`
- Types: `backend/plane-b/src/discovery/discovery-types.ts`
- Runner: `backend/plane-b/src/discovery/discovery-runner.ts`
- Example: `backend/plane-b/src/discovery/providers/wise.ts` (Phase 2)

---

### Task 1: WorldRemit Discovery Script

**Files:**
- Create: `backend/plane-b/src/discovery/providers/worldremit.ts`
- Modify: `backend/plane-b/src/discovery/discovery-runner.ts` (add factory)
- Reference: `backend/plane-b/src/collectors/worldremit/parse.ts`, `backend/plane-b/src/collectors/worldremit/code-map.ts`

**Context:**
- WorldRemit uses a **GraphQL API** at `https://api.worldremit.com/graphql`
- Two operations: `PayoutMethods` query (delivery methods) and `createCalculation` mutation (fees/rates)
- Payout codes: `BNK` (bank_deposit), `CSH` (cash_pickup), `MOB` (mobile_wallet), `ATP` (airtime)
- Promo detection: `exchangeRate.crossedOutValue` vs `exchangeRate.value` for rate boosts, `informativeSummary.discount.value.amount > 0` for fee discounts
- 37k+ supported corridors from `backend/plane-b/src/providers/worldremit/supported-corridors.ts`
- 10 health corridors in catalog

**Step 1: Create the discovery script**

Create `backend/plane-b/src/discovery/providers/worldremit.ts`:

```typescript
/**
 * WorldRemit discovery script.
 *
 * API-first approach:
 * - GraphQL: hits api.worldremit.com/graphql to discover payout methods
 *   and calculate quotes with fee/rate/promo data per corridor.
 * - No Playwright needed — pure HTTP API calls.
 *
 * Entry URL: https://www.worldremit.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// WorldRemit uses these source countries (from supported-corridors.ts)
const KNOWN_SOURCE_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'NZ', 'FR', 'DE', 'IT', 'ES', 'NL',
  'BE', 'AT', 'IE', 'PT', 'FI', 'NO', 'SE', 'DK', 'CH', 'SG',
  'JP', 'ZA', 'AE', 'HK',
]

// Default currency per country for API calls
const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD',
  FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR',
  NO: 'NOK', SE: 'SEK', DK: 'DKK', CH: 'CHF', SG: 'SGD',
  JP: 'JPY', ZA: 'ZAR', AE: 'AED', HK: 'HKD',
  MX: 'MXN', PH: 'PHP', IN: 'INR', NG: 'NGN', PK: 'PKR',
  BD: 'BDT', LK: 'LKR', GH: 'GHS', KE: 'KES', VN: 'VND',
  TH: 'THB', CN: 'CNY', ID: 'IDR', MY: 'MYR', BR: 'BRL',
  CO: 'COP', PE: 'PEN', EG: 'EGP', MA: 'MAD', TZ: 'TZS',
  UG: 'UGX', RW: 'RWF', ET: 'ETB', CM: 'XAF', SN: 'XOF',
}

// Sample destinations for discovery (high-traffic corridors)
const PROBE_DESTINATIONS = [
  'MX', 'PH', 'IN', 'NG', 'PK', 'BD', 'LK', 'GH', 'KE', 'VN',
  'TH', 'CN', 'ID', 'MY', 'BR', 'CO', 'PE', 'EG', 'MA', 'TZ',
  'UG', 'RW', 'ET', 'CM', 'SN', 'ZA', 'TR', 'UA', 'JO', 'NP',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

const PAYOUT_METHODS_QUERY = `
  query PayoutMethods($sendCountry: String!, $recvCountry: String!, $sendCurrency: String!, $recvCurrency: String!) {
    payOutMethods(
      sendingCountryCode: $sendCountry
      receivingCountryCode: $recvCountry
      sendingCurrencyCode: $sendCurrency
      receivingCurrencyCode: $recvCurrency
    ) {
      code
      name
      payOutTimeEstimate
    }
  }
`

export class WorldRemitDiscovery extends ProviderDiscovery {
  constructor() {
    super('worldremit', 'WorldRemit')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.worldremit.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    // WorldRemit source countries are well-known; validate via page links
    this.logger.info('worldremit_source_countries_discovered', {
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

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue

      try {
        const resp = await fetch('https://api.worldremit.com/graphql', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'user-agent': UA,
          },
          body: JSON.stringify({
            query: PAYOUT_METHODS_QUERY,
            variables: {
              sendCountry: sourceCountry,
              recvCountry: dest,
              sendCurrency: srcCurrency,
              recvCurrency: destCurrency,
            },
          }),
        })

        if (resp.status === 429) {
          this.logger.warn('worldremit_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as {
            data?: { payOutMethods?: Array<{ code?: string }> }
          }
          if ((data.data?.payOutMethods ?? []).length > 0) {
            destinations.push(dest)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('worldremit_dest_countries_discovered', {
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
      const resp = await fetch('https://api.worldremit.com/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': UA,
        },
        body: JSON.stringify({
          query: PAYOUT_METHODS_QUERY,
          variables: {
            sendCountry: srcCountry,
            recvCountry: destCountry,
            sendCurrency: srcCurrency,
            recvCurrency: destCurrency,
          },
        }),
      })

      if (resp.status !== 200) return methods

      const data = await resp.json() as {
        data?: {
          payOutMethods?: Array<{ code?: string; name?: string }>
        }
      }

      const seenCodes = new Set<string>()
      for (const m of data.data?.payOutMethods ?? []) {
        const code = m.code ?? 'UNKNOWN'
        if (seenCodes.has(code)) continue
        seenCodes.add(code)

        methods.push({
          corridorId,
          rawPayinLabel: 'BANK_TRANSFER',
          normalizedPayin: 'bank_transfer',
          rawPayoutLabel: code,
          normalizedPayout: this.normalizePayout(code),
          unmapped: false,
        })
      }
    } catch (err) {
      this.logger.warn('worldremit_method_discovery_error', {
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
      this.logger.warn('worldremit_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('worldremit_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayout(code: string): string {
    const map: Record<string, string> = {
      BNK: 'bank_deposit', BANK: 'bank_deposit',
      CSH: 'cash_pickup', CASH: 'cash_pickup',
      MOB: 'mobile_wallet', MOBILE_WALLET: 'mobile_wallet',
      ATP: 'airtime', AIRTIME: 'airtime',
    }
    return map[code.toUpperCase()] ?? 'bank_deposit'
  }
}
```

**Step 2: Register in discovery-runner.ts**

Add to `PROVIDER_FACTORIES` in `backend/plane-b/src/discovery/discovery-runner.ts`:

```typescript
worldremit: async () => {
  const { WorldRemitDiscovery } = await import('./providers/worldremit')
  return new WorldRemitDiscovery()
},
```

**Step 3: Run validation test**

Create a temporary test script to validate against the real WorldRemit API (test GraphQL payout methods for US→NG, US→PH). Verify:
- At least 2 payout methods discovered (BNK, MOB or CSH)
- Country discovery finds at least 15 destinations
- No rate limiting on initial requests

Clean up test script after validation passes.

**Step 4: Commit**

```bash
git add backend/plane-b/src/discovery/providers/worldremit.ts backend/plane-b/src/discovery/discovery-runner.ts
git commit -m "feat(plane-b): add WorldRemit discovery script with GraphQL API probing"
```

---

### Task 2: XE Discovery Script

**Files:**
- Create: `backend/plane-b/src/discovery/providers/xe.ts`
- Modify: `backend/plane-b/src/discovery/discovery-runner.ts` (add factory)
- Reference: `backend/plane-b/src/collectors/xe/parse.ts`, `backend/plane-b/src/collectors/xe/code-map.ts`

**Context:**
- XE uses a **REST API** at `https://launchpad-api.xe.com/v2/quotes` (POST)
- Response has `quote.individualQuotes[]` with `rate`, `transferFee`, `deliveryMethod`, `leadTime`
- Payout: bank_deposit, cash_pickup, mobile_wallet (only 3 types)
- Payin: hardcoded to bank_transfer only
- No promotional pricing fields in current parser
- 10 source currencies (USD, EUR, GBP, CAD, AUD, NZD, JPY, CHF, SGD, HKD)
- ~5,500 corridors, 10 health corridors

**Step 1: Create the discovery script**

Create `backend/plane-b/src/discovery/providers/xe.ts`:

```typescript
/**
 * XE discovery script.
 *
 * API-first approach:
 * - REST: hits launchpad-api.xe.com/v2/quotes to discover delivery methods
 *   and fees per corridor.
 * - XE returns individualQuotes[] with deliveryMethod and leadTime per quote.
 * - No Playwright needed — pure HTTP API calls.
 *
 * Entry URL: https://www.xe.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// XE supports these 10 source currencies
const SOURCE_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'JPY', 'CHF', 'SGD', 'HKD']

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: 'US', EUR: 'DE', GBP: 'GB', CAD: 'CA', AUD: 'AU',
  NZD: 'NZ', JPY: 'JP', CHF: 'CH', SGD: 'SG', HKD: 'HK',
}

// High-traffic destinations to probe
const PROBE_DESTINATIONS: Record<string, string> = {
  MX: 'MXN', PH: 'PHP', IN: 'INR', NG: 'NGN', PK: 'PKR',
  BD: 'BDT', LK: 'LKR', GH: 'GHS', KE: 'KES', VN: 'VND',
  TH: 'THB', CN: 'CNY', ID: 'IDR', MY: 'MYR', BR: 'BRL',
  CO: 'COP', PE: 'PEN', EG: 'EGP', MA: 'MAD', ZA: 'ZAR',
  TR: 'TRY', UA: 'UAH', JP: 'JPY', KR: 'KRW', NP: 'NPR',
}

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

export class XeDiscovery extends ProviderDiscovery {
  constructor() {
    super('xe', 'XE')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.xe.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    const countries = SOURCE_CURRENCIES
      .map((c) => CURRENCY_TO_COUNTRY[c])
      .filter((c): c is string => !!c)
    this.logger.info('xe_source_countries_discovered', { count: countries.length })
    return countries
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const destinations: string[] = []
    const srcCurrency = Object.entries(CURRENCY_TO_COUNTRY)
      .find(([, cc]) => cc === sourceCountry)?.[0] ?? 'USD'

    for (const [destCountry, destCurrency] of Object.entries(PROBE_DESTINATIONS)) {
      if (destCountry === sourceCountry) continue

      try {
        const resp = await fetch('https://launchpad-api.xe.com/v2/quotes', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'user-agent': UA,
          },
          body: JSON.stringify({
            fromCurrency: srcCurrency,
            toCurrency: destCurrency,
            amount: 500,
            fromCountry: sourceCountry,
            toCountry: destCountry,
          }),
        })

        if (resp.status === 429) {
          this.logger.warn('xe_rate_limited', { sourceCountry, destCountry })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as {
            quote?: { individualQuotes?: Array<{ rate?: number }> }
          }
          if ((data.quote?.individualQuotes ?? []).length > 0) {
            destinations.push(destCountry)
          }
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('xe_dest_countries_discovered', {
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
      const resp = await fetch('https://launchpad-api.xe.com/v2/quotes', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': UA,
        },
        body: JSON.stringify({
          fromCurrency: srcCurrency,
          toCurrency: destCurrency,
          amount: 500,
          fromCountry: srcCountry,
          toCountry: destCountry,
        }),
      })

      if (resp.status !== 200) return methods

      const data = await resp.json() as {
        quote?: {
          individualQuotes?: Array<{
            deliveryMethod?: string
          }>
        }
      }

      const seenMethods = new Set<string>()
      for (const q of data.quote?.individualQuotes ?? []) {
        const rawPayout = q.deliveryMethod ?? 'bank_deposit'
        if (seenMethods.has(rawPayout)) continue
        seenMethods.add(rawPayout)

        methods.push({
          corridorId,
          rawPayinLabel: 'bank_transfer',
          normalizedPayin: 'bank_transfer',
          rawPayoutLabel: rawPayout,
          normalizedPayout: this.normalizePayout(rawPayout),
          unmapped: false,
        })
      }
    } catch (err) {
      this.logger.warn('xe_method_discovery_error', {
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
        { regex: /(?:no|zero)\s*(?:transfer\s+)?fee/i, type: 'zero_fee' },
        { regex: /fee[\s-]*free/i, type: 'zero_fee' },
        { regex: /(?:reduced?|discount)\s+fee/i, type: 'reduced_fee' },
        { regex: /refer\s+(?:a\s+)?friend/i, type: 'referral' },
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
      this.logger.warn('xe_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('xe_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayout(raw: string): string {
    const lower = raw.toLowerCase()
    if (/cash/i.test(lower)) return 'cash_pickup'
    if (/wallet|mobile/i.test(lower)) return 'mobile_wallet'
    return 'bank_deposit'
  }
}
```

**Step 2: Register in discovery-runner.ts**

Add to `PROVIDER_FACTORIES`:

```typescript
xe: async () => {
  const { XeDiscovery } = await import('./providers/xe')
  return new XeDiscovery()
},
```

**Step 3: Run validation test**

Test XE API for US→MX, US→IN. Verify:
- At least 1 delivery method per corridor
- `deliveryMethod` field populated in response
- Source country discovery returns 10 countries

**Step 4: Commit**

```bash
git add backend/plane-b/src/discovery/providers/xe.ts backend/plane-b/src/discovery/discovery-runner.ts
git commit -m "feat(plane-b): add XE discovery script with REST API probing"
```

---

### Task 3: TransferGo Discovery Script

**Files:**
- Create: `backend/plane-b/src/discovery/providers/transfergo.ts`
- Modify: `backend/plane-b/src/discovery/discovery-runner.ts` (add factory)
- Reference: `backend/plane-b/src/collectors/transfergo/parse.ts`, `backend/plane-b/src/collectors/transfergo/code-map.ts`

**Context:**
- TransferGo uses a **REST GET API** at `https://my.transfergo.com/api/booking/quotes`
- Query params: `fromCurrencyCode`, `toCurrencyCode`, `fromCountryCode`, `toCountryCode`, `amount`, `calculationBase`, `business`
- Response has `options[]` with `payIn.code`, `payOut.code`, `fee.value`, `fee.valueBeforeDiscount`, `rate.value`, `promotion.isApplied`
- Promo detection: compare `fee.valueBeforeDiscount` vs `fee.value`; check `promotion.isFxDiscountApplied`
- European-focused: ~50 source countries, ~70 destinations, ~150 corridors
- 4 payout types: bank_deposit, cash_pickup, mobile_wallet, airtime

**Step 1: Create the discovery script**

Create `backend/plane-b/src/discovery/providers/transfergo.ts`:

```typescript
/**
 * TransferGo discovery script.
 *
 * API-first approach:
 * - REST: hits my.transfergo.com/api/booking/quotes to discover delivery
 *   options, fees, and promotional pricing per corridor.
 * - Response includes options[] with payIn/payOut codes, fee breakdowns,
 *   and promotion flags.
 * - European-focused provider with ~150 corridors.
 *
 * Entry URL: https://www.transfergo.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// TransferGo source countries (EU/EEA focused)
const SOURCE_COUNTRIES = [
  'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'IE', 'PT',
  'FI', 'SE', 'NO', 'DK', 'PL', 'CZ', 'RO', 'HU', 'BG', 'HR',
  'SK', 'SI', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU', 'GR', 'CH',
]

const COUNTRY_CURRENCY: Record<string, string> = {
  GB: 'GBP', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR',
  CY: 'EUR', MT: 'EUR', SI: 'EUR', SK: 'EUR', EE: 'EUR', LT: 'EUR',
  LV: 'EUR', LU: 'EUR', SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF',
  PL: 'PLN', CZ: 'CZK', RO: 'RON', HU: 'HUF', BG: 'BGN', HR: 'EUR',
  MX: 'MXN', PH: 'PHP', IN: 'INR', NG: 'NGN', PK: 'PKR', BD: 'BDT',
  TR: 'TRY', UA: 'UAH', GH: 'GHS', KE: 'KES', TH: 'THB', VN: 'VND',
  CN: 'CNY', ZA: 'ZAR', BR: 'BRL', GE: 'GEL', MA: 'MAD', NP: 'NPR',
}

// Destinations to probe
const PROBE_DESTINATIONS = [
  'PL', 'TR', 'UA', 'IN', 'PH', 'NG', 'GH', 'KE', 'BD', 'PK',
  'TH', 'VN', 'CN', 'ZA', 'BR', 'GE', 'MA', 'NP', 'MX', 'RO',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

export class TransferGoDiscovery extends ProviderDiscovery {
  constructor() {
    super('transfergo', 'TransferGo')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.transfergo.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('transfergo_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const destinations: string[] = []
    const srcCurrency = COUNTRY_CURRENCY[sourceCountry] ?? 'EUR'

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue

      try {
        const url = new URL('https://my.transfergo.com/api/booking/quotes')
        url.searchParams.set('fromCurrencyCode', srcCurrency)
        url.searchParams.set('toCurrencyCode', destCurrency)
        url.searchParams.set('fromCountryCode', sourceCountry)
        url.searchParams.set('toCountryCode', dest)
        url.searchParams.set('amount', '500')
        url.searchParams.set('calculationBase', 'sendAmount')
        url.searchParams.set('business', '0')

        const resp = await fetch(url.toString(), {
          headers: { 'accept': 'application/json', 'user-agent': UA },
        })

        if (resp.status === 429) {
          this.logger.warn('transfergo_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp.status === 200) {
          const data = await resp.json() as {
            options?: Array<{ availability?: { isAvailable?: boolean } }>
          }
          const available = (data.options ?? []).some(
            (o) => o.availability?.isAvailable !== false,
          )
          if (available) destinations.push(dest)
        }

        await new Promise((r) => setTimeout(r, 500))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('transfergo_dest_countries_discovered', {
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
      const url = new URL('https://my.transfergo.com/api/booking/quotes')
      url.searchParams.set('fromCurrencyCode', srcCurrency)
      url.searchParams.set('toCurrencyCode', destCurrency)
      url.searchParams.set('fromCountryCode', srcCountry)
      url.searchParams.set('toCountryCode', destCountry)
      url.searchParams.set('amount', '500')
      url.searchParams.set('calculationBase', 'sendAmount')
      url.searchParams.set('business', '0')

      const resp = await fetch(url.toString(), {
        headers: { 'accept': 'application/json', 'user-agent': UA },
      })

      if (resp.status !== 200) return methods

      const data = await resp.json() as {
        options?: Array<{
          payIn?: { code?: string }
          payOut?: { code?: string }
          availability?: { isAvailable?: boolean }
          fee?: { value?: number; valueBeforeDiscount?: number }
          promotion?: { isApplied?: boolean; isFxDiscountApplied?: boolean }
        }>
      }

      const seenPairs = new Set<string>()
      for (const opt of data.options ?? []) {
        if (opt.availability?.isAvailable === false) continue
        const payIn = opt.payIn?.code ?? 'BANK'
        const payOut = opt.payOut?.code ?? 'BANK'
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
      this.logger.warn('transfergo_method_discovery_error', {
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
      // Page-based detection
      const content = await browser.content()
      const promoPatterns: Array<{ regex: RegExp; type: DiscoveredPromotionType }> = [
        { regex: /first\s+transfer\s+free/i, type: 'first_transfer' },
        { regex: /(?:no|zero)\s*(?:transfer\s+)?fee/i, type: 'zero_fee' },
        { regex: /fee[\s-]*free/i, type: 'zero_fee' },
        { regex: /(?:reduced?|discount)\s+fee/i, type: 'reduced_fee' },
        { regex: /refer\s+(?:a\s+)?friend/i, type: 'referral' },
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

      // API-based promo detection: check a sample corridor for fee discounts
      try {
        const resp = await fetch(
          'https://my.transfergo.com/api/booking/quotes?fromCurrencyCode=GBP&toCurrencyCode=PLN&fromCountryCode=GB&toCountryCode=PL&amount=500&calculationBase=sendAmount&business=0',
          { headers: { 'accept': 'application/json', 'user-agent': UA } },
        )
        if (resp.status === 200) {
          const data = await resp.json() as {
            options?: Array<{
              fee?: { value?: number; valueBeforeDiscount?: number }
              promotion?: { isApplied?: boolean; isFxDiscountApplied?: boolean }
              payIn?: { code?: string }
            }>
          }
          for (const opt of data.options ?? []) {
            const fee = opt.fee?.value
            const baseFee = opt.fee?.valueBeforeDiscount
            if (baseFee != null && fee != null && baseFee > fee) {
              promos.push({
                type: 'reduced_fee',
                corridorId: 'GB-PL-GBP-PLN',
                rawText: `Fee reduced from ${baseFee} to ${fee} on ${opt.payIn?.code}`,
                strikethroughDetected: false,
                originalValue: String(baseFee),
                promoValue: String(fee),
                expiresAt: null,
                bannerSelector: null,
              })
              break
            }
            if (opt.promotion?.isFxDiscountApplied) {
              promos.push({
                type: 'bonus_rate',
                corridorId: 'GB-PL-GBP-PLN',
                rawText: `FX discount applied on ${opt.payIn?.code}`,
                strikethroughDetected: false,
                originalValue: null,
                promoValue: null,
                expiresAt: null,
                bannerSelector: null,
              })
              break
            }
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('transfergo_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('transfergo_promos_detected', { count: promos.length })
    return promos
  }

  private normalizePayin(code: string): string {
    const map: Record<string, string> = {
      BANK: 'bank_transfer', BANK_TRANSFER: 'bank_transfer',
      DEBIT: 'debit_card', DEBIT_CARD: 'debit_card', CARD: 'debit_card',
      CREDIT: 'credit_card', CREDIT_CARD: 'credit_card',
      OPEN_BANKING: 'bank_transfer',
      APPLE_PAY: 'apple_pay', GOOGLE_PAY: 'google_pay',
    }
    return map[code.toUpperCase()] ?? 'bank_transfer'
  }

  private normalizePayout(code: string): string {
    const map: Record<string, string> = {
      IBAN: 'bank_deposit', BANK: 'bank_deposit', AC: 'bank_deposit',
      CARD: 'bank_deposit', BANK_ACCOUNT: 'bank_deposit',
      CASH: 'cash_pickup', CASH_PICKUP: 'cash_pickup',
      WALLET: 'mobile_wallet', MOBILE: 'mobile_wallet',
      AIRTIME: 'airtime',
    }
    return map[code.toUpperCase()] ?? 'bank_deposit'
  }
}
```

**Step 2: Register in discovery-runner.ts**

Add to `PROVIDER_FACTORIES`:

```typescript
transfergo: async () => {
  const { TransferGoDiscovery } = await import('./providers/transfergo')
  return new TransferGoDiscovery()
},
```

**Step 3: Run validation test**

Test TransferGo API for GB→PL, GB→TR. Verify:
- Multiple delivery options returned (different payIn/payOut combinations)
- Fee data present (value and valueBeforeDiscount)
- Promotion flag detection works

**Step 4: Commit**

```bash
git add backend/plane-b/src/discovery/providers/transfergo.ts backend/plane-b/src/discovery/discovery-runner.ts
git commit -m "feat(plane-b): add TransferGo discovery script with REST API and promo detection"
```

---

### Task 4: Western Union Discovery Script

**Files:**
- Create: `backend/plane-b/src/discovery/providers/westernunion.ts`
- Modify: `backend/plane-b/src/discovery/discovery-runner.ts` (add factory)
- Reference: `backend/plane-b/src/collectors/westernunion/parse.ts`, `backend/plane-b/src/collectors/westernunion/code-map.ts`

**Context:**
- Western Union uses a **REST POST API** at `https://www.westernunion.com/wuconnect/prices/catalog`
- Request structure: `{ header_request, sender: { client: 'WUCOM', channel: 'WWEB', funds_in, curr_iso3, cty_iso2_ext, send_amount }, receiver: { curr_iso3, cty_iso2_ext, cty_iso2 } }`
- Response has `services_groups[]` with `service` (code), `service_name`, `pay_groups[]` with `fund_in`, `fx_rate`, `gross_fee`, `net_fee`, `promotional_fx_rate`
- Service codes: `000` (cash_pickup), `001`/`002` (bank_deposit), `050` (mobile_wallet), `100`/`700` (home_delivery), `115` (UPI)
- Promo detection: `promotional_fx_rate` field, and `net_fee < gross_fee`
- 99k+ corridors but we only probe health corridors + high-traffic destinations
- Most complex provider in this batch

**Step 1: Create the discovery script**

Create `backend/plane-b/src/discovery/providers/westernunion.ts`:

```typescript
/**
 * Western Union discovery script.
 *
 * API-first approach:
 * - REST: hits westernunion.com/wuconnect/prices/catalog to discover
 *   service groups (delivery methods), payment methods, fees, and promos.
 * - Response contains services_groups[] → pay_groups[] with full pricing.
 * - Promo detection: promotional_fx_rate field + net_fee < gross_fee.
 * - Largest corridor space (99k+); we sample high-traffic corridors.
 *
 * Entry URL: https://www.westernunion.com
 */

import { ProviderDiscovery } from '../discovery-base'
import type { DiscoveryBrowser } from '../discovery-browser'
import type {
  DiscoveredDeliveryMethod,
  DiscoveredPromotion,
  DiscoveredPromotionType,
} from '../discovery-types'

// WU source countries (major send markets)
const SOURCE_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE',
  'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'NZ',
  'SG', 'JP', 'AE', 'SA', 'KW', 'QA', 'HK',
]

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', DE: 'EUR', FR: 'EUR',
  IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', CH: 'CHF',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', FI: 'EUR', IE: 'EUR', PT: 'EUR',
  GR: 'EUR', NZ: 'NZD', SG: 'SGD', JP: 'JPY', AE: 'AED', SA: 'SAR',
  KW: 'KWD', QA: 'QAR', HK: 'HKD',
  MX: 'MXN', PH: 'PHP', IN: 'INR', NG: 'NGN', PK: 'PKR',
  BD: 'BDT', GH: 'GHS', KE: 'KES', EG: 'EGP', MA: 'MAD',
  CO: 'COP', GT: 'GTQ', SV: 'USD', HN: 'HNL', DO: 'DOP',
  JM: 'JMD', TH: 'THB', VN: 'VND', CN: 'CNY', UA: 'UAH',
}

const PROBE_DESTINATIONS = [
  'MX', 'PH', 'IN', 'NG', 'PK', 'BD', 'GH', 'KE', 'EG', 'MA',
  'CO', 'GT', 'SV', 'HN', 'DO', 'JM', 'TH', 'VN', 'CN', 'UA',
]

const UA = 'Remit-Scout-Research/1.0 (+https://remit-scout.com/research; support@remit-scout.com)'

// WU service code → canonical delivery method
const SERVICE_CODE_MAP: Record<string, string> = {
  '000': 'cash_pickup',
  '001': 'bank_deposit', '002': 'bank_deposit',
  '500': 'bank_deposit', '501': 'bank_deposit',
  '050': 'mobile_wallet', '801': 'mobile_wallet',
  '100': 'home_delivery', '700': 'home_delivery',
  '115': 'bank_deposit', // UPI → treat as bank deposit
  '080': 'debit_card', // Prepaid card
}

// WU fund_in code → canonical payin method
const FUND_IN_MAP: Record<string, string> = {
  BA: 'bank_transfer', AC: 'bank_transfer',
  CC: 'credit_card', DC: 'debit_card',
  CA: 'cash', AP: 'apple_pay', GP: 'google_pay',
}

export class WesternUnionDiscovery extends ProviderDiscovery {
  constructor() {
    super('westernunion', 'Western Union')
  }

  protected get entryUrl(): string {
    return super.entryUrl || 'https://www.westernunion.com'
  }

  protected async discoverSourceCountries(
    _browser: DiscoveryBrowser,
  ): Promise<string[]> {
    this.logger.info('wu_source_countries_discovered', {
      count: SOURCE_COUNTRIES.length,
    })
    return [...SOURCE_COUNTRIES]
  }

  protected async discoverDestinationCountries(
    _browser: DiscoveryBrowser,
    sourceCountry: string,
  ): Promise<string[]> {
    const destinations: string[] = []
    const srcCurrency = COUNTRY_CURRENCY[sourceCountry] ?? 'USD'

    for (const dest of PROBE_DESTINATIONS) {
      if (dest === sourceCountry) continue
      const destCurrency = COUNTRY_CURRENCY[dest]
      if (!destCurrency) continue

      try {
        const resp = await this.callWuCatalog(
          sourceCountry, srcCurrency, dest, destCurrency, 500,
        )

        if (resp === 'rate_limited') {
          this.logger.warn('wu_rate_limited', { sourceCountry, dest })
          break
        }

        if (resp && (resp.services_groups ?? []).length > 0) {
          destinations.push(dest)
        }

        await new Promise((r) => setTimeout(r, 800))
      } catch {
        // Skip on error
      }
    }

    this.logger.info('wu_dest_countries_discovered', {
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
      const data = await this.callWuCatalog(
        srcCountry, srcCurrency, destCountry, destCurrency, 500,
      )
      if (!data || data === 'rate_limited') return methods

      const seenPairs = new Set<string>()
      for (const sg of data.services_groups ?? []) {
        const serviceCode = sg.service ?? '000'
        const normalizedPayout = SERVICE_CODE_MAP[serviceCode] ?? 'cash_pickup'

        for (const pg of sg.pay_groups ?? []) {
          const fundIn = pg.fund_in ?? 'BA'
          const normalizedPayin = FUND_IN_MAP[fundIn] ?? 'bank_transfer'
          const key = `${normalizedPayin}→${normalizedPayout}`
          if (seenPairs.has(key)) continue
          seenPairs.add(key)

          methods.push({
            corridorId,
            rawPayinLabel: fundIn,
            normalizedPayin,
            rawPayoutLabel: `${serviceCode}:${sg.service_name ?? ''}`,
            normalizedPayout,
            unmapped: false,
          })
        }
      }
    } catch (err) {
      this.logger.warn('wu_method_discovery_error', {
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
      // Page-based detection
      const content = await browser.content()
      const promoPatterns: Array<{ regex: RegExp; type: DiscoveredPromotionType }> = [
        { regex: /first\s+transfer\s+free/i, type: 'first_transfer' },
        { regex: /(?:no|zero)\s*(?:transfer\s+)?fee/i, type: 'zero_fee' },
        { regex: /fee[\s-]*free/i, type: 'zero_fee' },
        { regex: /(?:reduced?|discount)\s+fee/i, type: 'reduced_fee' },
        { regex: /better\s+(?:exchange\s+)?rate/i, type: 'bonus_rate' },
        { regex: /refer\s+(?:a\s+)?friend/i, type: 'referral' },
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

      // API-based promo detection on sample corridor
      try {
        const data = await this.callWuCatalog('US', 'USD', 'MX', 'MXN', 500)
        if (data && data !== 'rate_limited') {
          for (const sg of data.services_groups ?? []) {
            for (const pg of sg.pay_groups ?? []) {
              // Check for promotional FX rate
              const promoRate = pg.promotional_fx_rate ?? pg.promo_fx_rate
              if (promoRate && pg.fx_rate && promoRate !== pg.fx_rate) {
                promos.push({
                  type: 'bonus_rate',
                  corridorId: 'US-MX-USD-MXN',
                  rawText: `Promo rate ${promoRate} vs base ${pg.fx_rate} on ${sg.service_name}`,
                  strikethroughDetected: false,
                  originalValue: String(pg.fx_rate),
                  promoValue: String(promoRate),
                  expiresAt: null,
                  bannerSelector: null,
                })
                break
              }
              // Check for fee discount (net_fee < gross_fee)
              if (pg.net_fee != null && pg.gross_fee != null && pg.net_fee < pg.gross_fee) {
                promos.push({
                  type: 'reduced_fee',
                  corridorId: 'US-MX-USD-MXN',
                  rawText: `Fee reduced from ${pg.gross_fee} to ${pg.net_fee} on ${sg.service_name}`,
                  strikethroughDetected: false,
                  originalValue: String(pg.gross_fee),
                  promoValue: String(pg.net_fee),
                  expiresAt: null,
                  bannerSelector: null,
                })
                break
              }
            }
            if (promos.length > 0) break
          }
        }
      } catch {
        // API promo check is best-effort
      }
    } catch (err) {
      this.logger.warn('wu_promo_detection_error', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    this.logger.info('wu_promos_detected', { count: promos.length })
    return promos
  }

  private async callWuCatalog(
    srcCountry: string,
    srcCurrency: string,
    destCountry: string,
    destCurrency: string,
    amount: number,
  ): Promise<WuCatalogResponse | 'rate_limited' | null> {
    const resp = await fetch(
      'https://www.westernunion.com/wuconnect/prices/catalog',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': UA,
        },
        body: JSON.stringify({
          header_request: { version: '0.5', request_type: 'PRICECATALOG' },
          sender: {
            client: 'WUCOM',
            channel: 'WWEB',
            funds_in: '*',
            curr_iso3: srcCurrency,
            cty_iso2_ext: srcCountry,
            send_amount: String(amount),
          },
          receiver: {
            curr_iso3: destCurrency,
            cty_iso2_ext: destCountry,
            cty_iso2: destCountry,
          },
        }),
      },
    )

    if (resp.status === 429) return 'rate_limited'
    if (resp.status !== 200) return null

    return resp.json() as Promise<WuCatalogResponse>
  }
}

type WuCatalogResponse = {
  services_groups?: Array<{
    service?: string
    service_name?: string
    pay_groups?: Array<{
      fund_in?: string
      fx_rate?: number
      promotional_fx_rate?: number
      promo_fx_rate?: number
      gross_fee?: number
      net_fee?: number
    }>
  }>
}
```

**Step 2: Register in discovery-runner.ts**

Add to `PROVIDER_FACTORIES`:

```typescript
westernunion: async () => {
  const { WesternUnionDiscovery } = await import('./providers/westernunion')
  return new WesternUnionDiscovery()
},
```

**Step 3: Run validation test**

Test WU catalog API for US→MX, US→PH. Verify:
- Multiple service groups returned (000=cash, 001=bank, 050=mobile)
- Each service has pay_groups with different fund_in codes (BA, CC, DC)
- `promotional_fx_rate` and `net_fee` fields present when promos exist

**Step 4: Commit**

```bash
git add backend/plane-b/src/discovery/providers/westernunion.ts backend/plane-b/src/discovery/discovery-runner.ts
git commit -m "feat(plane-b): add Western Union discovery script with catalog API and promo detection"
```

---

### Task 5: Validate all 4 providers end-to-end

**Files:**
- Create: `backend/scripts/validate-phase3-discovery.ts` (temporary test script)

**Step 1: Write validation script**

Similar to Phase 2 validation — create a script that tests all 4 providers against their real APIs:
- WorldRemit: GraphQL PayoutMethods for US→NG
- XE: POST quotes for US→MX
- TransferGo: GET quotes for GB→PL
- Western Union: POST catalog for US→MX

Each test checks:
- API returns data (non-empty response)
- Delivery methods extracted correctly
- Country codes parsed
- No 403/429 errors with Remit-Scout UA

**Step 2: Run validation and fix any issues**

Run: `cd backend && npx tsx scripts/validate-phase3-discovery.ts`

Iterate on any failures (wrong API URL, missing field paths, rate limiting).

**Step 3: Clean up**

Delete `backend/scripts/validate-phase3-discovery.ts` after all 4 pass.

**Step 4: Final commit**

```bash
git add -u
git commit -m "feat(plane-b): Phase 3 batch 1 complete — 4 new discovery scripts validated"
```

---

### Task 6: Type check and lint

**Step 1: TypeScript compilation**

Run: `cd backend && npx tsc --noEmit`

Fix any type errors in the 4 new discovery scripts.

**Step 2: Lint check**

Run: `cd .. && pnpm lint`

Fix any lint warnings.

**Step 3: Commit fixes if any**

```bash
git add -u
git commit -m "fix(plane-b): resolve type/lint issues in Phase 3 discovery scripts"
```

---

## Phase 4 Requirement: Rights Matrix Sync After Discovery Changes

> **Critical:** Every time discovery scripts reveal new corridors or delivery methods, the rights matrix DB must be synced. This is NOT optional — without it, new corridors won't appear in B2C results.

### Sync Procedure

After any batch of discovery scripts is validated:

```bash
cd backend && pnpm db:migrate                                    # Ensure schema is up to date
cd backend && npx tsx scripts/rights-matrix-sync-countries.ts    # Sync corridors to DB
```

### What the sync does

1. Reads `supported-corridors.ts` for all 24 providers
2. Extracts unique source/destination country arrays per provider
3. Upserts into `silver.rights_matrix.source_countries[]` and `silver.rights_matrix.destination_countries[]`
4. Warns if any active B2C provider has empty country sets

### When to run

- After adding new providers to `supported-corridors.ts`
- After discovery scripts identify new corridors (update `supported-corridors.ts` first, then sync)
- As part of every deployment pipeline (CI should run this post-migration)
- After any Phase 3/4/5 batch completes

### Phase 4 action items

- Add `rights-matrix-sync-countries.ts` to the CI deploy pipeline so it runs automatically after `db:migrate`
- Add a post-discovery hook in `discovery-runner.ts` that flags when discovered corridors don't match the rights matrix (the diff reporter already does this — wire it to an alert)
- Document the sync procedure in `docs/runbooks/rights-matrix-sync.md`
