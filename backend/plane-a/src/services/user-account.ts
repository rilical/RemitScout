import { Pool } from 'pg'
import { AuthUser } from '../auth/types'
import { recordBusinessMetric } from '../../../shared/business-metrics'
import { config } from '../../../shared/config'
import { UserAccountRepository } from '../repositories'

type AppRole = 'user' | 'admin' | 'super_admin'

const toAppRole = (value: unknown): AppRole | null => {
  if (value === 'user' || value === 'admin' || value === 'super_admin') {
    return value
  }
  return null
}

const getRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

const resolveAppRoleFromClaims = (claims: Record<string, unknown> | undefined): AppRole | null => {
  if (!claims) return null

  const direct = toAppRole(claims.app_role)
  if (direct) return direct

  const appMetadata = getRecord(claims.app_metadata)
  const appMetadataRole = toAppRole(appMetadata?.app_role) ?? toAppRole(appMetadata?.role)
  if (appMetadataRole) return appMetadataRole

  return toAppRole(claims.role)
}

const resolveAllowlistedAdminRole = (email: string | null): AppRole | null => {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  if (config.planeA.adminEmails.includes(normalized)) {
    return 'admin'
  }

  const [, domain] = normalized.split('@')
  if (!domain) return null
  if (config.planeA.adminEmailDomains.includes(domain)) {
    return 'admin'
  }
  return null
}

export const upsertUserAccount = async (pool: Pool, user: AuthUser) => {
  const email = user.email || null
  const appRoleFromClaims = resolveAppRoleFromClaims(user.claims)
  const appRole = appRoleFromClaims ?? resolveAllowlistedAdminRole(email)
  const repo = new UserAccountRepository(pool)
  const result = await repo.upsertUserAccount({ user_id: user.user_id, email, app_role: appRole })
  if (result.created) {
    recordBusinessMetric('user_signups_total', 1)
  }
}
