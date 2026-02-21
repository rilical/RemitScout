import type { Pool } from 'pg'

import { query } from './db'
import { parseCorridorId } from './corridor'
import { getMacroCorridors } from './macro-corridors'
import { providerRegistry } from '../plane-b/src/providers'

export type RightsScopeMode = 'all' | 'macro' | 'ids'

export type ResolveCorridorScopeOptions = {
  scopeEnv?: string | null
  corridorIdsEnv?: string | null
  sendCurrenciesEnv?: string | null
  defaultSendCurrencies?: string[]
  includeCapabilityTableCorridors?: boolean
}

export type ResolvedCorridorScope = {
  scope: RightsScopeMode
  corridorIds: string[]
  corridorCount: number
  sendCurrencies: string[] | null
  corridorIdsFilter: string[] | null
  providerCatalogCorridorCount: number
  capabilityCorridorCount: number
}

const splitCsv = (value: string | undefined | null): string[] =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

const normalizeUpper = (value: string): string => value.trim().toUpperCase()

const sortedUnique = (values: Iterable<string>): string[] =>
  Array.from(new Set(Array.from(values).map(normalizeUpper).filter(Boolean))).sort()

const parseScope = (raw: string | undefined | null): RightsScopeMode => {
  const normalized = (raw || '').trim().toLowerCase()
  if (!normalized || normalized === 'all') return 'all'
  if (normalized === 'macro') return 'macro'
  if (normalized === 'ids') return 'ids'
  throw new Error(`Invalid scope: ${raw}`)
}

const validateCorridorId = (corridorId: string): string => {
  const normalized = normalizeUpper(corridorId)
  if (!parseCorridorId(normalized)) {
    throw new Error(`Invalid corridor id: ${corridorId}`)
  }
  return normalized
}

const loadCapabilityCorridorIds = async (pool: Pool): Promise<string[]> => {
  const result = await query<{ corridor_id: string }>(
    `SELECT DISTINCT corridor_id
       FROM silver.provider_corridor_capability
      WHERE corridor_id IS NOT NULL
      ORDER BY corridor_id`,
    [],
    pool,
  )
  const corridors: string[] = []
  for (const row of result.rows) {
    if (!row.corridor_id) continue
    const normalized = normalizeUpper(row.corridor_id)
    if (!parseCorridorId(normalized)) continue
    corridors.push(normalized)
  }
  return sortedUnique(corridors)
}

const loadProviderCatalogCorridorIds = (): string[] => {
  const out = new Set<string>()
  for (const provider of providerRegistry) {
    for (const corridorId of provider.supportedCorridors || []) {
      const normalized = normalizeUpper(corridorId)
      if (!parseCorridorId(normalized)) continue
      out.add(normalized)
    }
  }
  return sortedUnique(out)
}

export const resolveCorridorScope = async (
  pool: Pool,
  options: ResolveCorridorScopeOptions = {},
): Promise<ResolvedCorridorScope> => {
  const scope = parseScope(options.scopeEnv ?? process.env.RIGHTS_SCOPE)
  const defaultSendCurrencies = options.defaultSendCurrencies && options.defaultSendCurrencies.length > 0
    ? options.defaultSendCurrencies.map(normalizeUpper)
    : ['USD', 'AED', 'GBP', 'EUR']

  if (scope === 'ids') {
    const corridorIds = sortedUnique(
      splitCsv(options.corridorIdsEnv ?? process.env.CORRIDOR_IDS).map(validateCorridorId),
    )
    if (corridorIds.length === 0) {
      throw new Error('RIGHTS_SCOPE=ids requires CORRIDOR_IDS')
    }
    return {
      scope,
      corridorIds,
      corridorCount: corridorIds.length,
      sendCurrencies: null,
      corridorIdsFilter: corridorIds,
      providerCatalogCorridorCount: 0,
      capabilityCorridorCount: 0,
    }
  }

  if (scope === 'macro') {
    const sendCurrencies = sortedUnique(
      splitCsv(options.sendCurrenciesEnv ?? process.env.SEND_CURRENCIES).length
        ? splitCsv(options.sendCurrenciesEnv ?? process.env.SEND_CURRENCIES)
        : defaultSendCurrencies,
    )
    const sendCurrencySet = new Set(sendCurrencies.map(normalizeUpper))
    const corridorIds = sortedUnique(
      getMacroCorridors()
        .filter((corridor) => sendCurrencySet.has(normalizeUpper(corridor.sourceCurrency)))
        .map((corridor) => corridor.corridorId),
    )
    return {
      scope,
      corridorIds,
      corridorCount: corridorIds.length,
      sendCurrencies,
      corridorIdsFilter: null,
      providerCatalogCorridorCount: 0,
      capabilityCorridorCount: 0,
    }
  }

  const providerCatalogCorridors = loadProviderCatalogCorridorIds()
  const includeCapability = options.includeCapabilityTableCorridors !== false
  const capabilityCorridors = includeCapability
    ? await loadCapabilityCorridorIds(pool)
    : []

  const corridorIds = sortedUnique([
    ...providerCatalogCorridors,
    ...capabilityCorridors,
  ])

  return {
    scope: 'all',
    corridorIds,
    corridorCount: corridorIds.length,
    sendCurrencies: null,
    corridorIdsFilter: null,
    providerCatalogCorridorCount: providerCatalogCorridors.length,
    capabilityCorridorCount: capabilityCorridors.length,
  }
}
