import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { cleanupAllConnections } from '../../shared/connection-manager'
import { createLogger } from '../../shared/logger'

const logger = createLogger('script.export-worker-lambda')

export const handler = async (): Promise<{ status: string }> => {
  try {
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
    })

    await resolveAwsEnv([
      {
        envVar: 'EXPORT_JOB_QUEUE_URL',
        secretArnEnv: 'EXPORT_JOB_QUEUE_SECRET_ARN',
        ssmNameEnv: 'EXPORT_JOB_QUEUE_SSM_NAME',
        jsonKeys: ['url', 'EXPORT_JOB_QUEUE_URL'],
        required: false,
      },
      {
        envVar: 'EXPORTS_S3_BUCKET',
        secretArnEnv: 'EXPORTS_S3_BUCKET_SECRET_ARN',
        ssmNameEnv: 'EXPORTS_S3_BUCKET_SSM_NAME',
        jsonKeys: ['bucket', 'EXPORTS_S3_BUCKET'],
        required: false,
      },
    ])

    const { runExportWorker } = await import('../export-worker')
    await runExportWorker({ once: true })

    return { status: 'ok' }
  } catch (error) {
    logger.error('handler_error', { error: error instanceof Error ? error.message : String(error) })
    throw error
  } finally {
    await cleanupAllConnections()
  }
}
