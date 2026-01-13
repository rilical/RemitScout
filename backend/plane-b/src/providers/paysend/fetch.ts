import { randomUUID } from 'node:crypto'

import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'

const PAYSEND_BASE_URL = 'https://paysend.com/api'

const BOOTSTRAP_CORRIDOR_ID = 'US-MX-USD-MXN'
const BOOTSTRAP_FROM_COUNTRY = 'US'
const BOOTSTRAP_TO_COUNTRY = 'MX'
const BOOTSTRAP_FROM_CURRENCY_ID = '840'
const BOOTSTRAP_TO_CURRENCY_ID = '484'
const BOOTSTRAP_FROM_SLUG = 'the-united-states-of-america'
const BOOTSTRAP_TO_SLUG = 'mexico'

const COUNTRY_SLUGS: Record<string, string> = {
  US: 'the-united-states-of-america',
  MX: 'mexico',
  GB: 'united-kingdom',
  UK: 'united-kingdom',
  CA: 'canada',
  DE: 'germany',
  FR: 'france',
  ES: 'spain',
  IT: 'italy',
  AD: 'andorra',
  JM: 'jamaica',
  AU: 'australia',
  AT: 'austria',
  BE: 'belgium',
  BR: 'brazil',
  BG: 'bulgaria',
  CL: 'chile',
  CO: 'colombia',
  HR: 'croatia',
  CY: 'cyprus',
  CZ: 'czech-republic',
  DK: 'denmark',
  EE: 'estonia',
  FI: 'finland',
  GR: 'greece',
  HU: 'hungary',
  IS: 'iceland',
  IE: 'ireland',
  IL: 'israel',
  KZ: 'kazakhstan',
  KW: 'kuwait',
  LV: 'latvia',
  LI: 'liechtenstein',
  LT: 'lithuania',
  LU: 'luxembourg',
  MT: 'malta',
  MD: 'moldova',
  ME: 'montenegro',
  NL: 'netherlands',
  MK: 'north-macedonia',
  NO: 'norway',
  PE: 'peru',
  PL: 'poland',
  PT: 'portugal',
  RO: 'romania',
  SM: 'san-marino',
  RS: 'serbia',
  SK: 'slovakia',
  SI: 'slovenia',
  SE: 'sweden',
  CH: 'switzerland',
  UZ: 'uzbekistan',
  DZ: 'algeria',
  AR: 'argentina',
  AM: 'armenia',
  AZ: 'azerbaijan',
  BD: 'bangladesh',
  BZ: 'belize',
  BJ: 'benin',
  BT: 'bhutan',
  BO: 'bolivia',
  BW: 'botswana',
  BI: 'burundi',
  CM: 'cameroon',
  CV: 'cape-verde',
  CN: 'china',
  CR: 'costa-rica',
  DJ: 'djibouti',
  DM: 'dominica',
  DO: 'dominican-republic',
  EC: 'ecuador',
  EG: 'egypt',
  SV: 'el-salvador',
  FJ: 'fiji',
  GM: 'gambia',
  GE: 'georgia',
  GH: 'ghana',
  GT: 'guatemala',
  GN: 'guinea',
  GY: 'guyana',
  HN: 'honduras',
  HK: 'hong-kong',
  IN: 'india',
  ID: 'indonesia',
  JP: 'japan',
  JO: 'jordan',
  KE: 'kenya',
  KG: 'kyrgyzstan',
  MG: 'madagascar',
  MY: 'malaysia',
  MR: 'mauritania',
  MU: 'mauritius',
  MN: 'mongolia',
  MA: 'morocco',
  MZ: 'mozambique',
  NA: 'namibia',
  NP: 'nepal',
  NZ: 'new-zealand',
  NG: 'nigeria',
  PK: 'pakistan',
  PY: 'paraguay',
  PH: 'philippines',
  QA: 'qatar',
  RW: 'rwanda',
  SA: 'saudi-arabia',
  SN: 'senegal',
  SL: 'sierra-leone',
  SG: 'singapore',
  ZA: 'south-africa',
  KR: 'south-korea',
  LK: 'sri-lanka',
  TJ: 'tajikistan',
  TZ: 'tanzania',
  TH: 'thailand',
  TG: 'togo',
  TR: 'turkey',
  AE: 'united-arab-emirates',
  UG: 'uganda',
  UA: 'ukraine',
  UY: 'uruguay',
  VN: 'vietnam',
  ZM: 'zambia',
}

const CURRENCY_ID_MAP: Record<string, string> = {
  USD: BOOTSTRAP_FROM_CURRENCY_ID,
  MXN: BOOTSTRAP_TO_CURRENCY_ID,
}

let currencyMapPromise: Promise<void> | null = null

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

const resolveCountrySlug = (code: string) => {
  const normalized = code.trim().toUpperCase()
  return COUNTRY_SLUGS[normalized] ?? normalized.toLowerCase()
}

const updateMapsFromPayload = (payload: unknown) => {
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const entry of value) {
        visit(entry)
      }
      return
    }

    if (!value || typeof value !== 'object') return
    const obj = value as Record<string, unknown>

    const codeValue = typeof obj.code === 'string' ? obj.code : null
    const seoNameFrom = typeof obj.seoNameFrom === 'string' ? obj.seoNameFrom : null
    const seoNameTo = typeof obj.seoNameTo === 'string' ? obj.seoNameTo : null

    if (codeValue) {
      const normalized = codeValue.trim().toUpperCase()
      if (seoNameFrom && !COUNTRY_SLUGS[normalized]) {
        COUNTRY_SLUGS[normalized] = seoNameFrom
      }
      if (seoNameTo && !COUNTRY_SLUGS[normalized]) {
        COUNTRY_SLUGS[normalized] = seoNameTo
      }
    }

    if (Array.isArray(obj.currencies)) {
      for (const currency of obj.currencies) {
        if (!currency || typeof currency !== 'object') continue
        const currencyObj = currency as Record<string, unknown>
        const code = typeof currencyObj.code === 'string' ? currencyObj.code : null
        const id = currencyObj.id
        if (code && (typeof id === 'number' || typeof id === 'string')) {
          CURRENCY_ID_MAP[code.trim().toUpperCase()] = String(id)
        }
      }
    }

    for (const entry of Object.values(obj)) {
      visit(entry)
    }
  }

  visit(payload)
}

const loadCurrencyMap = async () => {
  if (currencyMapPromise) return currencyMapPromise

  currencyMapPromise = (async () => {
    const params = new URLSearchParams({
      fromCurrId: BOOTSTRAP_FROM_CURRENCY_ID,
      toCurrId: BOOTSTRAP_TO_CURRENCY_ID,
      isFrom: 'true',
    })
    const url = `${PAYSEND_BASE_URL}/en-us/send-money/from-${BOOTSTRAP_FROM_SLUG}-to-${BOOTSTRAP_TO_SLUG}?${params.toString()}`

    const response = await httpRequest({
      url,
      method: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        origin: 'https://paysend.com',
        referer: 'https://paysend.com/en-us/send-money/',
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'user-agent': getUserAgentForCorridor(BOOTSTRAP_CORRIDOR_ID),
        'x-session-token': `ps_session_${randomUUID()}`,
      },
      body: '',
      corridorId: BOOTSTRAP_CORRIDOR_ID,
    })

    if (!response.json || typeof response.json !== 'object') {
      throw new Error('paysend_bootstrap_invalid_payload')
    }

    updateMapsFromPayload(response.json)
  })().catch((error) => {
    currencyMapPromise = null
    throw error
  })

  return currencyMapPromise
}

const resolveCurrencyId = async (code: string) => {
  const normalized = code.trim().toUpperCase()
  if (CURRENCY_ID_MAP[normalized]) return CURRENCY_ID_MAP[normalized]

  try {
    await loadCurrencyMap()
  } catch {
    // Ignore bootstrap failures and fall back to the raw code.
  }

  return CURRENCY_ID_MAP[normalized] ?? normalized
}

export const fetchPaysendQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const fromCountryCode = sourceCountry.toLowerCase()
  const fromSlug = resolveCountrySlug(sourceCountry)
  const toSlug = resolveCountrySlug(destCountry)
  const [fromCurrencyId, toCurrencyId] = await Promise.all([
    resolveCurrencyId(sourceCurrency),
    resolveCurrencyId(destCurrency),
  ])

  const params = new URLSearchParams({
    fromCurrId: fromCurrencyId,
    toCurrId: toCurrencyId,
    isFrom: 'true',
  })

  const url = `${PAYSEND_BASE_URL}/en-${fromCountryCode}/send-money/from-${fromSlug}-to-${toSlug}?${params.toString()}`

  const response = await httpRequest({
    url,
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      origin: 'https://paysend.com',
      referer: `https://paysend.com/en-${fromCountryCode}/send-money/`,
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
      'x-session-token': `ps_session_${randomUUID()}`,
    },
    body: '',
    jitterMs: options.jitterMs,
    proxyTier: options.proxyTier,
    corridorId: request.corridor_id,
  })

  return {
    status: response.status,
    bodyText: response.bodyText,
    payload: response.json ?? response.bodyText,
  }
}
