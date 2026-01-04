/**
 * Session Cleanup Worker - revoke expired or inactive sessions.
 *
 * Usage:
 *   pnpm -C backend sessions:cleanup
 */

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { SessionRepository } from '../plane-a/src/repositories'

const logger = createLogger('script.session-cleanup')

export const runSessionCleanup = async (): Promise<void> => {
  const pool = createPool(config.db.planeAUrl)
  const repo = new SessionRepository(pool)
  const start = Date.now()

  try {
    const revoked = await repo.revokeExpiredSessions()
    const durationMs = Date.now() - start
    logger.info('session_cleanup_complete', {
      revoked_count: revoked,
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
