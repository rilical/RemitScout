import { createLogger } from './logger'
import { assertAwsConfig, type ValidationOptions } from './aws-config-validator'
import { auditConfig } from './config-audit'
import { validateConfigOrDie } from './config-schema'
import { assertRuntimeConfig, config, type RuntimeConfigRequirements } from './config'
import { createPool } from './db'
import { getRedisClient } from './redis'
import { emitOpsEvent } from './ops-events'
import { setTimeout as sleep } from 'timers/promises'

const logger = createLogger('shared.startup')

const checkDbConnectivity = async (databaseUrl: string): Promise<boolean> => {
  const pool = createPool(databaseUrl)
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('db_connectivity_timeout')), 2000)
    })
    await Promise.race([pool.query('SELECT 1'), timeoutPromise])
    return true
  } catch (error) {
    logger.warn('db_connectivity_check_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  } finally {
    await pool.end().catch((error) => {
      logger.debug('db_connectivity_pool_close_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }
}

const resolveDbUrlsToCheck = (): string[] => {
  const urls: string[] = []

  // Prefer explicit plane URLs when present (ECS entrypoints resolve these).
  if (process.env.DATABASE_URL_PLANE_A && config.db.planeAUrl) urls.push(config.db.planeAUrl)
  if (process.env.DATABASE_URL_PLANE_B && config.db.planeBUrl) urls.push(config.db.planeBUrl)
  if (process.env.DATABASE_URL_PLANE_C && config.db.planeCUrl) urls.push(config.db.planeCUrl)

  // Fall back to whatever default DB URL is configured.
  if (urls.length === 0 && config.db.url) urls.push(config.db.url)

  return Array.from(new Set(urls)).filter(Boolean)
}

const checkRedisConnectivity = async (): Promise<boolean> => {
  try {
    const client = await getRedisClient()
    if (!client) return false
    await Promise.race([
      client.ping(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('redis_ping_timeout')), 2000)),
    ])
    return true
  } catch (error) {
    logger.warn('redis_connectivity_check_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

export const waitForDependencies = async (opts: {
  db?: boolean
  redis?: boolean
  sqs?: boolean
  maxWaitMs?: number
}): Promise<void> => {
  const deadline = Date.now() + (opts.maxWaitMs ?? 30_000)
  const wantsDb = Boolean(opts.db)
  const wantsRedis = Boolean(opts.redis)
  const wantsSqs = Boolean(opts.sqs)

  // SQS readiness is validated in assertAwsConfig; we don't have a generic health endpoint here
  // without a known queue URL. Keep this as a placeholder for future wiring.
  if (wantsSqs) {
    logger.debug('dependency_wait_sqs_skipped', { reason: 'no_generic_check' })
  }

  while (Date.now() < deadline) {
    const checks: Array<Promise<boolean>> = []
    if (wantsDb) {
      const dbUrls = resolveDbUrlsToCheck()
      if (dbUrls.length === 0) {
        checks.push(Promise.resolve(false))
      } else {
        checks.push(
          Promise.all(dbUrls.map((url) => checkDbConnectivity(url))).then((results) =>
            results.every(Boolean),
          ),
        )
      }
    }
    if (wantsRedis) checks.push(checkRedisConnectivity())
    const results = await Promise.allSettled(checks)
    const ok = results.every(r => r.status === 'fulfilled' && r.value)
    if (ok) return
    await sleep(2000)
  }

  emitOpsEvent({
    type: 'dependency_unavailable',
    component: 'startup',
    details: {
      db: wantsDb,
      redis: wantsRedis,
      sqs: wantsSqs,
      max_wait_ms: opts.maxWaitMs ?? 30_000,
    },
  })

  throw new Error('Dependencies not ready within timeout')
}

export const runStartupChecks = async (params: {
  requirements?: RuntimeConfigRequirements
  awsValidation?: ValidationOptions
} = {}): Promise<void> => {
  const requirements = params.requirements ?? {}

  validateConfigOrDie(requirements)
  assertRuntimeConfig(requirements)

  const audit = auditConfig(requirements)
  if (audit.warnings.length > 0) {
    logger.warn('config_empty_string_warning', {
      warnings: audit.warnings,
    })
  }

  // Connectivity checks: fail-fast in ECS (or when explicitly requested via --validate).
  // Local dev often has no AWS creds/queues/buckets, and Lambda cold starts should avoid extra calls.
  const shouldValidateConnectivity = config.runtime.isEcs || process.argv.includes('--validate')
  if (shouldValidateConnectivity) {
    const derived: ValidationOptions = {
      skipS3: !requirements.requireStorage,
      skipSQS: !requirements.requireQueues,
      skipRedis: !requirements.requireRedis,
      skipDatabase: !(
        requirements.requirePlaneA ||
        requirements.requirePlaneB ||
        requirements.requirePlaneCDb
      ),
      ...params.awsValidation,
    }

    await waitForDependencies({
      db: !derived.skipDatabase,
      redis: !derived.skipRedis,
      sqs: !derived.skipSQS,
      maxWaitMs: 30_000,
    })
    await assertAwsConfig(derived)
  }
}
