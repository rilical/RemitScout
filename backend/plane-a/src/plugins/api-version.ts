import type { FastifyInstance } from 'fastify'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.api-version')

/**
 * Date-based API versioning plugin (Stripe/Twilio pattern).
 *
 * Adds `X-API-Version` response header to all responses.
 * Logs `Accept-Version` request header when clients send it
 * (ignored for now — version negotiation is a future feature).
 */
const API_VERSION = '2026-03-01'

export const apiVersionPlugin = (app: FastifyInstance) => {
  app.addHook('onSend', async (request, reply) => {
    reply.header('X-API-Version', API_VERSION)

    const acceptVersion = request.headers['accept-version']
    if (acceptVersion) {
      const version = Array.isArray(acceptVersion) ? acceptVersion[0] : acceptVersion
      logger.debug('accept_version_header_received', {
        accept_version: version,
        path: request.url.split('?')[0],
      })
    }
  })
}
