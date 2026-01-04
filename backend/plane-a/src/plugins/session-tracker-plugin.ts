import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { SessionRepository } from '../repositories'
import {
  deriveSessionId,
  detectDeviceType,
  extractExpiresAt,
  getLocationFromHeaders,
} from '../services/session-utils'

const logger = createLogger('plane-a.session-tracker')
const pool = getPool(config.db.planeAUrl)
const repository = new SessionRepository(pool)

const shouldSkip = (path: string) => {
  const clean = path.split('?')[0]
  return (
    clean === '/healthz' ||
    clean === '/readyz' ||
    clean === '/metrics' ||
    clean.startsWith('/api/health') ||
    clean.startsWith('/api/ops')
  )
}

export const registerSessionTracker = (app: FastifyInstance) => {
  app.addHook('onRequest', async (request) => {
    if (request.method === 'OPTIONS') return
    if (!request.user) return
    if (shouldSkip(request.url)) return

    const sessionId = deriveSessionId(request)
    if (!sessionId) return

    const userAgent = request.headers['user-agent']
    const deviceType = detectDeviceType(typeof userAgent === 'string' ? userAgent : null)
    const location = getLocationFromHeaders(request.headers)
    const expiresAt = extractExpiresAt(request)

    try {
      await repository.createSession({
        sessionId,
        userId: request.user.user_id,
        ipAddress: request.ip,
        userAgent: typeof userAgent === 'string' ? userAgent : undefined,
        deviceType: deviceType ?? undefined,
        location: location ?? undefined,
        expiresAt: expiresAt ?? undefined,
      })
    } catch (error) {
      logger.warn('session_track_failed', {
        user_id: request.user.user_id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  })
}
