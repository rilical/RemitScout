export type ParsedCorridorId = {
  sourceCountry: string
  destCountry: string
  sourceCurrency: string
  destCurrency: string
}

export const parseCorridorId = (corridorId: string): ParsedCorridorId | null => {
  if (!corridorId) return null
  const parts = corridorId.split('-')
  if (parts.length !== 4) return null
  const [sourceCountry, destCountry, sourceCurrency, destCurrency] = parts
  if (!sourceCountry || !destCountry || !sourceCurrency || !destCurrency) {
    return null
  }
  return { sourceCountry, destCountry, sourceCurrency, destCurrency }
}

export const requireCorridorId = (corridorId: string): ParsedCorridorId => {
  const parsed = parseCorridorId(corridorId)
  if (!parsed) {
    throw new Error(`invalid corridor_id: ${corridorId}`)
  }
  return parsed
}

export const formatCorridorId = (input: ParsedCorridorId): string => {
  return `${input.sourceCountry}-${input.destCountry}-${input.sourceCurrency}-${input.destCurrency}`
}
