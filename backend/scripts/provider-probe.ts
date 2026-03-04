/**
 * Generic provider health probe wrapper.
 *
 * Usage:
 *   PROVIDER_ID=remitly pnpm -C backend probe:provider
 *
 * This is intentionally executor-friendly:
 * - GitHub Actions can call ONE script with a matrix of PROVIDER_ID values
 * - Local ops can run ad-hoc without dedicated wrapper files
 */

import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { runGenericProbe } from './lib/generic-probe'
import { formatError } from '../shared/utils/error-handling'

const providerId = (process.env.PROVIDER_ID || '').trim()
const logger = createLogger(`script.provider-probe.${providerId || 'unknown'}`)

initTracing('provider-probe')

const main = async () => {
  if (!providerId) {
    console.error('Missing PROVIDER_ID (example: PROVIDER_ID=wise pnpm -C backend probe:provider)')
    process.exit(2)
  }

  try {
    const result = await runGenericProbe({
      providerId,
      timeoutMs: Number(process.env.PROBE_TIMEOUT_MS) || 300000,
      retries: Number(process.env.PROBE_RETRIES) || 3,
      outputFormat: process.env.PROBE_OUTPUT_FORMAT === 'text' ? 'text' : 'json',
    })

    process.exit(result.success ? 0 : 1)
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('probe_failed', { provider_id: providerId, error: message, stack })
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

