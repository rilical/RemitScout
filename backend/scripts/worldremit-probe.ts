import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { getHealthCorridors } from '../shared/health-corridors'
import { runWorldRemitCollector } from '../plane-b/src/providers/worldremit/collector'
import { httpLimits } from '../plane-b/src/providers/worldremit/limits'
import { createProbeRunner, outputProbeResult } from './lib/probe-utils'

const logger = createLogger('script.worldremit-probe')
const corridors = getHealthCorridors('worldremit')

const main = async () => {
  const runner = createProbeRunner({
    providerId: 'worldremit',
    corridors,
    timeoutMs: Number(process.env.PROBE_TIMEOUT_MS) || 300000,
    retries: Number(process.env.PROBE_RETRIES) || 0,
  })

  const result = await runner.run(async () => {
    return await runWorldRemitCollector({
      collectorType: 'health_probe',
      corridors,
      amountBuckets: [100],
      payinMethod: 'bank_transfer',
      payoutMethod: 'bank_deposit',
      locale: 'en-US',
      delayMs: config.planeB.worldremit.delayMs,
      jitterMs: config.planeB.worldremit.jitterMs,
      corridorDelayMs: config.planeB.worldremit.corridorDelayMs,
      corridorJitterMs: config.planeB.worldremit.corridorJitterMs,
      rateLimitBackoffMs: config.planeB.worldremit.rateLimitBackoffMs,
      rateLimitJitterMs: config.planeB.worldremit.rateLimitJitterMs,
      rateLimitMaxRetries: config.planeB.worldremit.rateLimitMaxRetries,
      rpmOverride: httpLimits.rpm,
      perCorridorRpmOverride: httpLimits.perCorridorRpm,
    })
  })

  outputProbeResult(result, process.env.PROBE_OUTPUT_FORMAT === 'text' ? 'text' : 'json')
  logger.info('probe_complete', result)

  process.exit(result.success ? 0 : 1)
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
