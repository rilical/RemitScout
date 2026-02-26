import { COUNTRIES, type Country } from './countries-currencies'
import { getCorridorTier, type CorridorTier } from './corridor-tiers'

export const MAJOR_SEND_CURRENCIES = ['USD', 'EUR', 'CAD', 'AED', 'JPY', 'GBP'] as const
export type MajorSendCurrency = (typeof MAJOR_SEND_CURRENCIES)[number]

export const PAYOUT_METHODS = ['bank_deposit', 'cash_pickup', 'mobile_wallet', 'airtime'] as const
export type PayoutMethod = (typeof PAYOUT_METHODS)[number]

export const B2B_FIXED_AMOUNT_USD = 500

export const HARD_CURRENCY_DESTINATIONS = [
  'PH', 'NG', 'KE', 'GH', 'EG', 'PK', 'BD', 'LK', 'NP',
  'VN', 'ID', 'TH', 'CO', 'PE', 'DO', 'GT', 'HN', 'SV',
  'MX', 'IN', 'ET', 'UG', 'TZ', 'ZA', 'MA', 'TN', 'JO',
  'LB', 'CD', 'CM', 'SN', 'CI', 'ML', 'BF', 'NE', 'TG',
  'BJ', 'GN', 'SO', 'SD', 'YE', 'MM', 'KH', 'LA',
] as const
export type HardCurrencyDestination = (typeof HARD_CURRENCY_DESTINATIONS)[number]

export type MacroCorridor = {
  corridorId: string
  sourceCountry: string
  destCountry: string
  sourceCurrency: string
  destCurrency: string
  isHardCurrencyLane: boolean
  tier: CorridorTier
}

export type MacroLane = {
  laneId: string
  corridorId: string
  payoutMethod: PayoutMethod
  sourceCountry: string
  destCountry: string
  sourceCurrency: string
  destCurrency: string
  isHardCurrencyLane: boolean
  tier: CorridorTier
}

const majorSendCurrencySet = new Set<string>(MAJOR_SEND_CURRENCIES)
const hardCurrencyDestSet = new Set<string>(HARD_CURRENCY_DESTINATIONS)

const countryByCurrency = new Map<string, Country[]>()
const countryByCode = new Map<string, Country>()

for (const country of COUNTRIES) {
  countryByCode.set(country.code, country)
  const list = countryByCurrency.get(country.currency) ?? []
  list.push(country)
  countryByCurrency.set(country.currency, list)
}

export function getSendCountries(): string[] {
  const result: string[] = []
  for (const currency of MAJOR_SEND_CURRENCIES) {
    for (const country of countryByCurrency.get(currency) ?? []) {
      if (country.code !== 'EU') {
        result.push(country.code)
      }
    }
  }
  return result
}

export function getDestinationCountries(): string[] {
  return COUNTRIES.filter(c => c.code !== 'EU').map(c => c.code)
}

function buildCorridorId(src: string, dest: string, srcCcy: string, destCcy: string): string {
  return `${src}-${dest}-${srcCcy}-${destCcy}`
}

function buildLaneId(corridorId: string, payoutMethod: PayoutMethod): string {
  return `${corridorId}:${payoutMethod}`
}

export function generateMacroCorridors(): MacroCorridor[] {
  const corridors: MacroCorridor[] = []
  const seen = new Set<string>()

  const sendCountries = getSendCountries()
  const destCountries = getDestinationCountries()

  for (const srcCountry of sendCountries) {
    const srcData = countryByCode.get(srcCountry)
    if (!srcData || !majorSendCurrencySet.has(srcData.currency)) continue

    const srcCcy = srcData.currency

    for (const destCountry of destCountries) {
      if (srcCountry === destCountry) continue

      const destData = countryByCode.get(destCountry)
      if (!destData) continue

      const destCcy = destData.currency
      const primaryId = buildCorridorId(srcCountry, destCountry, srcCcy, destCcy)

      if (!seen.has(primaryId)) {
        seen.add(primaryId)
        corridors.push({
          corridorId: primaryId,
          sourceCountry: srcCountry,
          destCountry,
          sourceCurrency: srcCcy,
          destCurrency: destCcy,
          isHardCurrencyLane: false,
          tier: getCorridorTier(primaryId),
        })
      }

      if (hardCurrencyDestSet.has(destCountry)) {
        if (srcCcy === 'USD' && destCcy !== 'USD') {
          const usdId = buildCorridorId(srcCountry, destCountry, srcCcy, 'USD')
          if (!seen.has(usdId)) {
            seen.add(usdId)
            corridors.push({
              corridorId: usdId,
              sourceCountry: srcCountry,
              destCountry,
              sourceCurrency: srcCcy,
              destCurrency: 'USD',
              isHardCurrencyLane: true,
              tier: getCorridorTier(usdId),
            })
          }
        }
        if (srcCcy === 'EUR' && destCcy !== 'EUR') {
          const eurId = buildCorridorId(srcCountry, destCountry, srcCcy, 'EUR')
          if (!seen.has(eurId)) {
            seen.add(eurId)
            corridors.push({
              corridorId: eurId,
              sourceCountry: srcCountry,
              destCountry,
              sourceCurrency: srcCcy,
              destCurrency: 'EUR',
              isHardCurrencyLane: true,
              tier: getCorridorTier(eurId),
            })
          }
        }
      }
    }
  }

  return corridors
}

export function generateMacroLanes(): MacroLane[] {
  const corridors = getMacroCorridors()
  const lanes: MacroLane[] = []

  for (const corridor of corridors) {
    for (const method of PAYOUT_METHODS) {
      lanes.push({
        laneId: buildLaneId(corridor.corridorId, method),
        corridorId: corridor.corridorId,
        payoutMethod: method,
        sourceCountry: corridor.sourceCountry,
        destCountry: corridor.destCountry,
        sourceCurrency: corridor.sourceCurrency,
        destCurrency: corridor.destCurrency,
        isHardCurrencyLane: corridor.isHardCurrencyLane,
        tier: corridor.tier,
      })
    }
  }

  return lanes
}

let cachedCorridors: MacroCorridor[] | null = null
let cachedCorridorSet: Set<string> | null = null
let cachedLanes: MacroLane[] | null = null

export function getMacroCorridors(): MacroCorridor[] {
  if (!cachedCorridors) {
    cachedCorridors = generateMacroCorridors()
  }
  return cachedCorridors
}

export function getMacroCorridorSet(): Set<string> {
  if (!cachedCorridorSet) {
    cachedCorridorSet = new Set(getMacroCorridors().map(c => c.corridorId))
  }
  return cachedCorridorSet
}

export function getMacroLanes(): MacroLane[] {
  if (!cachedLanes) {
    cachedLanes = generateMacroLanes()
  }
  return cachedLanes
}

export function isMacroCorridor(corridorId: string): boolean {
  return getMacroCorridorSet().has(corridorId)
}

export function getCorridorStats(): {
  totalCorridors: number
  primaryCorridors: number
  hardCurrencyCorridors: number
  totalLanes: number
  sendCountryCount: number
  destCountryCount: number
  bySendCurrency: Record<string, number>
} {
  const corridors = getMacroCorridors()
  const bySendCurrency: Record<string, number> = {}
  let primary = 0
  let hardCurrency = 0

  for (const c of corridors) {
    c.isHardCurrencyLane ? hardCurrency++ : primary++
    bySendCurrency[c.sourceCurrency] = (bySendCurrency[c.sourceCurrency] ?? 0) + 1
  }

  return {
    totalCorridors: corridors.length,
    primaryCorridors: primary,
    hardCurrencyCorridors: hardCurrency,
    totalLanes: corridors.length * PAYOUT_METHODS.length,
    sendCountryCount: getSendCountries().length,
    destCountryCount: getDestinationCountries().length,
    bySendCurrency,
  }
}
