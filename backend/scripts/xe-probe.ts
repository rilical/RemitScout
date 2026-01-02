import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { getHealthCorridors } from '../shared/health-corridors'
import { runXeCollector } from '../plane-b/src/providers/xe/collector'
import { httpLimits } from '../plane-b/src/providers/xe/limits'
import { createProbeRunner, outputProbeResult } from './lib/probe-utils'

const logger = createLogger('script.xe-probe')
const corridors = getHealthCorridors('xe')

const main = async () => {
  const runner = createProbeRunner({
    providerId: 'xe',
    corridors,
    timeoutMs: Number(process.env.PROBE_TIMEOUT_MS) || 300000,
    retries: Number(process.env.PROBE_RETRIES) || 0,
  })

  const result = await runner.run(async () => {
    return await runXeCollector({
      collectorType: 'health_probe',
      corridors,
      amountBuckets: [100],
      payinMethod: 'bank_transfer',
      payoutMethod: 'bank_deposit',
      locale: 'en-US',
      delayMs: config.planeB.xe.delayMs,
      jitterMs: config.planeB.xe.jitterMs,
      corridorDelayMs: config.planeB.xe.corridorDelayMs,
      corridorJitterMs: config.planeB.xe.corridorJitterMs,
      rateLimitBackoffMs: config.planeB.xe.rateLimitBackoffMs,
      rateLimitJitterMs: config.planeB.xe.rateLimitJitterMs,
      rateLimitMaxRetries: config.planeB.xe.rateLimitMaxRetries,
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
