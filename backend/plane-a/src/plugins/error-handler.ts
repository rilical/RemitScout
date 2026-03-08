import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import { AppError } from '../../../shared/errors'
import { captureExceptionWithContext } from '../../../shared/error-tracker'
import {
  getErrorMessage,
  getErrorStack,
  createApiError,
  isDatabaseError,
  isStripeError,
} from '../types/errors'

const logger = createLogger('plane-a.error-handler')

const stripQuery = (url: string): string => url.split('?')[0] || url

const getSentry4xxSampleRate = (): number => {
  const explicit = config.planeA.sentryCaptureRate4xx
  if (explicit !== null) {
    return explicit
  }
  // Capturing every 4xx can get noisy; default to a lower rate in prod.
  return config.env === 'production' ? 0.25 : 1
}

const shouldCapture4xx = (): boolean => {
  const rate = getSentry4xxSampleRate()
  if (rate <= 0) return false
  if (rate >= 1) return true
  return Math.random() < rate
}

const safeQueryKeys = (request: FastifyRequest): string[] => {
  const query = (request as unknown as { query?: unknown }).query
  if (!query || typeof query !== 'object') return []
  const keys = Object.keys(query as Record<string, unknown>)
  // Only report keys, never values, to avoid PII leakage (emails in query params, etc).
  return keys.slice(0, 25)
}

const captureRequestErrorToSentry = (params: {
  error: unknown
  request: FastifyRequest
  statusCode: number
  errorCode: string
}): void => {
  if (params.statusCode < 400) return
  if (params.statusCode < 500 && !shouldCapture4xx()) return

  const path = stripQuery(params.request.url)
  const route = params.request.routeOptions?.url || path
  const userId = (params.request.user as { user_id?: string } | undefined)?.user_id ?? null

  const err =
    params.error instanceof Error
      ? params.error
      : new Error(getErrorMessage(params.error) || 'request_error')

  // Fire-and-forget: never block API responses on network IO.
  void captureExceptionWithContext(
    err,
    {
      request_id: params.request.id,
      method: params.request.method,
      path,
      route,
      status_code: params.statusCode,
      error_code: params.errorCode,
      user_id: userId,
      query_keys: safeQueryKeys(params.request),
    },
    {
      plane: 'plane-a',
      http_status: String(params.statusCode),
      method: params.request.method,
      route,
      error_code: params.errorCode,
      // Avoid high-cardinality tags (full URL, request_id, user_id) in tags.
    },
  )
}

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
      captureRequestErrorToSentry({
        error,
        request,
        statusCode: error.statusCode,
        errorCode: error.code,
      })
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
      captureRequestErrorToSentry({
        error,
        request,
        statusCode: 500,
        errorCode: 'database_error',
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
      captureRequestErrorToSentry({
        error,
        request,
        statusCode: 500,
        errorCode: 'payment_error',
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
      captureRequestErrorToSentry({
        error,
        request,
        statusCode: 400,
        errorCode: 'validation_error',
      })
      reply.code(400)
      return createApiError('validation_error', 'Invalid request parameters', error)
    }

    // Handle Fastify HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = Number(error.statusCode) || 500
      captureRequestErrorToSentry({
        error,
        request,
        statusCode,
        errorCode: 'http_error',
      })
      reply.code(statusCode)
      return createApiError(
        'http_error',
        errorMessage,
        statusCode >= 500 && config.env === 'production' ? undefined : error,
      )
    }

    // Default error response
    captureRequestErrorToSentry({
      error,
      request,
      statusCode: 500,
      errorCode: 'internal_error',
    })
    reply.code(500)
    return createApiError(
      'internal_error',
      config.env === 'production'
        ? 'An unexpected error occurred'
        : errorMessage,
    )
  })
}
