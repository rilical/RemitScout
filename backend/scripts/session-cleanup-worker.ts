/**
 * Session Cleanup Worker - revoke expired or inactive sessions.
 *
 * Usage:
 *   pnpm -C backend sessions:cleanup
 */

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { createShutdownHandler } from '../shared/shutdown'
import { SessionRepository } from '../plane-a/src/repositories'
import { processPendingAccountDeletions } from '../plane-a/src/services/account-deletion-requests'

const logger = createLogger('script.session-cleanup')
initTracing('session-cleanup-worker')
const { isShutdownRequested } = createShutdownHandler({ logger })

export const runSessionCleanup = async (): Promise<void> => {
  const pool = createPool(config.db.planeAUrl)
  const repo = new SessionRepository(pool)
  const start = Date.now()

  try {
    if (isShutdownRequested()) {
      logger.warn('session_cleanup_skipped', { reason: 'shutdown_requested' })
      return
    }
    const revoked = await repo.revokeExpiredSessions()
    const deletionsProcessed = await processPendingAccountDeletions({ limit: 50 })
    const durationMs = Date.now() - start
    logger.info('session_cleanup_complete', {
      revoked_count: revoked,
      account_deletions_processed: deletionsProcessed,
      duration_ms: durationMs,
    })
  } catch (error) {
    logger.error('session_cleanup_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    await pool.end()
  }
}

runSessionCleanup()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('session_cleanup_failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  })
