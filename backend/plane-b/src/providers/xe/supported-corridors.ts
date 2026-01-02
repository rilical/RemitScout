import { COUNTRIES } from '../../../../shared/countries-currencies'
import { getXeCurrencyForCountry } from './code-map'

const ALL_COUNTRIES = COUNTRIES.map((country) => country.code)

const BASE_SEND_CURRENCIES = ['USD', 'EUR', 'GBP'] as const
const BASE_RECEIVE_CURRENCIES = ['USD', 'EUR', 'GBP'] as const

const buildCorridorIds = (source: string, destination: string) => {
  if (source === destination) return []
  const sourceCurrency = getXeCurrencyForCountry(source)
  const destinationCurrency = getXeCurrencyForCountry(destination)
  if (!sourceCurrency || !destinationCurrency) return []

  const sendCurrencies = new Set([sourceCurrency, ...BASE_SEND_CURRENCIES])
  const receiveCurrencies = new Set([destinationCurrency, ...BASE_RECEIVE_CURRENCIES])
  const corridorIds: string[] = []

  for (const sendCurrency of sendCurrencies) {
    for (const receiveCurrency of receiveCurrencies) {
      corridorIds.push(`${source}-${destination}-${sendCurrency}-${receiveCurrency}`)
    }
  }

  return corridorIds
}

const buildLocalCurrencyCorridorId = (source: string, destination: string) => {
  if (source === destination) return null
  const sourceCurrency = getXeCurrencyForCountry(source)
  const destinationCurrency = getXeCurrencyForCountry(destination)
  if (!sourceCurrency || !destinationCurrency) return null
  return `${source}-${destination}-${sourceCurrency}-${destinationCurrency}`
}

const buildSupportedCorridors = () => {
  const corridorSet = new Set<string>()
  for (const source of ALL_COUNTRIES) {
    for (const destination of ALL_COUNTRIES) {
      const corridorIds = buildCorridorIds(source, destination)
      for (const corridorId of corridorIds) {
        corridorSet.add(corridorId)
      }
    }
  }
  return Array.from(corridorSet)
}

const buildB2bCorridors = () => {
  const corridorSet = new Set<string>()
  for (const source of ALL_COUNTRIES) {
    for (const destination of ALL_COUNTRIES) {
      const corridorId = buildLocalCurrencyCorridorId(source, destination)
      if (corridorId) {
        corridorSet.add(corridorId)
      }
    }
  }
  return Array.from(corridorSet)
}

export const XE_SUPPORTED_CORRIDORS = buildSupportedCorridors()
export const XE_B2B_CORRIDORS = buildB2bCorridors()
