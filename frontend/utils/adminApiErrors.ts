type ErrorData = {
  error?: string
  code?: string | number
  message?: string
  details?: unknown
}

type ErrorLike = {
  message?: string
  data?: ErrorData
  statusCode?: number
  response?: { status?: number }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object'

const extractDetailField = (details: unknown, key: 'error' | 'code' | 'message'): string | null => {
  if (!isRecord(details)) return null
  const value = details[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export const getAdminApiErrorMessage = (error: unknown, fallback: string): string => {
  const err = (isRecord(error) ? error : {}) as ErrorLike
  const data = (isRecord(err.data) ? err.data : {}) as ErrorData
  const statusCode
    = typeof err.statusCode === 'number'
      ? err.statusCode
      : isRecord(err.response) && typeof err.response.status === 'number'
        ? err.response.status
        : null
  const detailCode
    = extractDetailField(data.details, 'error') || extractDetailField(data.details, 'code')
  const detailMessage = extractDetailField(data.details, 'message')

  const codes = [data.code, data.error, detailCode]
    .filter((value): value is string | number => value !== undefined && value !== null)
    .map(value => String(value).trim())
    .filter(Boolean)

  if (codes.includes('revoked_token')) {
    return 'Admin session has been revoked. Sign in again to continue.'
  }
  if (codes.includes('mfa_required')) {
    return data.message || 'Multi-factor authentication is required for admin access.'
  }
  if (codes.includes('admin_ip_not_allowlisted')) {
    return 'This IP address is not allowlisted for the admin surface.'
  }
  if (codes.includes('admin_ip_unresolved')) {
    return 'Unable to verify the caller IP for admin access.'
  }
  if (codes.includes('admin_allowlist_denied')) {
    return 'Your account is not on the admin allowlist.'
  }
  if (codes.includes('admin_allowlist_required_but_unconfigured')) {
    return 'Admin access is blocked until the admin allowlist is configured.'
  }
  if (codes.includes('admin_role_required')) {
    return 'You do not have an admin role for this surface.'
  }
  if (codes.includes('super_admin_required')) {
    return 'Super-admin access is required for this action.'
  }
  if (codes.includes('institutional_launch_blocked')) {
    return (
      data.message
      || 'Institutional activation is blocked until the data-maturity gate is satisfied.'
    )
  }
  if (codes.includes('user_not_found')) {
    return detailMessage || 'No user found for that email address.'
  }
  if (codes.includes('forbidden') || codes.includes('authorization_error')) {
    return 'You do not have permission to access this admin surface.'
  }
  if (codes.includes('validation_error') || codes.includes('bad_request')) {
    return detailMessage || data.message || err.message || fallback
  }
  if ((statusCode ?? 0) >= 500) {
    return fallback
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim()
  }
  if (typeof err.message === 'string' && err.message.trim()) {
    if (/^\[[A-Z]+\]\s+"[^"]+":\s*\d{3}$/.test(err.message.trim())) {
      return fallback
    }
    return err.message.trim()
  }

  return fallback
}
