/**
 * Error type definitions for Plane A API
 */

export interface ApiError {
  error: string
  message?: string
  details?: unknown
  code?: string | number
}

export interface ValidationError extends ApiError {
  error: 'validation_error'
  details: Array<{
    field?: string
    message: string
    code?: string
  }>
}

export interface DatabaseError extends Error {
  code?: string
  constraint?: string
  detail?: string
}

export interface StripeError extends Error {
  type?: string
  code?: string
  decline_code?: string
  param?: string
}

/**
 * Type guard to check if error is a DatabaseError
 */
export const isDatabaseError = (error: unknown): error is DatabaseError => {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as DatabaseError).code === 'string'
  )
}

/**
 * Type guard to check if error is a StripeError
 */
export const isStripeError = (error: unknown): error is StripeError => {
  return (
    error instanceof Error &&
    'type' in error &&
    typeof (error as StripeError).type === 'string'
  )
}

/**
 * Type guard to check if error is a standard Error
 */
export const isError = (error: unknown): error is Error => {
  return error instanceof Error
}

/**
 * Safely extract error message from unknown error
 */
export const getErrorMessage = (error: unknown): string => {
  if (isError(error)) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

/**
 * Safely extract error stack from unknown error
 */
export const getErrorStack = (error: unknown): string | undefined => {
  if (isError(error)) {
    return error.stack
  }
  return undefined
}

/**
 * Create a standardized API error response
 */
export const createApiError = (
  error: string,
  message?: string,
  details?: unknown,
): ApiError => {
  return {
    error,
    ...(message && { message }),
    ...(details && { details }),
  }
}



