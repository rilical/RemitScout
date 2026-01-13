/**
 * Pangea Provider Health Probe
 * 
 * Thin wrapper around generic probe implementation.
 */

import { createLogger } from '../shared/logger'
import { runGenericProbe } from './lib/generic-probe'
import { formatError } from '../shared/utils/error-handling'

const logger = createLogger('script.pangea-probe')

const main = async () => {
  try {
    const result = await runGenericProbe({
      providerId: 'pangea',
      timeoutMs: Number(process.env.PROBE_TIMEOUT_MS) || 300000,
      retries: Number(process.env.PROBE_RETRIES) || 0,
      outputFormat: process.env.PROBE_OUTPUT_FORMAT === 'text' ? 'text' : 'json',
    })

    process.exit(result.success ? 0 : 1)
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('probe_failed', {
      provider_id: 'pangea',
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
