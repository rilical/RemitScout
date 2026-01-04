import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'

export const handler = async (): Promise<{ status: string }> => {
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
    jsonKeys: ['url', 'DATABASE_URL_PLANE_A', 'database_url'],
    usernameKeys: ['username', 'user', 'DB_USERNAME', 'DATABASE_USERNAME', 'PLANE_A_DB_USERNAME'],
    passwordKeys: ['password', 'DB_PASSWORD', 'DATABASE_PASSWORD', 'PLANE_A_DB_PASSWORD'],
    hostKeys: ['host', 'DB_HOST', 'DATABASE_HOST', 'PLANE_A_DB_HOST'],
    portKeys: ['port', 'DB_PORT', 'DATABASE_PORT', 'PLANE_A_DB_PORT'],
    nameKeys: ['dbname', 'database', 'DB_NAME', 'DATABASE_NAME', 'PLANE_A_DB_NAME'],
  })

  await resolveAwsEnv([
    {
      envVar: 'REDIS_URL',
      secretArnEnv: 'REDIS_SECRET_ARN',
      ssmNameEnv: 'REDIS_SSM_NAME',
      jsonKeys: ['url', 'REDIS_URL', 'redis_url'],
      required: false,
    },
    {
      envVar: 'OANDA_API_KEY',
      secretArnEnv: 'OANDA_SECRET_ARN',
      ssmNameEnv: 'OANDA_SSM_NAME',
      jsonKeys: ['apiKey', 'OANDA_API_KEY', 'key'],
      required: false,
    },
  ])

  const { syncRates } = await import('../oanda-rates-sync')
  await syncRates()
  return { status: 'ok' }
}
