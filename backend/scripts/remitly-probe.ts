import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { REMITLY_HEALTH_CORRIDORS } from '../shared/remitly-corridors'
import { runRemitlyCollector } from '../plane-b/src/providers/remitly/collector'

const logger = createLogger('script.remitly-probe')

const main = async () => {
  const ok = await runRemitlyCollector({
    collectorType: 'health_probe',
    corridors: REMITLY_HEALTH_CORRIDORS,
    amountBuckets: [100],
    payinMethod: 'debit_card',
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
