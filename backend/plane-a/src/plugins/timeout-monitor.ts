import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.timeout-monitor')

const LAMBDA_TIMEOUT_WARNING_MS = 5000 // Warn if operation takes > 5 seconds
const LAMBDA_MAX_TIMEOUT_MS = 28000 // Lambda max is 30s, warn at 28s

/**
 * Monitor request duration and log warnings for slow operations
 * Helps identify routes that may timeout in Lambda
 */
export const setupTimeoutMonitor = (app: FastifyInstance): void => {
  app.addHook('onRequest', async (request: FastifyRequest) => {
    request.startTime = Date.now()
  })

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = (request as { startTime?: number }).startTime
    if (!startTime) return

    const duration = Date.now() - startTime

    if (duration > LAMBDA_MAX_TIMEOUT_MS) {
      logger.error('request_near_timeout', {
        method: request.method,
        url: request.url,
        duration_ms: duration,
        status_code: reply.statusCode,
        user_id: (request.user as { user_id?: string })?.user_id,
        message: 'Request duration exceeds Lambda timeout warning threshold',
      })
    } else if (duration > LAMBDA_TIMEOUT_WARNING_MS) {
      logger.warn('request_slow', {
        method: request.method,
        url: request.url,
        duration_ms: duration,
        status_code: reply.statusCode,
        user_id: (request.user as { user_id?: string })?.user_id,
        message: 'Request duration exceeds 5 seconds - consider optimization',
      })
    }
  })
}



