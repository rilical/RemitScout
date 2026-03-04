/**
 * ECS entrypoint: discovery-scan (all-provider scan).
 *
 * Runs B2C discovery for all registered providers (or a filtered subset).
 *
 * Environment variables:
 *   DISCOVERY_PROVIDERS       — Comma-separated provider IDs to scan (optional; defaults to all)
 *   DISCOVERY_APPLY_RESULTS   — "1" or "true" to auto-apply discovered corridors/methods
 *
 * Scheduled via ECS Fargate (Sundays 3am UTC) or triggered manually.
 */

import { randomUUID } from 'node:crypto'
import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import {
  runDiscoveryForAll,
  runDiscoveryForProvider,
  getRegisteredDiscoveryProviders,
} from '../plane-b/src/discovery/discovery-runner'
import type { DiscoveryRunOptions, DiscoveryResult } from '../plane-b/src/discovery/discovery-types'

const logger = createLogger('script.discovery-scan')
initTracing('discovery-scan')

const parseApplyResults = (): boolean => {
  const raw = process.env.DISCOVERY_APPLY_RESULTS
  const lower = raw?.toLowerCase()
  return lower === '1' || lower === 'true' || lower === 'yes'
}

const parseProviderFilter = (): string[] | null => {
  const raw = process.env.DISCOVERY_PROVIDERS
  if (!raw || !raw.trim()) return null

  const registered = new Set(getRegisteredDiscoveryProviders())
  const requested = raw.split(',').map((id) => id.trim()).filter(Boolean)
  const valid: string[] = []
  const unknown: string[] = []

  for (const id of requested) {
    if (registered.has(id)) {
      valid.push(id)
    } else {
      unknown.push(id)
    }
  }

  if (unknown.length > 0) {
    logger.warn('discovery_scan_unknown_providers', {
      unknown,
      registered: [...registered],
    })
  }

  return valid.length > 0 ? valid : null
}

const run = async () => {
  const pool = createPool(config.db.planeBUrl)
  const correlationId = randomUUID()

  try {
    const applyResults = parseApplyResults()
    const providerFilter = parseProviderFilter()

    const options: DiscoveryRunOptions = {
      triggeredBy: 'schedule',
      correlationId,
      applyResults,
    }

    logger.info('discovery_scan_start', {
      correlationId,
      applyResults,
      providerFilter: providerFilter ?? 'all',
      registeredCount: getRegisteredDiscoveryProviders().length,
    })

    let results: Map<string, DiscoveryResult>

    if (providerFilter) {
      // Filtered scan: run selected providers sequentially
      results = new Map()
      for (const providerId of providerFilter) {
        const result = await runDiscoveryForProvider(pool, providerId, options)
        if (result) {
          results.set(providerId, result)
        }
      }
    } else {
      // Full scan: all registered providers
      results = await runDiscoveryForAll(pool, options)
    }

    // Build summary
    let totalCorridors = 0
    let totalDeliveryMethods = 0
    let totalPromotions = 0
    let totalErrors = 0
    let failedProviders = 0

    for (const [providerId, result] of results) {
      totalCorridors += result.corridors.length
      totalDeliveryMethods += result.deliveryMethods.length
      totalPromotions += result.promotions.length
      totalErrors += result.errors.length

      const hasCriticalErrors = result.errors.some((e) => !e.recoverable)
      if (hasCriticalErrors && result.corridors.length === 0) {
        failedProviders++
      }
    }

    const scannedCount = providerFilter ? providerFilter.length : getRegisteredDiscoveryProviders().length
    const successCount = results.size

    logger.info('discovery_scan_complete', {
      correlationId,
      scannedCount,
      successCount,
      failedProviders,
      totalCorridors,
      totalDeliveryMethods,
      totalPromotions,
      totalErrors,
      applyResults,
    })
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('discovery_scan_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      process.exit(1)
    })
}
