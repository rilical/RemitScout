/**
 * Diff reporter — compares discovery results against current rights_matrix
 * and code-maps to produce actionable diff reports for human review.
 *
 * The reporter does NOT apply any changes. It generates a report that
 * an admin must review and approve before rights_matrix updates happen.
 */

import type { Pool } from 'pg'
import { createLogger } from '../../../../shared/logger'
import type { DiscoveryResult } from '../discovery-types'
import type {
  ProviderDiffReport,
  BatchDiffReport,
  CorridorDelta,
  DeliveryMethodDelta,
  PromotionDelta,
} from './report-types'

const logger = createLogger('plane-b.discovery.diff-reporter')

// ── Single-provider diff ─────────────────────────────────────────────

/**
 * Generate a diff report for a single provider by comparing
 * discovery results against the current rights_matrix.
 */
export async function generateProviderDiff(
  pool: Pool,
  providerId: string,
  scanId: number,
  result: DiscoveryResult,
): Promise<ProviderDiffReport> {
  logger.info('diff_report_generating', { providerId, scanId })

  // 1. Load current rights_matrix for this provider
  const currentRights = await loadCurrentRights(pool, providerId)

  // 2. Load known delivery methods from code-map capability
  const knownMethods = await loadKnownMethods(pool, providerId)

  // 3. Check if provider has existing promo detection
  const hasPromoDetection = await checkPromoDetection(pool, providerId)

  // 4. Compute corridor delta
  const corridorDelta = computeCorridorDelta(result, currentRights)

  // 5. Compute delivery method delta
  const deliveryMethodDelta = computeDeliveryMethodDelta(result, knownMethods)

  // 6. Compute promotion delta
  const promotionDelta = computePromotionDelta(result, hasPromoDetection)

  // 7. Determine recommendation
  const recommendation = determineRecommendation(corridorDelta, deliveryMethodDelta, promotionDelta)

  const report: ProviderDiffReport = {
    providerId,
    scanId,
    scannedAt: result.scannedAt,
    corridorDelta,
    deliveryMethodDelta,
    promotionDelta,
    recommendation,
    stats: {
      totalCorridorsDiscovered: result.corridors.length,
      totalDeliveryMethodsDiscovered: result.deliveryMethods.length,
      totalPromotionsDetected: result.promotions.length,
      totalErrors: result.errors.length,
    },
  }

  // 8. Store diff in scan record
  await storeDiff(pool, scanId, report)

  logger.info('diff_report_generated', {
    providerId,
    scanId,
    recommendation,
    newSourceCountries: corridorDelta.newSourceCountries.length,
    newDestCountries: corridorDelta.newDestinationCountries.length,
    newPayinMethods: deliveryMethodDelta.newPayinMethods.length,
    newPayoutMethods: deliveryMethodDelta.newPayoutMethods.length,
    promos: promotionDelta.discoveredPromos.length,
  })

  return report
}

// ── Batch diff ───────────────────────────────────────────────────────

/**
 * Generate diff reports for multiple providers at once.
 */
export async function generateBatchDiff(
  pool: Pool,
  results: Map<string, DiscoveryResult>,
  scanIds: Map<string, number>,
): Promise<BatchDiffReport> {
  const providerReports: ProviderDiffReport[] = []

  for (const [providerId, result] of results) {
    const scanId = scanIds.get(providerId)
    if (!scanId) continue

    const report = await generateProviderDiff(pool, providerId, scanId, result)
    providerReports.push(report)
  }

  const summary = {
    providersScanned: providerReports.length,
    providersWithChanges: providerReports.filter((r) => r.recommendation !== 'no_action').length,
    totalNewSourceCountries: providerReports.reduce(
      (sum, r) => sum + r.corridorDelta.newSourceCountries.length, 0,
    ),
    totalNewDestinationCountries: providerReports.reduce(
      (sum, r) => sum + r.corridorDelta.newDestinationCountries.length, 0,
    ),
    totalNewPayinMethods: providerReports.reduce(
      (sum, r) => sum + r.deliveryMethodDelta.newPayinMethods.length, 0,
    ),
    totalNewPayoutMethods: providerReports.reduce(
      (sum, r) => sum + r.deliveryMethodDelta.newPayoutMethods.length, 0,
    ),
    totalPromotionsDetected: providerReports.reduce(
      (sum, r) => sum + r.promotionDelta.discoveredPromos.length, 0,
    ),
  }

  logger.info('batch_diff_report_generated', summary)

  return {
    generatedAt: new Date().toISOString(),
    providerReports,
    summary,
  }
}

// ── Internal helpers ─────────────────────────────────────────────────

type CurrentRights = {
  sourceCountries: string[]
  destinationCountries: string[]
}

async function loadCurrentRights(
  pool: Pool,
  providerId: string,
): Promise<CurrentRights> {
  const result = await pool.query(
    `SELECT source_countries, destination_countries
     FROM silver.rights_matrix
     WHERE provider_id = $1
     LIMIT 1`,
    [providerId],
  )

  if (result.rows.length === 0) {
    return { sourceCountries: [], destinationCountries: [] }
  }

  return {
    sourceCountries: result.rows[0].source_countries ?? [],
    destinationCountries: result.rows[0].destination_countries ?? [],
  }
}

type KnownMethods = {
  payinMethods: Set<string>
  payoutMethods: Set<string>
}

async function loadKnownMethods(
  pool: Pool,
  providerId: string,
): Promise<KnownMethods> {
  const result = await pool.query(
    `SELECT DISTINCT
       unnest(payin_methods) AS method, 'payin' AS direction
     FROM silver.provider_corridor_capability
     WHERE provider_id = $1
     UNION ALL
     SELECT DISTINCT
       unnest(payout_methods) AS method, 'payout' AS direction
     FROM silver.provider_corridor_capability
     WHERE provider_id = $1`,
    [providerId],
  )

  const payinMethods = new Set<string>()
  const payoutMethods = new Set<string>()

  for (const row of result.rows) {
    if (row.direction === 'payin') payinMethods.add(row.method)
    else payoutMethods.add(row.method)
  }

  return { payinMethods, payoutMethods }
}

async function checkPromoDetection(
  pool: Pool,
  providerId: string,
): Promise<boolean> {
  // Check if any recent quotes for this provider have non-null promotional fields
  const result = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM silver.latest_quote_by_provider
       WHERE provider_id = $1
         AND (promotional_fee_amount IS NOT NULL OR promotional_rate IS NOT NULL)
       LIMIT 1
     ) AS has_promos`,
    [providerId],
  )

  return result.rows[0]?.has_promos ?? false
}

function computeCorridorDelta(
  result: DiscoveryResult,
  currentRights: CurrentRights,
): CorridorDelta {
  const discoveredSources = new Set<string>()
  const discoveredDests = new Set<string>()
  const discoveredCorridorIds: string[] = []

  for (const corridor of result.corridors) {
    discoveredSources.add(corridor.sourceCountry)
    discoveredDests.add(corridor.destinationCountry)
    if (corridor.corridorId) {
      discoveredCorridorIds.push(corridor.corridorId)
    }
  }

  const currentSources = new Set(currentRights.sourceCountries)
  const currentDests = new Set(currentRights.destinationCountries)

  // New = discovered but not in current rights
  const newSourceCountries = [...discoveredSources].filter((c) => !currentSources.has(c))
  const newDestinationCountries = [...discoveredDests].filter((c) => !currentDests.has(c))

  // Removed = in current rights but not discovered
  // Only flag removals if we discovered a meaningful number of corridors
  // (to avoid false positives from partial scans)
  const removedSourceCountries = result.corridors.length > 10
    ? [...currentSources].filter((c) => !discoveredSources.has(c))
    : []
  const removedDestinationCountries = result.corridors.length > 10
    ? [...currentDests].filter((c) => !discoveredDests.has(c))
    : []

  return {
    newSourceCountries,
    newDestinationCountries,
    removedSourceCountries,
    removedDestinationCountries,
    newCorridorIds: discoveredCorridorIds,
  }
}

function computeDeliveryMethodDelta(
  result: DiscoveryResult,
  knownMethods: KnownMethods,
): DeliveryMethodDelta {
  const discoveredPayin = new Set<string>()
  const discoveredPayout = new Set<string>()
  const unmappedLabels: Array<{ raw: string; direction: 'payin' | 'payout' }> = []

  for (const method of result.deliveryMethods) {
    discoveredPayin.add(method.normalizedPayin)
    discoveredPayout.add(method.normalizedPayout)

    if (method.unmapped) {
      if (method.rawPayinLabel) {
        unmappedLabels.push({ raw: method.rawPayinLabel, direction: 'payin' })
      }
      if (method.rawPayoutLabel) {
        unmappedLabels.push({ raw: method.rawPayoutLabel, direction: 'payout' })
      }
    }
  }

  const newPayinMethods = [...discoveredPayin].filter((m) => !knownMethods.payinMethods.has(m))
  const newPayoutMethods = [...discoveredPayout].filter((m) => !knownMethods.payoutMethods.has(m))

  return {
    newPayinMethods,
    newPayoutMethods,
    unmappedLabels,
  }
}

function computePromotionDelta(
  result: DiscoveryResult,
  hasExistingPromoDetection: boolean,
): PromotionDelta {
  return {
    discoveredPromos: result.promotions.map((p) => ({
      type: p.type,
      corridorId: p.corridorId,
      rawText: p.rawText,
      strikethroughDetected: p.strikethroughDetected,
    })),
    hasExistingPromoDetection,
  }
}

function determineRecommendation(
  corridorDelta: CorridorDelta,
  deliveryMethodDelta: DeliveryMethodDelta,
  promotionDelta: PromotionDelta,
): ProviderDiffReport['recommendation'] {
  const hasCorridorChanges =
    corridorDelta.newSourceCountries.length > 0 ||
    corridorDelta.newDestinationCountries.length > 0

  const hasMethodChanges =
    deliveryMethodDelta.newPayinMethods.length > 0 ||
    deliveryMethodDelta.newPayoutMethods.length > 0 ||
    deliveryMethodDelta.unmappedLabels.length > 0

  const hasPromoChanges =
    promotionDelta.discoveredPromos.length > 0 && !promotionDelta.hasExistingPromoDetection

  if (hasCorridorChanges && (hasMethodChanges || hasPromoChanges)) return 'review_all'
  if (hasCorridorChanges) return 'review_corridors'
  if (hasMethodChanges) return 'review_methods'
  if (hasPromoChanges) return 'review_promos'
  return 'no_action'
}

async function storeDiff(
  pool: Pool,
  scanId: number,
  report: ProviderDiffReport,
): Promise<void> {
  await pool.query(
    `UPDATE silver.discovery_scan
     SET diff_json = $2
     WHERE id = $1`,
    [scanId, JSON.stringify(report)],
  )
}
