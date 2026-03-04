import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'

const logger = createLogger('script.plane-a-api-ecs')

const withOptionalKey = (key: string | undefined, defaults: string[]) => {
  return key ? [key, ...defaults] : defaults
}

const ensureCorsOrigins = () => {
  if ((process.env.PLANE_A_CORS_ORIGINS || '').trim()) {
    return
  }
  const candidateOrigins = [
    process.env.FRONTEND_BASE_URL,
    process.env.PUBLIC_SITE_URL,
  ]
    .map((value) => (value || '').trim())
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value).origin
      } catch {
        return ''
      }
    })
    .filter(Boolean)

  if (candidateOrigins.length > 0) {
    process.env.PLANE_A_CORS_ORIGINS = Array.from(new Set(candidateOrigins)).join(',')
  }
}

export const handler = async (): Promise<void> => {
  await resolveDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_A',
    secretArnEnv: 'PLANE_A_DB_SECRET_ARN',
    ssmNameEnv: 'PLANE_A_DB_SSM_NAME',
    hostEnv: 'PLANE_A_DB_HOST',
    portEnv: 'PLANE_A_DB_PORT',
    nameEnv: 'PLANE_A_DB_NAME',
    usernameEnv: 'PLANE_A_DB_USERNAME',
    passwordEnv: 'PLANE_A_DB_PASSWORD',
    requireJson: true,
    required: true,
    sslModeEnv: 'PGSSLMODE',
    jsonKeys: withOptionalKey(process.env.PLANE_A_DB_SECRET_JSON_KEY, [
      'url',
      'DATABASE_URL_PLANE_A',
      'database_url',
    ]),
  })

  await resolveDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_B',
    secretArnEnv: process.env.PLANE_B_DB_SECRET_ARN ? 'PLANE_B_DB_SECRET_ARN' : 'PLANE_A_DB_SECRET_ARN',
    ssmNameEnv: process.env.PLANE_B_DB_SSM_NAME ? 'PLANE_B_DB_SSM_NAME' : 'PLANE_A_DB_SSM_NAME',
    hostEnv: process.env.PLANE_B_DB_HOST ? 'PLANE_B_DB_HOST' : 'PLANE_A_DB_HOST',
    portEnv: process.env.PLANE_B_DB_PORT ? 'PLANE_B_DB_PORT' : 'PLANE_A_DB_PORT',
    nameEnv: process.env.PLANE_B_DB_NAME ? 'PLANE_B_DB_NAME' : 'PLANE_A_DB_NAME',
    usernameEnv: process.env.PLANE_B_DB_USERNAME ? 'PLANE_B_DB_USERNAME' : 'PLANE_A_DB_USERNAME',
    passwordEnv: process.env.PLANE_B_DB_PASSWORD ? 'PLANE_B_DB_PASSWORD' : 'PLANE_A_DB_PASSWORD',
    requireJson: true,
    sslModeEnv: 'PGSSLMODE',
    jsonKeys: withOptionalKey(process.env.PLANE_B_DB_SECRET_JSON_KEY ?? process.env.PLANE_A_DB_SECRET_JSON_KEY, [
      'url',
      'DATABASE_URL_PLANE_B',
      'database_url',
    ]),
    required: false,
  })

  await resolveDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_C',
    secretArnEnv: process.env.PLANE_C_DB_SECRET_ARN ? 'PLANE_C_DB_SECRET_ARN' : 'PLANE_A_DB_SECRET_ARN',
    ssmNameEnv: process.env.PLANE_C_DB_SSM_NAME ? 'PLANE_C_DB_SSM_NAME' : 'PLANE_A_DB_SSM_NAME',
    hostEnv: process.env.PLANE_C_DB_HOST ? 'PLANE_C_DB_HOST' : 'PLANE_A_DB_HOST',
    portEnv: process.env.PLANE_C_DB_PORT ? 'PLANE_C_DB_PORT' : 'PLANE_A_DB_PORT',
    nameEnv: process.env.PLANE_C_DB_NAME ? 'PLANE_C_DB_NAME' : 'PLANE_A_DB_NAME',
    usernameEnv: process.env.PLANE_C_DB_USERNAME ? 'PLANE_C_DB_USERNAME' : 'PLANE_A_DB_USERNAME',
    passwordEnv: process.env.PLANE_C_DB_PASSWORD ? 'PLANE_C_DB_PASSWORD' : 'PLANE_A_DB_PASSWORD',
    requireJson: true,
    sslModeEnv: 'PGSSLMODE',
    jsonKeys: withOptionalKey(process.env.PLANE_C_DB_SECRET_JSON_KEY ?? process.env.PLANE_A_DB_SECRET_JSON_KEY, [
      'url',
      'DATABASE_URL_PLANE_C',
      'database_url',
    ]),
    required: false,
  })

  await resolveAwsEnv([
    {
      envVar: 'REDIS_URL',
      secretArnEnv: 'REDIS_SECRET_ARN',
      ssmNameEnv: 'REDIS_SSM_NAME',
      jsonKeys: withOptionalKey(process.env.REDIS_SECRET_JSON_KEY, [
        'url',
        'REDIS_URL',
        'redis_url',
      ]),
      required: true,
    },
    {
      envVar: 'SUPABASE_URL',
      secretArnEnv: 'SUPABASE_SECRET_ARN',
      ssmNameEnv: 'SUPABASE_SSM_NAME',
      jsonKeys: [
        'SUPABASE_URL',
        'supabase_url',
        'url',
      ],
    },
    {
      envVar: 'SUPABASE_PUBLISHABLE_KEY',
      secretArnEnv: 'SUPABASE_SECRET_ARN',
      ssmNameEnv: 'SUPABASE_SSM_NAME',
      jsonKeys: [
        'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_ANON_KEY',
        'supabase_anon_key',
        'anon_key',
        'publishable_key',
      ],
    },
    {
      envVar: 'SUPABASE_SERVICE_ROLE_KEY',
      secretArnEnv: 'SUPABASE_SECRET_ARN',
      ssmNameEnv: 'SUPABASE_SSM_NAME',
      jsonKeys: [
        'SUPABASE_SERVICE_ROLE_KEY',
        'service_role_key',
        'service_role',
      ],
    },
    {
      envVar: 'SUPABASE_JWKS_URL',
      secretArnEnv: 'SUPABASE_SECRET_ARN',
      ssmNameEnv: 'SUPABASE_SSM_NAME',
      jsonKeys: [
        'SUPABASE_JWKS_URL',
        'jwks_url',
      ],
    },
    {
      envVar: 'STRIPE_SECRET_KEY',
      secretArnEnv: 'STRIPE_SECRET_ARN',
      ssmNameEnv: 'STRIPE_SSM_NAME',
      jsonKeys: [
        'STRIPE_SECRET_KEY',
        'stripe_secret_key',
        'secret_key',
      ],
    },
    {
      envVar: 'STRIPE_WEBHOOK_SECRET',
      secretArnEnv: 'STRIPE_SECRET_ARN',
      ssmNameEnv: 'STRIPE_SSM_NAME',
      jsonKeys: [
        'STRIPE_WEBHOOK_SECRET',
        'stripe_webhook_secret',
        'webhook_secret',
      ],
    },
    {
      envVar: 'STRIPE_PRICE_ID_PLUS',
      secretArnEnv: 'STRIPE_SECRET_ARN',
      ssmNameEnv: 'STRIPE_SSM_NAME',
      jsonKeys: [
        'STRIPE_PRICE_ID_PLUS',
        'stripe_price_id_plus',
        'price_id_plus',
      ],
    },
    {
      envVar: 'STRIPE_PRICE_ID_PLUS_ANNUAL',
      secretArnEnv: 'STRIPE_SECRET_ARN',
      ssmNameEnv: 'STRIPE_SSM_NAME',
      jsonKeys: [
        'STRIPE_PRICE_ID_PLUS_ANNUAL',
        'stripe_price_id_plus_annual',
        'price_id_plus_annual',
      ],
    },
    {
      envVar: 'STRIPE_TRIAL_DAYS',
      secretArnEnv: 'STRIPE_SECRET_ARN',
      ssmNameEnv: 'STRIPE_SSM_NAME',
      jsonKeys: [
        'STRIPE_TRIAL_DAYS',
        'stripe_trial_days',
        'trial_days',
      ],
    },
  ])

  ensureCorsOrigins()
  await import('../../plane-a/src/server')
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler().catch((error) => {
    logger.error('fatal', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  })
}
