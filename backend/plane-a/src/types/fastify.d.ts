import type { Span } from '@opentelemetry/api'
import type { AuthError, AuthUser } from '../auth/types'

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser
    authError?: AuthError
    traceId?: string
    span?: Span
    startTime?: number
  }
}
