import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'

const logger = createLogger('plane-a.payload-size')

const API_GATEWAY_MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const PAYLOAD_WARNING_SIZE_BYTES = 5 * 1024 * 1024 // 5MB - warn before hitting limit

/**
 * Monitor and limit response payload sizes for API Gateway compatibility
 * API Gateway has a 10MB response size limit
 */
export const setupPayloadSizeMonitor = (app: FastifyInstance): void => {
  app.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
    if (!payload) return payload

    let payloadSize = 0
    let payloadString = ''

    if (typeof payload === 'string') {
      payloadString = payload
      payloadSize = Buffer.byteLength(payload, 'utf8')
    } else if (Buffer.isBuffer(payload)) {
      payloadSize = payload.length
    } else {
      // For objects, estimate JSON size
      try {
        payloadString = JSON.stringify(payload)
        payloadSize = Buffer.byteLength(payloadString, 'utf8')
      } catch {
        // If stringify fails, estimate based on object
        payloadSize = JSON.stringify(payload).length
      }
    }

    if (payloadSize > API_GATEWAY_MAX_SIZE_BYTES) {
      logger.error('payload_exceeds_limit', {
        method: request.method,
        url: request.url,
        size_bytes: payloadSize,
        max_bytes: API_GATEWAY_MAX_SIZE_BYTES,
        user_id: (request.user as { user_id?: string })?.user_id,
        message: 'Response payload exceeds API Gateway 10MB limit',
      })
      reply.code(500)
      return {
        error: 'payload_too_large',
        message: 'Response payload exceeds maximum size. Consider using pagination or filtering.',
      }
    }

    if (payloadSize > PAYLOAD_WARNING_SIZE_BYTES) {
      logger.warn('payload_large', {
        method: request.method,
        url: request.url,
        size_bytes: payloadSize,
        warning_threshold_bytes: PAYLOAD_WARNING_SIZE_BYTES,
        user_id: (request.user as { user_id?: string })?.user_id,
        message: 'Response payload is large - consider pagination',
      })
    }

    // Add size header for debugging
    if (config.env !== 'production') {
      reply.header('X-Response-Size-Bytes', String(payloadSize))
    }

    return payload
  })
}



