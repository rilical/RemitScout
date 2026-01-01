import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { WISE_HEALTH_CORRIDORS } from '../shared/wise-corridors'
import { runWiseCollector } from '../plane-b/src/providers/wise/collector'

const logger = createLogger('script.wise-probe')

const main = async () => {
  const ok = await runWiseCollector({
    collectorType: 'health_probe',
    corridors: WISE_HEALTH_CORRIDORS,
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
