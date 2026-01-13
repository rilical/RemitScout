/**
 * Error handling utilities for consistent error processing across the application.
 */

/**
 * Type guard to check if an unknown value is an Error instance.
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Formats an unknown error into a consistent structure.
 * Handles Error instances, strings, and other types.
 */
export function formatError(error: unknown): { message: string; stack?: string } {
  if (isError(error)) {
    return {
      message: error.message || 'Unknown error',
      stack: error.stack,
    }
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = typeof error.message === 'string' ? error.message : String(error.message)
    const stack = 'stack' in error && typeof error.stack === 'string' ? error.stack : undefined
    return { message, stack }
  }

  return { message: String(error ?? 'Unknown error') }
}

/**
 * Extracts error message from unknown error.
 */
export function getErrorMessage(error: unknown): string {
  return formatError(error).message
}

/**
 * Extracts error stack from unknown error, if available.
 */
export function getErrorStack(error: unknown): string | undefined {
  return formatError(error).stack
}




