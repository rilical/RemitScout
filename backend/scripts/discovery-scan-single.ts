/**
 * ECS entrypoint: discovery-scan-single (single-provider scan).
 *
 * Runs B2C discovery for a single specified provider.
 *
 * Environment variables:
 *   DISCOVERY_PROVIDER         — Provider ID to scan (required)
 * Used for manual one-off discovery scans triggered by ops.
 */

import { randomUUID } from 'node:crypto'
import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import {
  runDiscoveryForProvider,
  getRegisteredDiscoveryProviders,
} from '../plane-b/src/discovery/discovery-runner'
import type { DiscoveryRunOptions } from '../plane-b/src/discovery/discovery-types'

const logger = createLogger('script.discovery-scan-single')
initTracing('discovery-scan-single')

const run = async () => {
  const providerId = process.env.DISCOVERY_PROVIDER?.trim()

  if (!providerId) {
    logger.error('discovery_scan_single_missing_provider', {
      message: 'DISCOVERY_PROVIDER env var is required',
    })
    process.exit(1)
  }

  const registered = getRegisteredDiscoveryProviders()
  if (!registered.includes(providerId)) {
    logger.error('discovery_scan_single_unknown_provider', {
      providerId,
      registered,
    })
    process.exit(1)
  }

  const pool = createPool(config.db.planeBUrl)
  const correlationId = randomUUID()

  try {
    const options: DiscoveryRunOptions = {
      triggeredBy: 'manual',
      correlationId,
    }

    logger.info('discovery_scan_single_start', {
      correlationId,
      providerId,
    })

    const result = await runDiscoveryForProvider(pool, providerId, options)

    if (!result) {
      logger.error('discovery_scan_single_no_result', {
        correlationId,
        providerId,
        message: 'Provider scan returned null',
      })
      process.exit(1)
    }

    const hasCriticalErrors = result.errors.some((e) => !e.recoverable)
    const status = hasCriticalErrors && result.corridors.length === 0
      ? 'failed'
      : result.errors.length > 0 && result.corridors.length > 0
        ? 'partial'
        : 'completed'

    logger.info('discovery_scan_single_complete', {
      correlationId,
      providerId,
      status,
      corridors: result.corridors.length,
      deliveryMethods: result.deliveryMethods.length,
      promotions: result.promotions.length,
      errors: result.errors.length,
      durationMs: result.metadata.durationMs,
    })

    if (status === 'failed') {
      process.exit(1)
    }
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('discovery_scan_single_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      process.exit(1)
    })
}
