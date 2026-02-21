import fs from 'node:fs'
import path from 'node:path'

import { config, type RuntimeConfigRequirements } from '../../shared/config'
import { validateConfigOrThrow } from '../../shared/config-schema'
import { auditConfig } from '../../shared/config-audit'

const REQUIRED_RESUME_RULES = [
  'b2b-sweep-scheduler',
  'b2c-refresh-worker',
  'b2c-retry-failed',
  'fx-rate-refresh-worker',
]

const resolveDevRuntimeConfigPath = (): string => {
  const candidates = [
    path.resolve(process.cwd(), 'ops/dev-runtime.json'),
    path.resolve(process.cwd(), '../ops/dev-runtime.json'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  throw new Error(`ops/dev-runtime.json not found (checked: ${candidates.join(', ')})`)
}

const validateDevRuntimeConfig = () => {
  const runtimePath = resolveDevRuntimeConfigPath()
  const parsed = JSON.parse(fs.readFileSync(runtimePath, 'utf8')) as {
    opsPauseRuleAllowlist?: string[]
    opsResumeRuleAllowlist?: string[]
    nightlyAutoPause?: {
      enabled?: boolean
      timezone?: string
      cron?: string
    }
  }

  const pauseAllowlist = Array.isArray(parsed.opsPauseRuleAllowlist)
    ? parsed.opsPauseRuleAllowlist
    : []
  const resumeAllowlist = Array.isArray(parsed.opsResumeRuleAllowlist)
    ? parsed.opsResumeRuleAllowlist
    : []
  const nightly = parsed.nightlyAutoPause ?? {}

  if (!pauseAllowlist.length) {
    throw new Error('ops/dev-runtime.json: opsPauseRuleAllowlist must not be empty')
  }
  if (!resumeAllowlist.length) {
    throw new Error('ops/dev-runtime.json: opsResumeRuleAllowlist must not be empty')
  }
  for (const requiredRule of REQUIRED_RESUME_RULES) {
    if (!resumeAllowlist.includes(requiredRule)) {
      throw new Error(`ops/dev-runtime.json: opsResumeRuleAllowlist missing "${requiredRule}"`)
    }
  }
  if (nightly.enabled !== true) {
    throw new Error('ops/dev-runtime.json: nightlyAutoPause.enabled must be true')
  }
  if (nightly.timezone !== 'America/New_York') {
    throw new Error('ops/dev-runtime.json: nightlyAutoPause.timezone must be America/New_York')
  }
  if (nightly.cron !== 'cron(0 0 * * ? *)') {
    throw new Error('ops/dev-runtime.json: nightlyAutoPause.cron must be cron(0 0 * * ? *)')
  }
}

const run = () => {
  const envName = (process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev').toLowerCase()
  const isProdLikeEnv = envName === 'prod' || envName === 'staging'
  const requireQuoteRefreshQueue = config.queues.quoteRefreshMode !== 'off'
  const requireFxRateRefreshQueue = config.queues.fxRateRefreshMode !== 'off'
  const requireExportJobQueue = config.queues.exports.mode !== 'off'
  const requireIngestFanoutQueue = config.queues.ingestFanout.mode !== 'off'
  const requireNotificationsQueue = config.queues.notifications.mode !== 'off'
  const requireOpsAlertsQueue = config.queues.opsAlerts.mode !== 'off'
  const requireGoldLiveQueue = config.queues.goldLive.mode !== 'off'
  const requireAlertEvaluationQueue = config.alerts.evaluation.enabled
  const requirements: RuntimeConfigRequirements = {
    requirePlaneA: true,
    requirePlaneB: true,
    requirePlaneCDb: true,
    requirePlaneC: true,
    requireRedis: true,
    requireQueues:
      requireQuoteRefreshQueue ||
      requireFxRateRefreshQueue ||
      requireExportJobQueue ||
      requireIngestFanoutQueue ||
      requireNotificationsQueue ||
      requireOpsAlertsQueue ||
      requireGoldLiveQueue ||
      requireAlertEvaluationQueue,
    requireQuoteRefreshQueue,
    requireFxRateRefreshQueue,
    requireExportJobQueue,
    requireIngestFanoutQueue,
    requireNotificationsQueue,
    requireOpsAlertsQueue,
    requireGoldLiveQueue,
    requireAlertEvaluationQueue,
    requireStorage: requireExportJobQueue,
    requireExportsBucket: requireExportJobQueue,
    requireAlerts: isProdLikeEnv,
    requireSupabase: isProdLikeEnv,
    requireStripe: isProdLikeEnv,
    // Plane A auth is Supabase JWT verification (JWKS/remote), not an HMAC secret.
    // Keep PLANE_A_JWT_SECRET optional to avoid requiring legacy/unused config.
    requireJwtSecret: false,
  }

  // Schema-driven validation (includes paths and env var names).
  validateConfigOrThrow(requirements)

  const audit = auditConfig(requirements)
  if (audit.warnings.length > 0) {
    // Warnings are still worth surfacing in CI output.
    console.warn('⚠️ Config warnings (empty strings):', audit.warnings)
  }

  validateDevRuntimeConfig()

  console.log('✅ Runtime configuration validation passed')
}

try {
  run()
} catch (error) {
  console.error(
    'Runtime configuration validation failed:',
    error instanceof Error ? error.message : String(error),
  )
  process.exit(1)
}
