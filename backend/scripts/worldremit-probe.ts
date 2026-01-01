import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { WORLDREMIT_HEALTH_CORRIDORS } from '../shared/worldremit-corridors'
import { runWorldRemitCollector } from '../plane-b/src/providers/worldremit/collector'

const logger = createLogger('script.worldremit-probe')

const main = async () => {
  const ok = await runWorldRemitCollector({
    collectorType: 'health_probe',
    corridors: WORLDREMIT_HEALTH_CORRIDORS,
    amountBuckets: [100],
    payinMethod: 'bank_transfer',
    payoutMethod: 'bank_deposit',
    locale: 'en-US',
    delayMs: config.planeB.remitly.delayMs,
    jitterMs: config.planeB.remitly.jitterMs,
    corridorDelayMs: config.planeB.remitly.corridorDelayMs,
    corridorJitterMs: config.planeB.remitly.corridorJitterMs,
    rateLimitBackoffMs: config.planeB.remitly.rateLimitBackoffMs,
    rateLimitJitterMs: config.planeB.remitly.rateLimitJitterMs,
    rateLimitMaxRetries: config.planeB.remitly.rateLimitMaxRetries,
  })

  logger.info('probe_complete', { status: ok ? 'success' : 'blocked' })
  process.exit(ok ? 0 : 1)
}

main().catch((error) => {
  logger.error('probe_failed', { error })
  process.exit(1)
})
