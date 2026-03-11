import { resolveDatabaseUrl } from '../../shared/aws-params'
import { cleanupAllConnections } from '../../shared/connection-manager'
import { createLogger } from '../../shared/logger'
import { formatError } from '../../shared/utils/error-handling'

const logger = createLogger('script.smart-alerts-job-lambda')

export const handler = async (): Promise<{ status: string; result?: unknown }> => {
  try {
    try {
      await resolveDatabaseUrl({
        envVar: 'DATABASE_URL_PLANE_B',
        secretArnEnv: 'PLANE_B_DB_SECRET_ARN',
        ssmNameEnv: 'PLANE_B_DB_SSM_NAME',
        hostEnv: 'PLANE_B_DB_HOST',
        portEnv: 'PLANE_B_DB_PORT',
        nameEnv: 'PLANE_B_DB_NAME',
        usernameEnv: 'PLANE_B_DB_USERNAME',
        passwordEnv: 'PLANE_B_DB_PASSWORD',
        requireJson: true,
        required: true,
        sslModeEnv: 'PGSSLMODE',
        jsonKeys: ['url', 'DATABASE_URL_PLANE_B', 'database_url'],
      })
    } catch (error: unknown) {
      const { message, stack } = formatError(error)
      logger.error('env_resolution_failed', {
        job_name: 'smart-alerts',
        error: message,
        stack,
      })
      throw new Error(`Failed to resolve environment: ${message}`)
    }

    const { runSmartAlertsJob } = await import('../smart-alerts-job')
    const result = await runSmartAlertsJob()

    return { status: 'ok', result }
  } catch (error) {
    logger.error('handler_error', { error: error instanceof Error ? error.message : String(error) })
    throw error
  } finally {
    await cleanupAllConnections()
  }
}
