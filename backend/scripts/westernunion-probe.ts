import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { getHealthCorridors } from '../shared/health-corridors'
import { runWesternUnionCollector } from '../plane-b/src/providers/westernunion/collector'
import { httpLimits } from '../plane-b/src/providers/westernunion/limits'
import { createProbeRunner, outputProbeResult } from './lib/probe-utils'

const logger = createLogger('script.westernunion-probe')
const corridors = getHealthCorridors('westernunion')

const main = async () => {
  const runner = createProbeRunner({
    providerId: 'westernunion',
    corridors,
    timeoutMs: Number(process.env.PROBE_TIMEOUT_MS) || 300000,
    retries: Number(process.env.PROBE_RETRIES) || 0,
  })

  const result = await runner.run(async () => {
    return await runWesternUnionCollector({
      collectorType: 'health_probe',
      corridors,
      amountBuckets: [100],
      payinMethod: 'bank_transfer',
      payoutMethod: 'bank_deposit',
      locale: 'en-US',
      delayMs: config.planeB.westernunion.delayMs,
      jitterMs: config.planeB.westernunion.jitterMs,
      corridorDelayMs: config.planeB.westernunion.corridorDelayMs,
      corridorJitterMs: config.planeB.westernunion.corridorJitterMs,
      rateLimitBackoffMs: config.planeB.westernunion.rateLimitBackoffMs,
      rateLimitJitterMs: config.planeB.westernunion.rateLimitJitterMs,
      rateLimitMaxRetries: config.planeB.westernunion.rateLimitMaxRetries,
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
