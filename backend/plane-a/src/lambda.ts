import awsLambdaFastify from '@fastify/aws-lambda'

let logger: {
  info: (event: string, context?: Record<string, unknown>) => void
  error: (event: string, context?: Record<string, unknown>) => void
} | null = null

let proxy: ReturnType<typeof awsLambdaFastify> | null = null
let initPromise: Promise<void> | null = null

const withOptionalKey = (key: string | undefined, defaults: string[]) => {
  return key ? [key, ...defaults] : defaults
}

const getLogger = async () => {
  if (logger) return logger
  const { createLogger } = await import('../../shared/logger')
  logger = createLogger('plane-a.lambda')
  return logger
}

const init = async () => {
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    const { resolveAwsEnv, resolveDatabaseUrl } = await import('../../shared/aws-params')

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
        'DATABASE_URL_PLANE_B',
        'database_url',
      ]),
    })

    await resolveDatabaseUrl({
      envVar: 'DATABASE_URL_PLANE_C',
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
        'DATABASE_URL_PLANE_C',
        'database_url',
      ]),
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

    console.log(
      'Lambda init env snapshot',
      {
        DATABASE_URL_PLANE_A: process.env.DATABASE_URL_PLANE_A ? 'set' : 'missing',
        DATABASE_URL_PLANE_B: process.env.DATABASE_URL_PLANE_B ? 'set' : 'missing',
        DATABASE_URL_PLANE_C: process.env.DATABASE_URL_PLANE_C ? 'set' : 'missing',
        PLANE_A_DB_HOST: process.env.PLANE_A_DB_HOST ? 'set' : 'missing',
        PLANE_A_DB_PORT: process.env.PLANE_A_DB_PORT ? 'set' : 'missing',
        PLANE_A_DB_NAME: process.env.PLANE_A_DB_NAME ? 'set' : 'missing',
      },
    )

    const { config } = await import('../../shared/config')
    const isProdLikeEnv = config.envName === 'prod' || config.envName === 'staging'
    const { runStartupChecks } = await import('../../shared/startup')
    const { initErrorTracking } = await import('../../shared/error-tracker')
    const { initTracing } = await import('../../shared/tracing')
    const { buildApp } = await import('./app')

    await runStartupChecks({
      requirements: {
        requirePlaneA: true,
        requirePlaneC: true,
        requireRedis: true,
        requireQueues: true,
        requireStorage: true,
        requireSupabase: isProdLikeEnv,
        requireStripe: isProdLikeEnv,
      },
    })

    initErrorTracking('plane-a')
    initTracing('plane-a')

    const app = await buildApp()
    proxy = awsLambdaFastify(app)
    await app.ready()
    const loggerInstance = await getLogger()
    loggerInstance.info('lambda_initialized', {})
  })()

  return initPromise
}

export const handler = async (
  event: unknown,
  context: { callbackWaitsForEmptyEventLoop: boolean },
) => {
  context.callbackWaitsForEmptyEventLoop = false
  
  try {
    await init()
  } catch (error: unknown) {
    const loggerInstance = await getLogger()
    const errorMessage = error instanceof Error ? error.message : String(error)
    loggerInstance.error('lambda_initialization_failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Lambda initialization failed',
      }),
    }
  }

  if (!proxy) {
    const loggerInstance = await getLogger()
    const eventPath =
      event && typeof event === 'object' && 'path' in event
        ? (event as { path?: unknown }).path
        : undefined
    loggerInstance.error('lambda_proxy_not_initialized', {
      event_path: typeof eventPath === 'string' ? eventPath : null,
    })
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'internal_error',
        message: 'Lambda proxy not initialized',
      }),
    }
  }

  return new Promise((resolve, reject) => {
    proxy?.(event, context, (err, result) => {
      if (err) {
        getLogger().then((loggerInstance) => {
          loggerInstance.error('lambda_handler_error', {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
          })
        })
        reject(err)
        return
      }
      resolve(result)
    })
  })
}
