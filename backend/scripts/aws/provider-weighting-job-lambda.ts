import { resolveDatabaseUrl } from '../../shared/aws-params'
import { cleanupAllConnections } from '../../shared/connection-manager'
import { createLogger } from '../../shared/logger'

const logger = createLogger('script.provider-weighting-job-lambda')

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

    const { runProviderWeightingJob } = await import('../provider-weighting-job')
    await runProviderWeightingJob()
    return { status: 'ok' }
  } catch (error) {
    logger.error('handler_error', { error: error instanceof Error ? error.message : String(error) })
    throw error
  } finally {
    await cleanupAllConnections()
  }
}
