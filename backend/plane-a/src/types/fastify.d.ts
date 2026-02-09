import type { Span } from '@opentelemetry/api'
import type { AuthError, AuthUser } from '../auth/types'
import type { ApiKeyContext } from '../services/api-keys'

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser
    authError?: AuthError
    accountDeleted?: boolean
    apiKey?: ApiKeyContext
    apiKeyError?: { code: string; message: string }
    traceId?: string
    span?: Span
    startTime?: number
  }
}
