import { config, type RuntimeConfigRequirements } from './config'

export type ConfigAuditResult = {
  missing: string[]
  warnings: string[]
}

type AuditItem = {
  envVar: string
  value: unknown
  required: boolean
  warnWhenEmpty?: boolean
}

const isEmptyString = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length === 0

export const auditConfig = (
  requirements: RuntimeConfigRequirements = {},
): ConfigAuditResult => {
  const items: AuditItem[] = []

  const add = (envVar: string, value: unknown, required: boolean, warnWhenEmpty = true) => {
    items.push({ envVar, value, required, warnWhenEmpty })
  }

  add('DATABASE_URL_PLANE_A', config.db.planeAUrl, Boolean(requirements.requirePlaneA))
  add('DATABASE_URL_PLANE_B', config.db.planeBUrl, Boolean(requirements.requirePlaneB))
  add('DATABASE_URL_PLANE_C', config.db.planeCUrl, Boolean(requirements.requirePlaneCDb))
  add('PLANE_C_BASE_URL', config.planeA.planeCBaseUrl, Boolean(requirements.requirePlaneC))
  add('REDIS_URL', config.redis.url, Boolean(requirements.requireRedis))

  if (requirements.requireQueues) {
    add('QUOTE_REFRESH_QUEUE_URL', config.queues.quoteRefreshUrl, true)
    add('FX_RATE_REFRESH_QUEUE_URL', config.queues.fxRateRefreshUrl, true)
    add('EXPORT_JOB_QUEUE_URL', config.queues.exports.url, true)
    add('PLANE_B_INGEST_FANOUT_QUEUE_URL', config.queues.ingestFanout.url, true)
    add('PLANE_B_NOTIFICATIONS_QUEUE_URL', config.queues.notifications.url, true)
    add('PLANE_B_OPS_ALERT_QUEUE_URL', config.queues.opsAlerts.url, true)
    add('GOLD_LIVE_QUEUE_URL', config.queues.goldLive.url, true)
    add('ALERT_EVALUATION_QUEUE_URL', config.alerts.evaluation.queueUrl, true)
  }

  if (requirements.requireStorage) {
    add('BRONZE_S3_BUCKET', config.storage.bronze.bucket, true)
    add('EXPORTS_S3_BUCKET', config.storage.exports.bucket, true)
  }

  if (requirements.requireAlerts) {
    add('ALERT_SLACK_WEBHOOK_URL', config.alerts.slackWebhookUrl, true)
    if (config.alerts.email.enabled) {
      add('ALERT_SMTP_HOST', config.alerts.email.smtpHost, true)
      add('ALERT_EMAIL_FROM', config.alerts.email.from, true)
    } else {
      // Still warn if someone sets enabled=false but leaves empty config around.
      add('ALERT_SMTP_HOST', config.alerts.email.smtpHost, false)
      add('ALERT_EMAIL_FROM', config.alerts.email.from, false)
    }
  }

  if (requirements.requireSupabase) {
    add('SUPABASE_URL', config.auth.supabase.url, true)
    add('SUPABASE_PUBLISHABLE_KEY', config.auth.supabase.publishableKey, true)
  }

  if (requirements.requireStripe) {
    add('STRIPE_SECRET_KEY', config.billing.stripe.secretKey, true)
    add('STRIPE_WEBHOOK_SECRET', config.billing.stripe.webhookSecret, true)
    add('STRIPE_PRICE_ID_PLUS', config.billing.stripe.priceIdPlus, true)
    add('STRIPE_PRICE_ID_PLUS_ANNUAL', config.billing.stripe.priceIdPlusAnnual, true)
  }

  if (requirements.requireJwtSecret) {
    add('PLANE_A_JWT_SECRET', config.planeA.jwtSecret, true)
  }

  const missing: string[] = []
  const warnings: string[] = []

  for (const item of items) {
    if (item.required && isEmptyString(item.value)) {
      missing.push(item.envVar)
    }
    if (item.warnWhenEmpty && isEmptyString(item.value)) {
      warnings.push(item.envVar)
    }
  }

  return {
    missing: Array.from(new Set(missing)),
    warnings: Array.from(new Set(warnings.filter((w) => !missing.includes(w)))),
  }
}

