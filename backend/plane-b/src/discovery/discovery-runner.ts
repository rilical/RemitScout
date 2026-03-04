/**
 * Discovery runner — orchestrates discovery scans for one or all providers.
 *
 * Manages the lifecycle:
 * 1. Create a discovery_scan record
 * 2. Run the provider's discovery script
 * 3. Store results + diff in the scan record
 * 4. Mark scan completed or failed
 *
 * Respects inter-provider delays for multi-provider scans.
 */

import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import type { ProviderDiscovery } from './discovery-base'
import type { DiscoveryResult, DiscoveryRunOptions } from './discovery-types'
import { applyDiscoveryResults } from './discovery-applier'
import type { ApplyResult } from './discovery-applier'

// Lazy-load provider scripts to avoid importing Playwright at module level
const PROVIDER_FACTORIES: Record<string, () => Promise<ProviderDiscovery>> = {
  wise: async () => {
    const { WiseDiscovery } = await import('./providers/wise')
    return new WiseDiscovery()
  },
  paysend: async () => {
    const { PaysendDiscovery } = await import('./providers/paysend')
    return new PaysendDiscovery()
  },
  remitly: async () => {
    const { RemitlyDiscovery } = await import('./providers/remitly')
    return new RemitlyDiscovery()
  },
  worldremit: async () => {
    const { WorldRemitDiscovery } = await import('./providers/worldremit')
    return new WorldRemitDiscovery()
  },
  xe: async () => {
    const { XeDiscovery } = await import('./providers/xe')
    return new XeDiscovery()
  },
  transfergo: async () => {
    const { TransferGoDiscovery } = await import('./providers/transfergo')
    return new TransferGoDiscovery()
  },
  westernunion: async () => {
    const { WesternUnionDiscovery } = await import('./providers/westernunion')
    return new WesternUnionDiscovery()
  },
  ria: async () => {
    const { RiaDiscovery } = await import('./providers/ria')
    return new RiaDiscovery()
  },
  xoom: async () => {
    const { XoomDiscovery } = await import('./providers/xoom')
    return new XoomDiscovery()
  },
  instarem: async () => {
    const { InstaremDiscovery } = await import('./providers/instarem')
    return new InstaremDiscovery()
  },
  sendwave: async () => {
    const { SendwaveDiscovery } = await import('./providers/sendwave')
    return new SendwaveDiscovery()
  },
  wirebarley: async () => {
    const { WireBarleyDiscovery } = await import('./providers/wirebarley')
    return new WireBarleyDiscovery()
  },
  pangea: async () => {
    const { PangeaDiscovery } = await import('./providers/pangea')
    return new PangeaDiscovery()
  },
  bossmoney: async () => {
    const { BossMoneyDiscovery } = await import('./providers/bossmoney')
    return new BossMoneyDiscovery()
  },
  dahabshiil: async () => {
    const { DahabshiilDiscovery } = await import('./providers/dahabshiil')
    return new DahabshiilDiscovery()
  },
  alansari: async () => {
    const { AlAnsariDiscovery } = await import('./providers/alansari')
    return new AlAnsariDiscovery()
  },
  intermex: async () => {
    const { IntermexDiscovery } = await import('./providers/intermex')
    return new IntermexDiscovery()
  },
  koronapay: async () => {
    const { KoronaPayDiscovery } = await import('./providers/koronapay')
    return new KoronaPayDiscovery()
  },
  mukuru: async () => {
    const { MukuruDiscovery } = await import('./providers/mukuru')
    return new MukuruDiscovery()
  },
  orbitremit: async () => {
    const { OrbitRemitDiscovery } = await import('./providers/orbitremit')
    return new OrbitRemitDiscovery()
  },
  placid: async () => {
    const { PlacidDiscovery } = await import('./providers/placid')
    return new PlacidDiscovery()
  },
  remitbee: async () => {
    const { RemitBeeDiscovery } = await import('./providers/remitbee')
    return new RemitBeeDiscovery()
  },
  singx: async () => {
    const { SingXDiscovery } = await import('./providers/singx')
    return new SingXDiscovery()
  },
  wellsfargo: async () => {
    const { WellsFargoDiscovery } = await import('./providers/wellsfargo')
    return new WellsFargoDiscovery()
  },
}

const logger = createLogger('plane-b.discovery.runner')

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// ── Types ────────────────────────────────────────────────────────────

export type DiscoveryScanRecord = {
  id: number
  providerId: string
  status: 'running' | 'completed' | 'failed' | 'partial'
  corridorsDiscovered: number
  deliveryMethodsDiscovered: number
  promotionsDetected: number
  errorsCount: number
  durationMs: number | null
  triggeredBy: string
  correlationId: string | null
}

// ── Single-provider scan ─────────────────────────────────────────────

/**
 * Run discovery for a single provider.
 *
 * Creates a scan record, executes the discovery script, and persists results.
 * Returns the DiscoveryResult for further processing (e.g., diff reporting).
 */
export async function runDiscoveryForProvider(
  pool: Pool,
  providerId: string,
  options: DiscoveryRunOptions,
): Promise<DiscoveryResult | null> {
  const factory = PROVIDER_FACTORIES[providerId]
  if (!factory) {
    logger.warn('discovery_unknown_provider', { providerId })
    return null
  }

  // 1. Create scan record
  const scanId = await createScanRecord(pool, providerId, options)

  logger.info('discovery_scan_started', {
    scanId,
    providerId,
    triggeredBy: options.triggeredBy,
    correlationId: options.correlationId ?? null,
  })

  let result: DiscoveryResult | null = null

  try {
    // 2. Instantiate and run discovery
    const discovery = await factory()
    result = await discovery.run(pool, options)

    // 3. Determine status
    const hasErrors = result.errors.length > 0
    const hasCriticalErrors = result.errors.some((e) => !e.recoverable)
    const hasData = result.corridors.length > 0

    const status = hasCriticalErrors && !hasData
      ? 'failed'
      : hasErrors && hasData
        ? 'partial'
        : 'completed'

    // 4. Persist results
    await updateScanRecord(pool, scanId, {
      status,
      corridorsDiscovered: result.corridors.length,
      deliveryMethodsDiscovered: result.deliveryMethods.length,
      promotionsDetected: result.promotions.length,
      errorsCount: result.errors.length,
      resultJson: result,
      durationMs: result.metadata.durationMs,
    })

    // 5. Persist discovered corridors
    if (result.corridors.length > 0) {
      await persistDiscoveredCorridors(pool, scanId, providerId, result)
    }

    // 6. Persist discovered promotions
    if (result.promotions.length > 0) {
      await persistDiscoveredPromotions(pool, scanId, providerId, result)
    }

    // 7. Auto-apply results to rights_matrix + capability tables
    let applied: ApplyResult | null = null
    if (options.applyResults && status !== 'failed') {
      try {
        applied = await applyDiscoveryResults(pool, providerId, result)
        logger.info('discovery_apply_summary', {
          scanId,
          providerId,
          rightsMatrixUpdated: applied.rightsMatrixUpdated,
          sourceCountriesAdded: applied.sourceCountriesAdded.length,
          destinationCountriesAdded: applied.destinationCountriesAdded.length,
          capabilitiesUpserted: applied.capabilitiesUpserted,
          corridorsWithNewMethods: applied.corridorsWithNewMethods.length,
          applyErrors: applied.errors.length,
        })
      } catch (applyErr) {
        logger.error('discovery_apply_error', {
          scanId,
          providerId,
          error: applyErr instanceof Error ? applyErr.message : String(applyErr),
        })
      }
    }

    logger.info('discovery_scan_completed', {
      scanId,
      providerId,
      status,
      corridors: result.corridors.length,
      deliveryMethods: result.deliveryMethods.length,
      promotions: result.promotions.length,
      errors: result.errors.length,
      durationMs: result.metadata.durationMs,
      applied: applied != null,
    })
  } catch (err) {
    logger.error('discovery_scan_error', {
      scanId,
      providerId,
      error: err instanceof Error ? err.message : String(err),
    })

    await updateScanRecord(pool, scanId, {
      status: 'failed',
      errorsCount: 1,
      resultJson: {
        error: err instanceof Error ? err.message : String(err),
      },
      durationMs: null,
    })
  }

  return result
}

// ── Multi-provider scan ──────────────────────────────────────────────

/**
 * Run discovery for all registered providers.
 *
 * Executes sequentially with inter-provider delays to be polite.
 * Returns a map of providerId → DiscoveryResult.
 */
export async function runDiscoveryForAll(
  pool: Pool,
  options: DiscoveryRunOptions,
): Promise<Map<string, DiscoveryResult>> {
  const results = new Map<string, DiscoveryResult>()
  const providerIds = Object.keys(PROVIDER_FACTORIES)

  const interProviderDelayMs = (config.planeB as any)?.discovery?.interProviderDelayMs ?? 60_000

  logger.info('discovery_full_scan_started', {
    providerCount: providerIds.length,
    triggeredBy: options.triggeredBy,
    correlationId: options.correlationId ?? null,
  })

  for (let i = 0; i < providerIds.length; i++) {
    const providerId = providerIds[i]

    const result = await runDiscoveryForProvider(pool, providerId, options)
    if (result) {
      results.set(providerId, result)
    }

    // Inter-provider delay (skip after last provider)
    if (i < providerIds.length - 1 && interProviderDelayMs > 0) {
      logger.info('discovery_inter_provider_delay', {
        delayMs: interProviderDelayMs,
        nextProvider: providerIds[i + 1],
      })
      await sleep(interProviderDelayMs)
    }
  }

  logger.info('discovery_full_scan_completed', {
    providerCount: providerIds.length,
    successCount: results.size,
  })

  return results
}

// ── Database helpers ─────────────────────────────────────────────────

async function createScanRecord(
  pool: Pool,
  providerId: string,
  options: DiscoveryRunOptions,
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO silver.discovery_scan
       (provider_id, scan_type, status, triggered_by, correlation_id, started_at)
     VALUES ($1, 'full', 'running', $2, $3, NOW())
     RETURNING id`,
    [providerId, options.triggeredBy, options.correlationId ?? null],
  )
  return result.rows[0].id
}

async function updateScanRecord(
  pool: Pool,
  scanId: number,
  update: {
    status: string
    corridorsDiscovered?: number
    deliveryMethodsDiscovered?: number
    promotionsDetected?: number
    errorsCount: number
    resultJson: unknown
    durationMs: number | null
  },
): Promise<void> {
  await pool.query(
    `UPDATE silver.discovery_scan
     SET status = $2,
         corridors_discovered = COALESCE($3, corridors_discovered),
         delivery_methods_discovered = COALESCE($4, delivery_methods_discovered),
         promotions_detected = COALESCE($5, promotions_detected),
         errors_count = $6,
         result_json = $7,
         duration_ms = $8,
         completed_at = NOW()
     WHERE id = $1`,
    [
      scanId,
      update.status,
      update.corridorsDiscovered ?? null,
      update.deliveryMethodsDiscovered ?? null,
      update.promotionsDetected ?? null,
      update.errorsCount,
      JSON.stringify(update.resultJson),
      update.durationMs,
    ],
  )
}

async function persistDiscoveredCorridors(
  pool: Pool,
  scanId: number,
  providerId: string,
  result: DiscoveryResult,
): Promise<void> {
  // Batch insert discovered corridors
  const values: unknown[] = []
  const placeholders: string[] = []
  let paramIdx = 1

  for (const corridor of result.corridors) {
    placeholders.push(
      `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
    )
    values.push(
      scanId,
      providerId,
      corridor.corridorId,
      corridor.sourceCountry,
      corridor.destinationCountry,
      corridor.sourceCurrency,
      corridor.destinationCurrency,
      corridor.payinMethods.length > 0 ? `{${corridor.payinMethods.join(',')}}` : null,
      corridor.payoutMethods.length > 0 ? `{${corridor.payoutMethods.join(',')}}` : null,
    )
  }

  if (placeholders.length === 0) return

  await pool.query(
    `INSERT INTO silver.discovery_corridor
       (scan_id, provider_id, corridor_id, source_country, destination_country,
        source_currency, destination_currency, payin_methods, payout_methods)
     VALUES ${placeholders.join(', ')}`,
    values,
  )
}

async function persistDiscoveredPromotions(
  pool: Pool,
  scanId: number,
  providerId: string,
  result: DiscoveryResult,
): Promise<void> {
  const values: unknown[] = []
  const placeholders: string[] = []
  let paramIdx = 1

  for (const promo of result.promotions) {
    placeholders.push(
      `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
    )
    values.push(
      scanId,
      providerId,
      promo.corridorId,
      promo.type,
      promo.rawText,
      promo.strikethroughDetected,
      promo.originalValue,
      promo.promoValue,
      promo.bannerSelector,
    )
  }

  if (placeholders.length === 0) return

  await pool.query(
    `INSERT INTO silver.discovery_promotion
       (scan_id, provider_id, corridor_id, promo_type, raw_text,
        strikethrough_detected, original_value, promo_value, banner_selector)
     VALUES ${placeholders.join(', ')}`,
    values,
  )
}

// ── Provider registry ────────────────────────────────────────────────

/**
 * Get list of providers with registered discovery scripts.
 */
export function getRegisteredDiscoveryProviders(): string[] {
  return Object.keys(PROVIDER_FACTORIES)
}
