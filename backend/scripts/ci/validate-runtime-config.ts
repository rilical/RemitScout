import { config, type RuntimeConfigRequirements } from '../../shared/config'
import { validateConfigOrThrow } from '../../shared/config-schema'
import { auditConfig } from '../../shared/config-audit'

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
