import { parseCorridorId } from './corridor'

export type RightsMatrixCountrySets = {
  sourceCountries?: string[] | null
  destinationCountries?: string[] | null
}

const normalizeCountryList = (countries?: string[] | null): string[] => {
  if (!Array.isArray(countries)) return []
  return countries
    .map(country => country?.trim().toUpperCase())
    .filter((country): country is string => Boolean(country))
}

/**
 * Rights matrix country sets are authoritative. Null/empty sets must never
 * match all corridors.
 */
export const isRightsMatrixCorridorEligible = (
  corridorId: string,
  rights: RightsMatrixCountrySets | undefined,
): boolean => {
  const parsed = parseCorridorId(corridorId)
  if (!parsed || !rights) return false

  const sourceCountries = normalizeCountryList(rights.sourceCountries)
  const destinationCountries = normalizeCountryList(rights.destinationCountries)
  if (sourceCountries.length === 0 || destinationCountries.length === 0) {
    return false
  }

  return sourceCountries.includes(parsed.sourceCountry.toUpperCase())
    && destinationCountries.includes(parsed.destCountry.toUpperCase())
}

/**
 * SQL predicate that enforces rights-matrix country support against a corridor
 * ID column/expression. Callers must pass internal alias names only.
 */
export const buildRightsMatrixCorridorEligibilitySql = (options: {
  rightsAlias: string
  corridorIdSql: string
}): string => {
  const { rightsAlias, corridorIdSql } = options
  return `(
    EXISTS (
      SELECT 1
      FROM unnest(COALESCE(${rightsAlias}.source_countries, ARRAY[]::text[])) AS src(country)
      WHERE upper(src.country) = upper(split_part(${corridorIdSql}, '-', 1))
    )
    AND EXISTS (
      SELECT 1
      FROM unnest(COALESCE(${rightsAlias}.destination_countries, ARRAY[]::text[])) AS dest(country)
      WHERE upper(dest.country) = upper(split_part(${corridorIdSql}, '-', 2))
    )
  )`
}
