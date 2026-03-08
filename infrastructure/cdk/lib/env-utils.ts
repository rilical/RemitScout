export const collectOandaThrottleEnv = (): Record<string, string> => {
  const keys = [
    'OANDA_RPM',
    'OANDA_BURST_MULTIPLIER',
    'OANDA_RATE_LIMIT_MAX_RETRIES',
    'OANDA_RATE_LIMIT_BACKOFF_MS',
    'OANDA_RATE_LIMIT_BACKOFF_MAX_MS',
    'OANDA_RATE_LIMIT_JITTER_MS',
    'OANDA_FALLBACK_MAX_WAIT_MS',
  ]

  const env: Record<string, string> = {}
  for (const key of keys) {
    const value = process.env[key]
    if (value !== undefined) {
      env[key] = value
    }
  }
  return env
}

export const resolveAdminMfaRequiredEnv = (
  envName: string,
  rawValue = process.env.ADMIN_MFA_REQUIRED,
): string | undefined => {
  const normalizedEnv = envName.trim().toLowerCase()
  if (normalizedEnv === 'staging' || normalizedEnv === 'prod' || normalizedEnv === 'production') {
    return '1'
  }

  const normalized = (rawValue || '').trim().toLowerCase()
  if (!normalized) return undefined
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return '1'
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return '0'
  }
  return rawValue?.trim() || undefined
}

export const collectPlaneBProviderThrottleEnv = (): Record<string, string> => {
  const env: Record<string, string> = {}
  const patterns = [
    /_RPM$/,
    /_DELAY_MS$/,
    /_JITTER_MS$/,
    /_RATE_LIMIT_BACKOFF_MS$/,
    /_RATE_LIMIT_JITTER_MS$/,
    /_RATE_LIMIT_MAX_RETRIES$/,
    /_CORRIDOR_DELAY_MS$/,
    /_CORRIDOR_JITTER_MS$/,
    /_BLOCK_COOLDOWN_MS$/,
  ]

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('PLANE_B_') || value === undefined) continue
    if (patterns.some((pattern) => pattern.test(key))) {
      env[key] = value
    }
  }

  return env
}
