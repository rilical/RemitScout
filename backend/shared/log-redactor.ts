const DEFAULT_SENSITIVE_KEYS = new Set([
  'password',
  'current_password',
  'new_password',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'secret',
  'webhook_secret',
  'api_key',
  'apikey',
  'x-api-key',
  'authorization',
  'cookie',
  'set-cookie',
])

const REDACTED = '[REDACTED]'

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
}

export const redactSensitive = (
  input: unknown,
  options?: { sensitiveKeys?: Iterable<string>; maxDepth?: number },
): unknown => {
  const sensitiveKeys = new Set(
    Array.from(options?.sensitiveKeys ?? DEFAULT_SENSITIVE_KEYS).map((k) => k.toLowerCase()),
  )
  const maxDepth = Math.max(0, Math.floor(options?.maxDepth ?? 6))

  const walk = (value: unknown, depth: number): unknown => {
    if (depth > maxDepth) return value
    if (value === null || value === undefined) return value
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value
    }
    if (Array.isArray(value)) {
      return value.map((item) => walk(item, depth + 1))
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      }
    }
    if (!isPlainObject(value)) {
      return value
    }
    const out: Record<string, unknown> = {}
    for (const [rawKey, rawVal] of Object.entries(value)) {
      const key = rawKey.toLowerCase()
      if (sensitiveKeys.has(key)) {
        out[rawKey] = REDACTED
        continue
      }
      out[rawKey] = walk(rawVal, depth + 1)
    }
    return out
  }

  return walk(input, 0)
}

