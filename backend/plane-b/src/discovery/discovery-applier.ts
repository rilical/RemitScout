/**
 * Discovery applier — writes discovery results back to rights_matrix
 * and provider_corridor_capability tables.
 *
 * Key design: upsertProviderCountrySupport() REPLACES entire arrays,
 * so we must MERGE discovered countries with existing ones before writing.
 *
 * For delivery methods, upsertCapability() does per-corridor UPSERT,
 * merging discovered payin/payout methods with existing ones.
 */

import type { Pool, PoolClient } from 'pg'
import { createLogger } from '../../../shared/logger'
import type { DiscoveryResult, DiscoveredDeliveryMethod } from './discovery-types'

const logger = createLogger('plane-b.discovery.applier')

type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>

// ── Result types ────────────────────────────────────────────────────

export type ApplyResult = {
  providerId: string
  rightsMatrixUpdated: boolean
  sourceCountriesAdded: string[]
  destinationCountriesAdded: string[]
  capabilitiesUpserted: number
  corridorsWithNewMethods: string[]
  errors: string[]
}

export type ApplyDiscoveryOptions = {
  discoveryScanId?: number
  approvedBy?: string
}

// ── Main entry point ────────────────────────────────────────────────

/**
 * Apply discovery results to rights_matrix and provider_corridor_capability.
 *
 * 1. Merges discovered source/dest countries with existing rights_matrix arrays.
 * 2. For each corridor with delivery methods, upserts payin/payout methods
 *    into provider_corridor_capability (merging with existing).
 */
export async function applyDiscoveryResults(
  pool: Queryable,
  providerId: string,
  result: DiscoveryResult,
  options: ApplyDiscoveryOptions = {},
): Promise<ApplyResult> {
  const applyResult: ApplyResult = {
    providerId,
    rightsMatrixUpdated: false,
    sourceCountriesAdded: [],
    destinationCountriesAdded: [],
    capabilitiesUpserted: 0,
    corridorsWithNewMethods: [],
    errors: [],
  }

  await applyCountryExpansions(pool, providerId, result, applyResult, options)
  await applyCapabilityUpdates(pool, providerId, result, applyResult)

  logger.info('discovery_apply_completed', {
    providerId,
    rightsMatrixUpdated: applyResult.rightsMatrixUpdated,
    sourceCountriesAdded: applyResult.sourceCountriesAdded.length,
    destinationCountriesAdded: applyResult.destinationCountriesAdded.length,
    capabilitiesUpserted: applyResult.capabilitiesUpserted,
    corridorsWithNewMethods: applyResult.corridorsWithNewMethods.length,
    errors: applyResult.errors.length,
  })

  return applyResult
}

// ── Country expansions ──────────────────────────────────────────────

async function applyCountryExpansions(
  pool: Queryable,
  providerId: string,
  result: DiscoveryResult,
  applyResult: ApplyResult,
  options: ApplyDiscoveryOptions,
): Promise<void> {
  if (result.corridors.length === 0) return

  // Extract discovered countries from corridors
  const discoveredSources = new Set<string>()
  const discoveredDests = new Set<string>()

  for (const corridor of result.corridors) {
    discoveredSources.add(corridor.sourceCountry)
    discoveredDests.add(corridor.destinationCountry)
  }

  // Load current rights_matrix
  const currentRow = await pool.query(
    `SELECT source_countries, destination_countries
     FROM silver.rights_matrix
     WHERE provider_id = $1
     LIMIT 1`,
    [providerId],
  )

  const existingSources: string[] = currentRow.rows[0]?.source_countries ?? []
  const existingDests: string[] = currentRow.rows[0]?.destination_countries ?? []

  // Merge: union of existing + discovered
  const mergedSources = [...new Set([...existingSources, ...discoveredSources])].sort()
  const mergedDests = [...new Set([...existingDests, ...discoveredDests])].sort()

  // Compute what's new
  const existingSourceSet = new Set(existingSources)
  const existingDestSet = new Set(existingDests)
  const newSources = [...discoveredSources].filter((c) => !existingSourceSet.has(c)).sort()
  const newDests = [...discoveredDests].filter((c) => !existingDestSet.has(c)).sort()

  // Only write if there are changes
  if (newSources.length === 0 && newDests.length === 0) {
    logger.info('discovery_apply_no_country_changes', { providerId })
    return
  }

  // Upsert with merged arrays (handles case where provider row may not exist yet)
  await pool.query(
    `INSERT INTO silver.rights_matrix (provider_id, source_countries, destination_countries)
     VALUES ($1, $2, $3)
     ON CONFLICT (provider_id) DO UPDATE SET
       source_countries = $2,
       destination_countries = $3,
       last_audited_at = NOW(),
       updated_at = NOW()`,
    [providerId, mergedSources, mergedDests],
  )

  applyResult.rightsMatrixUpdated = true
  applyResult.sourceCountriesAdded = newSources
  applyResult.destinationCountriesAdded = newDests

  if (options.discoveryScanId && options.approvedBy) {
    if (newSources.length > 0) {
      await pool.query(
        `INSERT INTO silver.rights_matrix_audit_log
           (provider_id, field_changed, previous_value, new_value, discovery_scan_id, approved_by)
         VALUES ($1, 'source_countries', $2, $3, $4, $5)`,
        [
          providerId,
          JSON.stringify(existingSources),
          JSON.stringify(mergedSources),
          options.discoveryScanId,
          options.approvedBy,
        ],
      )
    }
    if (newDests.length > 0) {
      await pool.query(
        `INSERT INTO silver.rights_matrix_audit_log
           (provider_id, field_changed, previous_value, new_value, discovery_scan_id, approved_by)
         VALUES ($1, 'destination_countries', $2, $3, $4, $5)`,
        [
          providerId,
          JSON.stringify(existingDests),
          JSON.stringify(mergedDests),
          options.discoveryScanId,
          options.approvedBy,
        ],
      )
    }
  }

  logger.info('discovery_apply_countries_expanded', {
    providerId,
    newSources,
    newDests,
    totalSources: mergedSources.length,
    totalDests: mergedDests.length,
  })
}

// ── Capability updates ──────────────────────────────────────────────

async function applyCapabilityUpdates(
  pool: Queryable,
  providerId: string,
  result: DiscoveryResult,
  applyResult: ApplyResult,
): Promise<void> {
  if (result.deliveryMethods.length === 0) return

  // Group delivery methods by corridorId
  const byCorridorId = new Map<string, DiscoveredDeliveryMethod[]>()
  for (const method of result.deliveryMethods) {
    const cid = method.corridorId
    if (!cid) continue
    const existing = byCorridorId.get(cid) ?? []
    existing.push(method)
    byCorridorId.set(cid, existing)
  }

  for (const [corridorId, methods] of byCorridorId) {
    const discoveredPayins = new Set<string>()
    const discoveredPayouts = new Set<string>()
    for (const m of methods) {
      discoveredPayins.add(m.normalizedPayin)
      discoveredPayouts.add(m.normalizedPayout)
    }

    const existingRow = await pool.query(
      `SELECT payin_methods, payout_methods
       FROM silver.provider_corridor_capability
       WHERE provider_id = $1 AND corridor_id = $2
       LIMIT 1`,
      [providerId, corridorId],
    )

    const existingPayins: string[] = existingRow.rows[0]?.payin_methods ?? []
    const existingPayouts: string[] = existingRow.rows[0]?.payout_methods ?? []

    const mergedPayins = [...new Set([...existingPayins, ...discoveredPayins])].sort()
    const mergedPayouts = [...new Set([...existingPayouts, ...discoveredPayouts])].sort()

    const existingPayinSet = new Set(existingPayins)
    const existingPayoutSet = new Set(existingPayouts)
    const hasNewPayins = [...discoveredPayins].some((m) => !existingPayinSet.has(m))
    const hasNewPayouts = [...discoveredPayouts].some((m) => !existingPayoutSet.has(m))

    await pool.query(
      `INSERT INTO silver.provider_corridor_capability
         (provider_id, corridor_id, payin_methods, payout_methods, is_supported, source, last_verified_at)
       VALUES ($1, $2, $3, $4, true, 'discovery', NOW())
       ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
         payin_methods = $3,
         payout_methods = $4,
         is_supported = true,
         source = CASE
           WHEN silver.provider_corridor_capability.source IS NULL THEN 'discovery'
           WHEN silver.provider_corridor_capability.source = 'discovery' THEN 'discovery'
           ELSE silver.provider_corridor_capability.source || '+discovery'
         END,
         last_verified_at = NOW(),
         updated_at = NOW()`,
      [providerId, corridorId, mergedPayins, mergedPayouts],
    )

    applyResult.capabilitiesUpserted++
    if (hasNewPayins || hasNewPayouts) {
      applyResult.corridorsWithNewMethods.push(corridorId)
    }
  }
}
