import { z } from 'zod'
import { config, type RuntimeConfigRequirements } from './config'

const nonEmptyString = z.string()
const booleanSchema = z.boolean()
const numberSchema = z.number()

// This schema intentionally validates only the stable surface area we treat as "startup critical".
// It is still a schema for the full config object: unknown keys are allowed via passthrough.
const baseConfigSchema = z.object({
  env: nonEmptyString,
  runtime: z.object({
    isAwsRuntime: booleanSchema,
    isStrictConfig: booleanSchema,
    isLambda: booleanSchema,
    isEcs: booleanSchema,
  }).passthrough(),
  aws: z.object({
    region: z.string(),
    sesRegion: z.string(),
    snsRegion: z.string(),
  }).passthrough(),
  db: z.object({
    url: z.string(),
    planeAUrl: z.string(),
    planeBUrl: z.string(),
    planeCUrl: z.string(),
  }),
  redis: z.object({
    url: z.string(),
  }),
  queues: z.object({
    quoteRefreshUrl: z.string(),
    fxRateRefreshUrl: z.string(),
    exports: z.object({
      url: z.string(),
    }).passthrough(),
    ingestFanout: z.object({
      url: z.string(),
    }).passthrough(),
    notifications: z.object({
      url: z.string(),
    }).passthrough(),
    opsAlerts: z.object({
      url: z.string(),
    }).passthrough(),
    goldLive: z.object({
      url: z.string(),
    }).passthrough(),
  }).passthrough(),
  storage: z.object({
    bronze: z.object({ bucket: z.string() }).passthrough(),
    exports: z.object({ bucket: z.string() }).passthrough(),
  }).passthrough(),
  planeA: z.object({
    jwtSecret: z.string(),
    planeCBaseUrl: z.string(),
    requireJwt: booleanSchema,
  }).passthrough(),
  alerts: z.object({
    slackWebhookUrl: z.string(),
    email: z.object({
      enabled: booleanSchema,
      smtpHost: z.string(),
      from: z.string(),
    }).passthrough(),
    evaluation: z.object({
      queueUrl: z.string(),
      enabled: booleanSchema,
      batchSize: numberSchema,
      concurrency: numberSchema,
    }).passthrough(),
  }).passthrough(),
  auth: z.object({
    supabase: z.object({
      url: z.string(),
      publishableKey: z.string(),
    }).passthrough(),
  }).passthrough(),
  billing: z.object({
    stripe: z.object({
      secretKey: z.string(),
      webhookSecret: z.string(),
      priceIdPlus: z.string(),
      priceIdPlusAnnual: z.string(),
    }).passthrough(),
  }).passthrough(),
}).passthrough()

const addMissing = (
  ctx: z.RefinementCtx,
  envVar: string,
  path: Array<string | number>,
) => {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message: envVar,
  })
}

const buildStartupSchema = (requirements: RuntimeConfigRequirements) =>
  baseConfigSchema.superRefine((cfg, ctx) => {
    if (requirements.requirePlaneA && !cfg.db.planeAUrl) {
      addMissing(ctx, 'DATABASE_URL_PLANE_A', ['db', 'planeAUrl'])
    }
    if (requirements.requirePlaneB && !cfg.db.planeBUrl) {
      addMissing(ctx, 'DATABASE_URL_PLANE_B', ['db', 'planeBUrl'])
    }
    if (requirements.requirePlaneCDb && !cfg.db.planeCUrl) {
      addMissing(ctx, 'DATABASE_URL_PLANE_C', ['db', 'planeCUrl'])
    }
    if (requirements.requirePlaneC && !cfg.planeA.planeCBaseUrl) {
      addMissing(ctx, 'PLANE_C_BASE_URL', ['planeA', 'planeCBaseUrl'])
    }
    if (
      requirements.requirePlaneC &&
      cfg.runtime.isAwsRuntime &&
      typeof cfg.planeA.planeCBaseUrl === 'string' &&
      cfg.planeA.planeCBaseUrl.trim()
    ) {
      const raw = cfg.planeA.planeCBaseUrl.trim().toLowerCase()
      const isLocalhost =
        raw.includes('://localhost') ||
        raw.includes('://127.0.0.1') ||
        raw.startsWith('localhost') ||
        raw.startsWith('127.0.0.1')
      if (isLocalhost) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['planeA', 'planeCBaseUrl'],
          message:
            'PLANE_C_BASE_URL must not be localhost/127.0.0.1 when running in AWS runtime.',
        })
      }
    }
    if (requirements.requireRedis && !cfg.redis.url) {
      addMissing(ctx, 'REDIS_URL', ['redis', 'url'])
    }
    if (requirements.requireQueues) {
      if (!cfg.queues.quoteRefreshUrl) addMissing(ctx, 'QUOTE_REFRESH_QUEUE_URL', ['queues', 'quoteRefreshUrl'])
      if (!cfg.queues.fxRateRefreshUrl) addMissing(ctx, 'FX_RATE_REFRESH_QUEUE_URL', ['queues', 'fxRateRefreshUrl'])
      if (!cfg.queues.exports.url) addMissing(ctx, 'EXPORT_JOB_QUEUE_URL', ['queues', 'exports', 'url'])
      if (!cfg.queues.ingestFanout.url) addMissing(ctx, 'PLANE_B_INGEST_FANOUT_QUEUE_URL', ['queues', 'ingestFanout', 'url'])
      if (!cfg.queues.notifications.url) addMissing(ctx, 'PLANE_B_NOTIFICATIONS_QUEUE_URL', ['queues', 'notifications', 'url'])
      if (!cfg.queues.opsAlerts.url) addMissing(ctx, 'PLANE_B_OPS_ALERT_QUEUE_URL', ['queues', 'opsAlerts', 'url'])
      if (!cfg.queues.goldLive.url) addMissing(ctx, 'GOLD_LIVE_QUEUE_URL', ['queues', 'goldLive', 'url'])
      if (!cfg.alerts.evaluation.queueUrl) addMissing(ctx, 'ALERT_EVALUATION_QUEUE_URL', ['alerts', 'evaluation', 'queueUrl'])
    }
    if (requirements.requireStorage) {
      if (!cfg.storage.bronze.bucket) addMissing(ctx, 'BRONZE_S3_BUCKET', ['storage', 'bronze', 'bucket'])
      if (!cfg.storage.exports.bucket) addMissing(ctx, 'EXPORTS_S3_BUCKET', ['storage', 'exports', 'bucket'])
    }
    if (requirements.requireAlerts) {
      if (!cfg.alerts.slackWebhookUrl) addMissing(ctx, 'ALERT_SLACK_WEBHOOK_URL', ['alerts', 'slackWebhookUrl'])
      if (cfg.alerts.email.enabled && !cfg.alerts.email.smtpHost) addMissing(ctx, 'ALERT_SMTP_HOST', ['alerts', 'email', 'smtpHost'])
      if (cfg.alerts.email.enabled && !cfg.alerts.email.from) addMissing(ctx, 'ALERT_EMAIL_FROM', ['alerts', 'email', 'from'])
    }
    if (requirements.requireSupabase) {
      if (!cfg.auth.supabase.url) addMissing(ctx, 'SUPABASE_URL', ['auth', 'supabase', 'url'])
      if (!cfg.auth.supabase.publishableKey) addMissing(ctx, 'SUPABASE_PUBLISHABLE_KEY', ['auth', 'supabase', 'publishableKey'])
    }
    if (requirements.requireStripe) {
      if (!cfg.billing.stripe.secretKey) addMissing(ctx, 'STRIPE_SECRET_KEY', ['billing', 'stripe', 'secretKey'])
      if (!cfg.billing.stripe.webhookSecret) addMissing(ctx, 'STRIPE_WEBHOOK_SECRET', ['billing', 'stripe', 'webhookSecret'])
      if (!cfg.billing.stripe.priceIdPlus) addMissing(ctx, 'STRIPE_PRICE_ID_PLUS', ['billing', 'stripe', 'priceIdPlus'])
      if (!cfg.billing.stripe.priceIdPlusAnnual) addMissing(ctx, 'STRIPE_PRICE_ID_PLUS_ANNUAL', ['billing', 'stripe', 'priceIdPlusAnnual'])
    }
    if (requirements.requireJwtSecret && !cfg.planeA.jwtSecret) {
      addMissing(ctx, 'PLANE_A_JWT_SECRET', ['planeA', 'jwtSecret'])
    }
  })

export const validateConfigOrThrow = (
  requirements: RuntimeConfigRequirements = {},
): void => {
  const schema = buildStartupSchema(requirements)
  const parsed = schema.safeParse(config)
  if (!parsed.success) {
    throw parsed.error
  }
}

export const validateConfigOrDie = (
  requirements: RuntimeConfigRequirements = {},
): void => {
  try {
    validateConfigOrThrow(requirements)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Keep this format stable: humans should immediately see env var names.
      console.error('FATAL: Config validation failed:', error.format())
    } else {
      console.error('FATAL: Config validation failed:', error)
    }
    process.exit(1)
  }
}
