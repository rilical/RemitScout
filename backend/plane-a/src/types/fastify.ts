import type { Span } from '@opentelemetry/api'
import type { AuthError, AuthUser } from '../auth/types'
import type { PlaneAContainer } from '../container'
import type { ApiKeyAccessPolicy } from '../routes/api-key-access'
import type { ApiKeyContext } from '../services/api-keys'
import type { Entitlements, PlanCode } from '../services/entitlements'
import type { InstitutionalClientContext } from '../services/institutional-clients'
import type { PlanLifecycleState, PlanRecoveryAction } from '../services/plan-state'

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser
    authError?: AuthError
    accountDeleted?: boolean
    apiKeyPresented?: boolean
    apiKey?: ApiKeyContext
    userApiKey?: ApiKeyContext
    apiKeyError?: { code: string; message: string }
    institutionalClient?: InstitutionalClientContext
    entitlementsContext?: {
      planCode: PlanCode
      entitlements: Entitlements
      isPlanActive: boolean
      internalEnterpriseOverride: boolean
      lifecycleState: PlanLifecycleState
      recoveryAvailable: boolean
      recoveryAction: PlanRecoveryAction
      source: 'internal_admin_override' | 'stored_plan' | 'inactive_or_default'
    }
    traceId?: string
    span?: Span
    startTime?: number
  }

  interface FastifyInstance {
    container: PlaneAContainer
  }

  interface FastifyContextConfig {
    apiKeyAccess?: ApiKeyAccessPolicy
  }
}

export {}
