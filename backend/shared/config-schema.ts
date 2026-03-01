import { z } from 'zod'
import { config, type RuntimeConfigRequirements } from './config'

const nonEmptyString = z.string()
const booleanSchema = z.boolean()
const numberSchema = z.number()
const placeholderAlertWebhookPatterns = [/change-me/i, /placeholder/i, /example/i, /your[-_]/i]
const placeholderSecretPatterns = [
  /^change[-_]?me$/i,
  /^placeholder$/i,
  /^example(?:[-_].*)?$/i,
  /^staging[-_]?key$/i,
  /^test[-_]?key$/i,
  /^your[-_].*/i,
]

const looksLikePlaceholder = (value: string) =>
  placeholderAlertWebhookPatterns.some((pattern) => pattern.test(value))

const looksLikeSecretPlaceholder = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return false
  return placeholderSecretPatterns.some((pattern) => pattern.test(trimmed))
}

// This schema intentionally validates only the stable surface area we treat as "startup critical".
// It is still a schema for the full config object: unknown keys are allowed via passthrough.
const baseConfigSchema = z.object({
  env: nonEmptyString,
  envName: z.string().optional(),
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
    agentFailure: z.object({
      url: z.string(),
    }).passthrough(),
    agentStress: z.object({
      url: z.string(),
    }).passthrough(),
    toolRequest: z.object({
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
    adminIpAllowlist: z.array(z.string()).default([]),
  }).passthrough(),
  agent: z.object({
    enabled: booleanSchema,
    orchestratorEnabled: booleanSchema,
    llmConnector: z.enum(['anthropic', 'bedrock']),
    llmModel: z.string(),
    llmMaxTokens: numberSchema,
    llmTemperature: numberSchema,
    anthropicApiKey: z.string().optional(),
    anthropicApiKeySecretArn: z.string().optional(),
    bedrockRegion: z.string().optional(),
    bedrockModelId: z.string().optional(),
    bedrockMaxTokens: numberSchema.optional(),
    bedrockSecretArn: z.string().optional(),
    llmPromptVersion: z.string().optional(),
    telemetryDims: z.array(z.string()).optional(),
  }).passthrough(),
  privacy: z.object({
    hashSalt: z.string(),
    sessionSalt: z.string(),
  }).passthrough(),
  planeC: z.object({
    internalApiToken: z.string(),
    requireInternalAuth: booleanSchema,
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

const shouldRequire = (
  overrideValue: boolean | undefined,
  defaultValue: boolean,
) => overrideValue ?? defaultValue

const buildStartupSchema = (requirements: RuntimeConfigRequirements) =>
  baseConfigSchema.superRefine((cfg, ctx) => {
    const runtimeEnv = (cfg.envName || cfg.env || '').trim().toLowerCase()
    const isProdLike = runtimeEnv === 'staging' || runtimeEnv === 'prod' || runtimeEnv === 'production'
    const agentLlmEnabled = cfg.agent.enabled || cfg.agent.orchestratorEnabled || requirements.requireAgentLlm === true

    if (requirements.requirePlaneA && !cfg.db.planeAUrl) {
      addMissing(ctx, 'DATABASE_URL_PLANE_A', ['db', 'planeAUrl'])
    }
    if (requirements.requirePlaneB && !cfg.db.planeBUrl) {
      addMissing(ctx, 'DATABASE_URL_PLANE_B', ['db', 'planeBUrl'])
    }
    if (requirements.requirePlaneCDb && !cfg.db.planeCUrl) {
      addMissing(ctx, 'DATABASE_URL_PLANE_C', ['db', 'planeCUrl'])
    }
    if (requirements.requirePlaneCInternalAuth && !cfg.planeC.internalApiToken) {
      addMissing(ctx, 'PLANE_C_INTERNAL_API_TOKEN', ['planeC', 'internalApiToken'])
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
      const requireQuoteRefreshQueue = shouldRequire(
        requirements.requireQuoteRefreshQueue,
        true,
      )
      const requireFxRateRefreshQueue = shouldRequire(
        requirements.requireFxRateRefreshQueue,
        true,
      )
      const requireExportJobQueue = shouldRequire(requirements.requireExportJobQueue, true)
      const requireIngestFanoutQueue = shouldRequire(requirements.requireIngestFanoutQueue, true)
      const requireNotificationsQueue = shouldRequire(requirements.requireNotificationsQueue, true)
      const requireOpsAlertsQueue = shouldRequire(requirements.requireOpsAlertsQueue, true)
      const requireGoldLiveQueue = shouldRequire(requirements.requireGoldLiveQueue, true)
      const requireAlertEvaluationQueue = shouldRequire(
        requirements.requireAlertEvaluationQueue,
        true,
      )

      if (requireQuoteRefreshQueue && !cfg.queues.quoteRefreshUrl) {
        addMissing(ctx, 'QUOTE_REFRESH_QUEUE_URL', ['queues', 'quoteRefreshUrl'])
      }
      if (requireFxRateRefreshQueue && !cfg.queues.fxRateRefreshUrl) {
        addMissing(ctx, 'FX_RATE_REFRESH_QUEUE_URL', ['queues', 'fxRateRefreshUrl'])
      }
      if (requireExportJobQueue && !cfg.queues.exports.url) {
        addMissing(ctx, 'EXPORT_JOB_QUEUE_URL', ['queues', 'exports', 'url'])
      }
      if (requireIngestFanoutQueue && !cfg.queues.ingestFanout.url) {
        addMissing(ctx, 'PLANE_B_INGEST_FANOUT_QUEUE_URL', ['queues', 'ingestFanout', 'url'])
      }
      if (requireNotificationsQueue && !cfg.queues.notifications.url) {
        addMissing(ctx, 'PLANE_B_NOTIFICATIONS_QUEUE_URL', ['queues', 'notifications', 'url'])
      }
      if (requireOpsAlertsQueue && !cfg.queues.opsAlerts.url) {
        addMissing(ctx, 'PLANE_B_OPS_ALERT_QUEUE_URL', ['queues', 'opsAlerts', 'url'])
      }
      if (requireGoldLiveQueue && !cfg.queues.goldLive.url) {
        addMissing(ctx, 'GOLD_LIVE_QUEUE_URL', ['queues', 'goldLive', 'url'])
      }
      if (requireAlertEvaluationQueue && !cfg.alerts.evaluation.queueUrl) {
        addMissing(ctx, 'ALERT_EVALUATION_QUEUE_URL', ['alerts', 'evaluation', 'queueUrl'])
      }
    }
    if (requirements.requireStorage) {
      const requireBronzeBucket = shouldRequire(requirements.requireBronzeBucket, true)
      const requireExportsBucket = shouldRequire(requirements.requireExportsBucket, true)
      if (requireBronzeBucket && !cfg.storage.bronze.bucket) {
        addMissing(ctx, 'BRONZE_S3_BUCKET', ['storage', 'bronze', 'bucket'])
      }
      if (requireExportsBucket && !cfg.storage.exports.bucket) {
        addMissing(ctx, 'EXPORTS_S3_BUCKET', ['storage', 'exports', 'bucket'])
      }
    }
    if (requirements.requireAlerts) {
      if (!cfg.alerts.slackWebhookUrl) {
        addMissing(ctx, 'ALERT_SLACK_WEBHOOK_URL', ['alerts', 'slackWebhookUrl'])
      } else if (looksLikePlaceholder(cfg.alerts.slackWebhookUrl)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['alerts', 'slackWebhookUrl'],
          message: 'ALERT_SLACK_WEBHOOK_URL cannot be a placeholder value',
        })
      }
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
    } else if (requirements.requireJwtSecret && looksLikeSecretPlaceholder(cfg.planeA.jwtSecret)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['planeA', 'jwtSecret'],
        message: 'PLANE_A_JWT_SECRET cannot be a placeholder value',
      })
    }
    if (requirements.requirePrivacySalts) {
      if (!cfg.privacy.hashSalt) {
        addMissing(ctx, 'PRIVACY_HASH_SALT', ['privacy', 'hashSalt'])
      } else if (looksLikeSecretPlaceholder(cfg.privacy.hashSalt)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['privacy', 'hashSalt'],
          message: 'PRIVACY_HASH_SALT cannot be a placeholder value',
        })
      }
      if (!cfg.privacy.sessionSalt) {
        addMissing(ctx, 'PRIVACY_SESSION_SALT', ['privacy', 'sessionSalt'])
      } else if (looksLikeSecretPlaceholder(cfg.privacy.sessionSalt)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['privacy', 'sessionSalt'],
          message: 'PRIVACY_SESSION_SALT cannot be a placeholder value',
        })
      }
    }
    if (requirements.requireAdminIpAllowlist && cfg.planeA.adminIpAllowlist.length === 0) {
      addMissing(
        ctx,
        'ADMIN_IP_ALLOWLIST (or WAF_ADMIN_ALLOWLIST_IPS / WAF_ALLOWLIST_IPS)',
        ['planeA', 'adminIpAllowlist'],
      )
    }

    if (agentLlmEnabled) {
      const connector = cfg.agent.llmConnector
      const llmModel = cfg.agent.llmModel?.trim() ?? ''
      if (!llmModel) {
        addMissing(ctx, 'AGENT_LLM_MODEL', ['agent', 'llmModel'])
      }

      const promptVersion = cfg.agent.llmPromptVersion?.trim() ?? ''
      if (!promptVersion) {
        addMissing(ctx, 'AGENT_LLM_PROMPT_VERSION', ['agent', 'llmPromptVersion'])
      }

      if (!Number.isFinite(cfg.agent.llmMaxTokens) || cfg.agent.llmMaxTokens <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['agent', 'llmMaxTokens'],
          message: 'AGENT_LLM_MAX_TOKENS must be a positive number',
        })
      }

      if (!Number.isFinite(cfg.agent.llmTemperature) || cfg.agent.llmTemperature < 0 || cfg.agent.llmTemperature > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['agent', 'llmTemperature'],
          message: 'AGENT_LLM_TEMPERATURE must be within [0, 1]',
        })
      }

      if (connector === 'anthropic') {
        const apiKey = cfg.agent.anthropicApiKey?.trim() ?? ''
        const secretArn = cfg.agent.anthropicApiKeySecretArn?.trim() ?? ''
        const hasKey = Boolean(apiKey)
        const hasSecretArn = Boolean(secretArn)
        if (isProdLike && !hasSecretArn) {
          addMissing(
            ctx,
            'AGENT_ANTHROPIC_API_KEY_SECRET_ARN',
            ['agent', 'anthropicApiKeySecretArn'],
          )
        } else if (!isProdLike && !hasKey && !hasSecretArn) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['agent', 'anthropicApiKey'],
            message:
              'Anthropic connector requires AGENT_ANTHROPIC_API_KEY (local/dev) or AGENT_ANTHROPIC_API_KEY_SECRET_ARN.',
          })
        }
        if (hasKey && looksLikeSecretPlaceholder(apiKey)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['agent', 'anthropicApiKey'],
            message: 'AGENT_ANTHROPIC_API_KEY cannot be a placeholder value',
          })
        }
      }

      if (connector === 'bedrock') {
        const region = cfg.agent.bedrockRegion?.trim() ?? ''
        const modelId = (cfg.agent.bedrockModelId?.trim() || llmModel).trim()
        if (cfg.agent.bedrockModelId?.trim() && llmModel && cfg.agent.bedrockModelId.trim() !== llmModel) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['agent', 'bedrockModelId'],
            message: 'AGENT_BEDROCK_MODEL_ID must match AGENT_LLM_MODEL when both are set.',
          })
        }
        if (!region) {
          addMissing(ctx, 'AGENT_BEDROCK_REGION', ['agent', 'bedrockRegion'])
        }
        if (!modelId) {
          addMissing(ctx, 'AGENT_BEDROCK_MODEL_ID', ['agent', 'bedrockModelId'])
        }
        const bedrockAllowlistByRegion: Record<string, string[]> = {
          'us-east-1': [
            'anthropic.claude-sonnet-4-20250514-v1:0',
          ],
          'us-west-2': [
            'anthropic.claude-sonnet-4-20250514-v1:0',
          ],
        }
        if (region && modelId) {
          const allowed = bedrockAllowlistByRegion[region]
          if (allowed && !allowed.includes(modelId)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['agent', 'bedrockModelId'],
              message: `AGENT_BEDROCK_MODEL_ID '${modelId}' is not in allowlist for region '${region}'`,
            })
          }
        }
      }
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
