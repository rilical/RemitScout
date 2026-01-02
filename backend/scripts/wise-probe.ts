import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { getHealthCorridors } from '../shared/health-corridors'
import { runWiseCollector } from '../plane-b/src/providers/wise/collector'
import { httpLimits } from '../plane-b/src/providers/wise/limits'
import { createProbeRunner, outputProbeResult } from './lib/probe-utils'

const logger = createLogger('script.wise-probe')
const corridors = getHealthCorridors('wise')

const main = async () => {
  const runner = createProbeRunner({
    providerId: 'wise',
    corridors,
    timeoutMs: Number(process.env.PROBE_TIMEOUT_MS) || 300000,
    retries: Number(process.env.PROBE_RETRIES) || 0,
  })

  const result = await runner.run(async () => {
    return await runWiseCollector({
      collectorType: 'health_probe',
      corridors,
      amountBuckets: [100],
      payinMethod: 'bank_transfer',
      payoutMethod: 'bank_deposit',
      locale: 'en-US',
      delayMs: config.planeB.wise.delayMs,
      jitterMs: config.planeB.wise.jitterMs,
      corridorDelayMs: config.planeB.wise.corridorDelayMs,
      corridorJitterMs: config.planeB.wise.corridorJitterMs,
      rateLimitBackoffMs: config.planeB.wise.rateLimitBackoffMs,
      rateLimitJitterMs: config.planeB.wise.rateLimitJitterMs,
      rateLimitMaxRetries: config.planeB.wise.rateLimitMaxRetries,
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
