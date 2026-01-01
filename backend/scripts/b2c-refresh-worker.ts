import { processQuoteRefreshQueue } from '../plane-b/src/quote-refresh'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const limit = toNumber(process.env.B2C_REFRESH_LIMIT, config.planeB.b2cRefreshBatchLimit)
const logger = createLogger('script.b2c-refresh-worker')

processQuoteRefreshQueue({ limit })
  .then((count) => {
    logger.info('worker_complete', { processed_count: count })
    process.exit(0)
  })
  .catch((error) => {
    logger.error('worker_failed', { error })
    process.exit(1)
  })
