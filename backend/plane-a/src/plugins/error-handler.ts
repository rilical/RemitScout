import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import { AppError } from '../../../shared/errors'
import {
  getErrorMessage,
  getErrorStack,
  createApiError,
  isDatabaseError,
  isStripeError,
} from '../types/errors'

const logger = createLogger('plane-a.error-handler')

/**
 * Centralized error handler for Fastify
 * Handles errors consistently across all routes
 */
export const setupErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error: unknown, request: FastifyRequest, reply: FastifyReply) => {
    const errorMessage = getErrorMessage(error)
    const errorStack = getErrorStack(error)

    // Log the error
    logger.error('request_error', {
      method: request.method,
      url: request.url,
      user_id: (request.user as { user_id?: string })?.user_id,
      error: errorMessage,
      stack: errorStack,
    })

    if (error instanceof AppError) {
      reply.code(error.statusCode)
      return createApiError(
        error.code,
        errorMessage,
        error.details !== undefined
          ? error.details
          : config.env === 'production' && error.statusCode >= 500
            ? undefined
            : error,
      )
    }

    // Handle specific error types
    if (isDatabaseError(error)) {
      logger.error('database_error', {
        code: error.code,
        constraint: error.constraint,
        detail: error.detail,
      })
      reply.code(500)
      return createApiError(
        'database_error',
        config.env === 'production'
          ? 'A database error occurred'
          : errorMessage,
      )
    }

    if (isStripeError(error)) {
      logger.error('stripe_error', {
        type: error.type,
        code: error.code,
        decline_code: error.decline_code,
      })
      reply.code(500)
      return createApiError(
        'payment_error',
        config.env === 'production'
          ? 'A payment processing error occurred'
          : errorMessage,
      )
    }

    // Handle Fastify validation errors
    if (error && typeof error === 'object' && 'validation' in error) {
      reply.code(400)
      return createApiError('validation_error', 'Invalid request parameters', error)
    }

    // Handle Fastify HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = Number(error.statusCode) || 500
      reply.code(statusCode)
      return createApiError(
        'http_error',
        errorMessage,
        statusCode >= 500 && config.env === 'production' ? undefined : error,
      )
    }

    // Default error response
    reply.code(500)
    return createApiError(
      'internal_error',
      config.env === 'production'
        ? 'An unexpected error occurred'
        : errorMessage,
    )
  })
}


