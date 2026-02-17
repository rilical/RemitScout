import type { Span } from '@opentelemetry/api'
import type { AuthError, AuthUser } from '../auth/types'
import type { ApiKeyContext } from '../services/api-keys'
import type { InstitutionalClientContext } from '../services/institutional-clients'
import type { Entitlements, PlanCode } from '../services/entitlements'
import type { PlaneAContainer } from '../container'

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser
    authError?: AuthError
    accountDeleted?: boolean
    apiKey?: ApiKeyContext
    apiKeyError?: { code: string; message: string }
    institutionalClient?: InstitutionalClientContext
    entitlementsContext?: { planCode: PlanCode; entitlements: Entitlements }
    traceId?: string
    span?: Span
    startTime?: number
  }

  interface FastifyInstance {
    container: PlaneAContainer
  }
}
