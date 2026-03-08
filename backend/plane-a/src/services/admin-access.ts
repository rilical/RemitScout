import type { Pool, PoolClient } from 'pg'
import { config } from '../../../shared/config'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'
import { getErrorMessage } from '../types/errors'

const logger = createLogger('plane-a.admin-access')

export type AdminAccessInput = {
  pool: Pool | PoolClient
  userId: string
  email?: string | null
  supabaseRole?: string | null
}

export type AdminAccessResult = {
  appRole: string | null
  email: string | null
  hasAdminRole: boolean
  allowlisted: boolean
  requireAllowlist: boolean
  hasAllowlistConfigured: boolean
  allowed: boolean
  denyReason?:
    | 'admin_role_required'
    | 'admin_allowlist_required_but_unconfigured'
    | 'admin_allowlist_denied'
}

const normalizeEmail = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim().toLowerCase()
  return trimmed || null
}

const resolveDomainAllowed = (email: string | null, allowlist: readonly string[]) => {
  if (!email) return false
  const [, domain] = email.split('@')
  if (!domain) return false
  return allowlist.includes(domain)
}

export const resolveAdminAccess = async (input: AdminAccessInput): Promise<AdminAccessResult> => {
  const inputEmail = normalizeEmail(input.email)
  const allowlist = config.planeA.adminEmails
  const domainAllowlist = config.planeA.adminEmailDomains
  const hasAllowlistConfigured = allowlist.length > 0 || domainAllowlist.length > 0
  const requireAllowlist = config.planeA.adminRequireAllowlist || config.planeA.adminAllowlistStrict

  let appRole: string | null = null
  let storedEmail: string | null = null
  try {
    const result = await query<{ app_role: string | null, email: string | null }>(
      `SELECT app_role, email FROM silver.user_account WHERE user_id = $1`,
      [input.userId],
      input.pool,
    )
    appRole = result.rows[0]?.app_role ?? null
    storedEmail = normalizeEmail(result.rows[0]?.email ?? null)
  }
  catch (error) {
    logger.warn('admin_role_lookup_failed', {
      user_id: input.userId,
      error: getErrorMessage(error),
    })
  }

  const email = inputEmail ?? storedEmail

  const hasAdminRole =
    input.supabaseRole === 'admin'
    || input.supabaseRole === 'super_admin'
    || appRole === 'admin'
    || appRole === 'super_admin'

  if (!hasAdminRole) {
    return {
      appRole,
      email,
      hasAdminRole,
      allowlisted: false,
      requireAllowlist,
      hasAllowlistConfigured,
      allowed: false,
      denyReason: 'admin_role_required',
    }
  }

  const allowlisted = Boolean(email && allowlist.includes(email)) || resolveDomainAllowed(email, domainAllowlist)

  if (requireAllowlist && !hasAllowlistConfigured) {
    return {
      appRole,
      email,
      hasAdminRole,
      allowlisted,
      requireAllowlist,
      hasAllowlistConfigured,
      allowed: false,
      denyReason: 'admin_allowlist_required_but_unconfigured',
    }
  }

  if ((hasAllowlistConfigured || requireAllowlist) && !allowlisted) {
    return {
      appRole,
      email,
      hasAdminRole,
      allowlisted,
      requireAllowlist,
      hasAllowlistConfigured,
      allowed: false,
      denyReason: 'admin_allowlist_denied',
    }
  }

  return {
    appRole,
    email,
    hasAdminRole,
    allowlisted,
    requireAllowlist,
    hasAllowlistConfigured,
    allowed: true,
  }
}
