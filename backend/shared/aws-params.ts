import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

import { createLogger } from './logger'

export type AwsEnvSource = {
  envVar: string
  secretArnEnv?: string
  ssmNameEnv?: string
  jsonKeys?: string[]
  required?: boolean
}

export type ProxyUrlSource = {
  envVar: string
  secretArnEnv?: string
  ssmNameEnv?: string
  jsonKey?: string
  required?: boolean
}

export type DatabaseEnvSource = AwsEnvSource & {
  hostEnv?: string
  portEnv?: string
  nameEnv?: string
  usernameEnv?: string
  passwordEnv?: string
  usernameKeys?: string[]
  passwordKeys?: string[]
  hostKeys?: string[]
  portKeys?: string[]
  nameKeys?: string[]
  requireJson?: boolean
  sslModeEnv?: string
  sslMode?: string
}

const logger = createLogger('shared.aws-params')

// Cache for parameter values with TTL
type CacheEntry = {
  value: string
  expiresAt: number
}

const secretCache = new Map<string, CacheEntry>()
const ssmCache = new Map<string, CacheEntry>()

// Cache TTLs (in milliseconds)
const SECRET_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const SSM_CACHE_TTL = 1 * 60 * 1000 // 1 minute

// Client reuse per Lambda execution context
let secretsClient: SecretsManagerClient | null = null
let ssmClient: SSMClient | null = null

// Lambda execution context ID (changes per invocation)
const getLambdaContextId = (): string => {
  return process.env.AWS_REQUEST_ID || process.env.AWS_LAMBDA_REQUEST_ID || 'default'
}

const getSecretsClient = () => {
  // Reuse client across invocations in same Lambda container
  if (!secretsClient) {
    secretsClient = new SecretsManagerClient({
      requestHandler: {
        requestTimeout: 5000, // 5s timeout
      },
    })
  }
  return secretsClient
}

const getSsmClient = () => {
  // Reuse client across invocations in same Lambda container
  if (!ssmClient) {
    ssmClient = new SSMClient({
      requestHandler: {
        requestTimeout: 3000, // 3s timeout
      },
    })
  }
  return ssmClient
}

// Retry with exponential backoff
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 100,
): Promise<T> => {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
        logger.debug('aws_api_retry', {
          attempt: attempt + 1,
          max_retries: maxRetries,
          delay_ms: delay,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }
  throw lastError
}

const parseSecretValue = (raw: string, jsonKeys?: string[]): string => {
  if (!jsonKeys || jsonKeys.length === 0) {
    return raw
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>
    for (const key of jsonKeys) {
      const value = parsed[key]
      if (typeof value === 'string' && value.trim()) {
        return value
      }
    }
  } catch {
    // Fall back to raw secret value if not JSON.
  }

  return raw
}

const parseSecretJson = (raw: string): Record<string, string> | null => {
  try {
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed
  } catch {
    return null
  }
}

const pickJsonValue = (
  parsed: Record<string, string>,
  keys: string[] | undefined,
): string | undefined => {
  if (!keys || keys.length === 0) return undefined
  for (const key of keys) {
    const value = parsed[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return undefined
}

const buildDatabaseUrl = (
  username: string,
  password: string,
  host: string,
  port: string,
  dbName: string,
  sslMode?: string,
): string => {
  const encodedUser = encodeURIComponent(username)
  const encodedPass = encodeURIComponent(password)
  const baseUrl = `postgresql://${encodedUser}:${encodedPass}@${host}:${port}/${dbName}`
  if (sslMode && sslMode.trim()) {
    const delimiter = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${delimiter}sslmode=${encodeURIComponent(sslMode.trim())}`
  }
  return baseUrl
}

const loadSecretValue = async (secretArn: string): Promise<string | null> => {
  // Check cache first
  const cacheKey = `${getLambdaContextId()}:${secretArn}`
  const cached = secretCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    logger.debug('secret_cache_hit', { secret_arn: secretArn })
    return cached.value
  }

  try {
    const client = getSecretsClient()
    const response = await withRetry(
      () => client.send(new GetSecretValueCommand({ SecretId: secretArn })),
      3,
      100,
    )

    let value: string | null = null
    if (response.SecretString) {
      value = response.SecretString
    } else if (response.SecretBinary) {
      value = Buffer.from(response.SecretBinary as Uint8Array).toString('utf8')
    }

    // Cache the value
    if (value) {
      secretCache.set(cacheKey, {
        value,
        expiresAt: Date.now() + SECRET_CACHE_TTL,
      })
    }

    return value
  } catch (error) {
    logger.error('secret_fetch_failed', {
      secret_arn: secretArn,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

const loadSsmValue = async (name: string): Promise<string | null> => {
  // Check cache first
  const cacheKey = `${getLambdaContextId()}:${name}`
  const cached = ssmCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    logger.debug('ssm_cache_hit', { parameter_name: name })
    return cached.value
  }

  try {
    const client = getSsmClient()
    const response = await withRetry(
      () => client.send(new GetParameterCommand({ Name: name, WithDecryption: true })),
      3,
      100,
    )

    const value = response.Parameter?.Value ?? null

    // Cache the value
    if (value) {
      ssmCache.set(cacheKey, {
        value,
        expiresAt: Date.now() + SSM_CACHE_TTL,
      })
    }

    return value
  } catch (error) {
    logger.error('ssm_fetch_failed', {
      parameter_name: name,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export const resolveAwsEnv = async (sources: AwsEnvSource[]): Promise<void> => {
  for (const source of sources) {
    if (process.env[source.envVar]) {
      continue
    }

    const secretArn = source.secretArnEnv ? process.env[source.secretArnEnv] : undefined
    if (secretArn) {
      const raw = await loadSecretValue(secretArn)
      if (raw) {
        process.env[source.envVar] = parseSecretValue(raw, source.jsonKeys)
        continue
      }
    }

    const ssmName = source.ssmNameEnv ? process.env[source.ssmNameEnv] : undefined
    if (ssmName) {
      const raw = await loadSsmValue(ssmName)
      if (raw) {
        process.env[source.envVar] = raw
      }
    }

    if (source.required && !process.env[source.envVar]) {
      throw new Error(`Missing required environment variable: ${source.envVar}`)
    }
  }
}

/**
 * Resolves proxy URL from environment variable, Secrets Manager, or SSM Parameter Store.
 * Validates that the URL is a valid HTTP/HTTPS URL.
 */
export const resolveProxyUrl = async (source: ProxyUrlSource): Promise<string | null> => {
  // Check environment variable first
  if (process.env[source.envVar]) {
    const url = process.env[source.envVar]
    if (url && isValidUrl(url)) {
      return url
    }
    logger.warn('proxy_url_invalid_format', {
      env_var: source.envVar,
      url: url?.substring(0, 50), // Log first 50 chars only
    })
  }

  // Try Secrets Manager
  const secretArn = source.secretArnEnv ? process.env[source.secretArnEnv] : undefined
  if (secretArn) {
    const raw = await loadSecretValue(secretArn)
    if (raw) {
      let url: string | undefined
      if (source.jsonKey) {
        try {
          const parsed = JSON.parse(raw) as Record<string, string>
          url = parsed[source.jsonKey]
        } catch {
          // If not JSON, try raw value
          url = raw
        }
      } else {
        url = raw
      }
      if (url && isValidUrl(url)) {
        process.env[source.envVar] = url
        return url
      }
    }
  }

  // Try SSM Parameter Store
  const ssmName = source.ssmNameEnv ? process.env[source.ssmNameEnv] : undefined
  if (ssmName) {
    const raw = await loadSsmValue(ssmName)
    if (raw && isValidUrl(raw)) {
      process.env[source.envVar] = raw
      return raw
    }
  }

  if (source.required && !process.env[source.envVar]) {
    throw new Error(`Missing required proxy URL: ${source.envVar}`)
  }

  return null
}

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export const resolveDatabaseUrl = async (source: DatabaseEnvSource): Promise<void> => {
  if (process.env[source.envVar]) {
    return
  }

  const envHost = source.hostEnv ? process.env[source.hostEnv] : undefined
  const envPort = source.portEnv ? process.env[source.portEnv] : undefined
  const envName = source.nameEnv ? process.env[source.nameEnv] : undefined
  const envUser = source.usernameEnv ? process.env[source.usernameEnv] : undefined
  const envPassword = source.passwordEnv ? process.env[source.passwordEnv] : undefined
  const sslMode =
    source.sslMode ??
    (source.sslModeEnv ? process.env[source.sslModeEnv] : undefined) ??
    process.env.DB_SSL_MODE ??
    process.env.PGSSLMODE

  if (envHost && envPort && envName && envUser && envPassword) {
    process.env[source.envVar] = buildDatabaseUrl(
      envUser,
      envPassword,
      envHost,
      envPort,
      envName,
      sslMode,
    )
    return
  }

  const secretArn = source.secretArnEnv ? process.env[source.secretArnEnv] : undefined
  if (secretArn) {
    const raw = await loadSecretValue(secretArn)
    if (raw) {
      const parsed = parseSecretJson(raw)
      if (parsed) {
        if (!source.requireJson) {
          const url =
            pickJsonValue(parsed, source.jsonKeys) ??
            pickJsonValue(parsed, [source.envVar])
          if (url) {
            process.env[source.envVar] = url
            return
          }
        }

        const username =
          pickJsonValue(parsed, source.usernameKeys) ??
          pickJsonValue(parsed, ['username', 'user'])
        const password =
          pickJsonValue(parsed, source.passwordKeys) ??
          pickJsonValue(parsed, ['password', 'pass'])
        const host =
          pickJsonValue(parsed, source.hostKeys ?? ['host', 'hostname']) ??
          envHost
        const port =
          pickJsonValue(parsed, source.portKeys ?? ['port']) ??
          envPort
        const name =
          pickJsonValue(parsed, source.nameKeys ?? ['dbname', 'database', 'db_name', 'name']) ??
          envName

        if (username && password && host && port && name) {
          process.env[source.envVar] = buildDatabaseUrl(
            username,
            password,
            host,
            port,
            name,
            sslMode,
          )
          return
        }

        logger.warn('db_url_build_failed', {
          env_var: source.envVar,
          secret_arn: secretArn,
          missing: {
            username: Boolean(username),
            password: Boolean(password),
            host: Boolean(host),
            port: Boolean(port),
            name: Boolean(name),
          },
        })
      } else if (!source.requireJson) {
        process.env[source.envVar] = raw
        return
      }
    }

    if (source.requireJson) {
      throw new Error(`Database secret is missing JSON fields for ${source.envVar}`)
    }
  }

  const ssmName = source.ssmNameEnv ? process.env[source.ssmNameEnv] : undefined
  if (ssmName) {
    const raw = await loadSsmValue(ssmName)
    if (raw) {
      process.env[source.envVar] = raw
    }
  }

  if (source.required && !process.env[source.envVar]) {
    throw new Error(`Missing required database URL: ${source.envVar}`)
  }
}
