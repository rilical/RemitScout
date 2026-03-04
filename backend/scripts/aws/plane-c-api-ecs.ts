import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'

const logger = createLogger('script.plane-c-api-ecs')

const withOptionalKey = (key: string | undefined, defaults: string[]) => {
  return key ? [key, ...defaults] : defaults
}

const isTruthy = (value: string | undefined) => {
  const normalized = (value || '').trim().toLowerCase()
  return normalized === '1'
    || normalized === 'true'
    || normalized === 'yes'
    || normalized === 'on'
}

export const handler = async (): Promise<void> => {
  await resolveDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_C',
    secretArnEnv: 'PLANE_C_DB_SECRET_ARN',
    ssmNameEnv: 'PLANE_C_DB_SSM_NAME',
    hostEnv: 'PLANE_C_DB_HOST',
    portEnv: 'PLANE_C_DB_PORT',
    nameEnv: 'PLANE_C_DB_NAME',
    usernameEnv: 'PLANE_C_DB_USERNAME',
    passwordEnv: 'PLANE_C_DB_PASSWORD',
    requireJson: true,
    required: true,
    sslModeEnv: 'PGSSLMODE',
    jsonKeys: withOptionalKey(process.env.PLANE_C_DB_SECRET_JSON_KEY, [
      'url',
      'DATABASE_URL_PLANE_C',
      'database_url',
    ]),
  })

  const requireInternalToken = isTruthy(process.env.PLANE_C_REQUIRE_INTERNAL_AUTH)

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
      envVar: 'PLANE_C_INTERNAL_API_TOKEN',
      secretArnEnv: 'SHARED_SECRET_ARN',
      jsonKeys: withOptionalKey(
        process.env.PLANE_C_INTERNAL_API_TOKEN_SECRET_JSON_KEY,
        ['PLANE_C_INTERNAL_API_TOKEN', 'plane_c_internal_api_token'],
      ),
      required: requireInternalToken,
    },
  ])

  await import('../../plane-c/src/server')
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
