export type AppErrorOptions = {
  statusCode: number
  code: string
  cause?: unknown
  details?: unknown
}

/**
 * Base application error.
 *
 * Contract:
 * - `statusCode` is the HTTP status code to return (Plane A) or the semantic status (workers).
 * - `code` is a stable, machine-readable error identifier.
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly cause?: unknown
  public readonly details?: unknown

  constructor(message: string, options: AppErrorOptions) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = options.statusCode
    this.code = options.code
    this.cause = options.cause
    this.details = options.details
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Invalid request', options?: { cause?: unknown; details?: unknown }) {
    super(message, { statusCode: 400, code: 'validation_error', cause: options?.cause, details: options?.details })
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', options?: { cause?: unknown; details?: unknown }) {
    super(message, { statusCode: 401, code: 'authentication_error', cause: options?.cause, details: options?.details })
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden', options?: { cause?: unknown; details?: unknown }) {
    super(message, { statusCode: 403, code: 'authorization_error', cause: options?.cause, details: options?.details })
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found', options?: { cause?: unknown; details?: unknown }) {
    super(message, { statusCode: 404, code: 'not_found', cause: options?.cause, details: options?.details })
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', options?: { cause?: unknown; details?: unknown }) {
    super(message, { statusCode: 409, code: 'conflict', cause: options?.cause, details: options?.details })
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', options?: { cause?: unknown; details?: unknown }) {
    super(message, { statusCode: 429, code: 'rate_limited', cause: options?.cause, details: options?.details })
  }
}

export class CircuitBreakerOpenError extends AppError {
  constructor(repositoryName: string, options?: { cause?: unknown; details?: unknown }) {
    super(`Circuit breaker is open for ${repositoryName}`, {
      statusCode: 503,
      code: 'circuit_breaker_open',
      cause: options?.cause,
      details: options?.details,
    })
  }
}
