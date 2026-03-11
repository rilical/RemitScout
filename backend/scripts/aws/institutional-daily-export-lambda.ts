import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { cleanupAllConnections } from '../../shared/connection-manager'
import { createLogger } from '../../shared/logger'

const logger = createLogger('script.institutional-daily-export-lambda')

export const handler = async (): Promise<{ status: string }> => {
  try {
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
      jsonKeys: ['url', 'DATABASE_URL_PLANE_C', 'database_url'],
    })

    await resolveAwsEnv([
      {
        envVar: 'REDIS_URL',
        secretArnEnv: 'REDIS_SECRET_ARN',
        ssmNameEnv: 'REDIS_SSM_NAME',
        jsonKeys: ['url', 'REDIS_URL', 'redis_url'],
        required: true,
      },
      {
        envVar: 'EXPORTS_S3_BUCKET',
        secretArnEnv: 'EXPORTS_S3_BUCKET_SECRET_ARN',
        ssmNameEnv: 'EXPORTS_S3_BUCKET_SSM_NAME',
        jsonKeys: ['bucket', 'EXPORTS_S3_BUCKET'],
        required: false,
      },
    ])

    const { runInstitutionalDailyExportJob } = await import('../institutional-daily-export-job')
    await runInstitutionalDailyExportJob({ exportDateOverride: process.env.INSTITUTIONAL_EXPORT_DATE })

    return { status: 'ok' }
  } catch (error) {
    logger.error('handler_error', { error: error instanceof Error ? error.message : String(error) })
    throw error
  } finally {
    await cleanupAllConnections()
  }
}

