/**
 * Dahabshiil Provider Health Probe
 * 
 * Thin wrapper around generic probe implementation.
 * 
 * Usage:
 *   pnpm -C backend dahabshiil:probe
 */

import { createLogger } from '../shared/logger'
import { runGenericProbe } from './lib/generic-probe'
import { formatError } from '../shared/utils/error-handling'

const logger = createLogger('script.dahabshiil-probe')

const main = async () => {
  try {
    const result = await runGenericProbe({
      providerId: 'dahabshiil',
      timeoutMs: Number(process.env.PROBE_TIMEOUT_MS) || 300000,
      retries: Number(process.env.PROBE_RETRIES) || 0,
      outputFormat: process.env.PROBE_OUTPUT_FORMAT === 'text' ? 'text' : 'json',
      payinMethod: 'bank_transfer',
      payoutMethod: 'cash_pickup',
    })

    process.exit(result.success ? 0 : 1)
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('probe_failed', {
      provider_id: 'dahabshiil',
      error: message,
      stack,
    })
    process.exit(1)
  }
}

let shutdownRequested = false
const shutdown = (signal: string) => {
  if (shutdownRequested) return
  shutdownRequested = true
  logger.info('shutdown_requested', { signal })
  process.exit(1)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

main().catch((error) => {
  logger.error('probe_failed', { error })
  process.exit(1)
})
