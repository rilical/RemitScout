import type { CorridorOption } from '~/types/pulse'
import { COUNTRIES } from '~/utils/countries-currencies'

const DAY_MS = 24 * 60 * 60 * 1000

const countryNameByCode = new Map(
  COUNTRIES.map(country => [country.code.trim().toUpperCase(), country.name.trim()]),
)

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

const getCountryName = (code?: string | null) => {
  if (!code) return ''
  return countryNameByCode.get(code.trim().toUpperCase()) || code.trim().toUpperCase()
}

export const computeCorridorDaysAvailable = (corridor: CorridorOption | null | undefined) => {
  if (!corridor) return 0
  if (typeof corridor.daysAvailable === 'number' && corridor.daysAvailable > 0) {
    return Math.round(corridor.daysAvailable)
  }
  if (!corridor.minDate || !corridor.maxDate) return 0

  const min = new Date(`${corridor.minDate}T00:00:00.000Z`).getTime()
  const max = new Date(`${corridor.maxDate}T00:00:00.000Z`).getTime()
  if (Number.isNaN(min) || Number.isNaN(max) || max < min) return 0

  return Math.floor((max - min) / DAY_MS) + 1
}

export const buildCorridorSearchText = (corridor: CorridorOption) => {
  const sourceCountry = getCountryName(corridor.sourceCountry)
  const destCountry = getCountryName(corridor.destCountry)

  return normalizeToken(
    [
      corridor.label,
      corridor.slug,
      corridor.value,
      corridor.corridorId,
      corridor.fromCode,
      corridor.toCode,
      corridor.sourceCurrency,
      corridor.destCurrency,
      corridor.sourceCountry,
      corridor.destCountry,
      sourceCountry,
      destCountry,
    ]
      .filter(Boolean)
      .join(' '),
  )
}

export const matchesCorridorSearch = (corridor: CorridorOption, query: string) => {
  const normalizedQuery = normalizeToken(query)
  if (!normalizedQuery) return true

  const haystack = buildCorridorSearchText(corridor)
  return normalizedQuery.split(' ').every(token => haystack.includes(token))
}

export const sortCorridorsByCoverage = (corridors: CorridorOption[]) => {
  return [...corridors].sort((a, b) => {
    const usdBias = (b.isUsdOrigin ? 1 : 0) - (a.isUsdOrigin ? 1 : 0)
    if (usdBias !== 0) return usdBias

    const points = (b.dataPoints ?? 0) - (a.dataPoints ?? 0)
    if (points !== 0) return points

    const days = computeCorridorDaysAvailable(b) - computeCorridorDaysAvailable(a)
    if (days !== 0) return days

    const updatedA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0
    const updatedB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0
    if (updatedA !== updatedB) return updatedB - updatedA

    return a.label.localeCompare(b.label)
  })
}
