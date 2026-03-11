import { resolveDatabaseUrl, resolveAwsEnv } from '../../shared/aws-params'
import { cleanupAllConnections } from '../../shared/connection-manager'
import { createLogger } from '../../shared/logger'
import { formatError } from '../../shared/utils/error-handling'

const logger = createLogger('script.alert-corridor-refresh-lambda')

export const handler = async (): Promise<{ status: string; result?: unknown }> => {
  try {
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
          envVar: 'REDIS_URL',
          secretArnEnv: 'REDIS_SECRET_ARN',
          ssmNameEnv: 'REDIS_SSM_NAME',
          jsonKeys: ['url', 'REDIS_URL'],
          required: false,
        },
        {
          envVar: 'QUOTE_REFRESH_QUEUE_URL',
          secretArnEnv: 'QUOTE_REFRESH_QUEUE_SECRET_ARN',
          ssmNameEnv: 'QUOTE_REFRESH_QUEUE_SSM_NAME',
          jsonKeys: ['url', 'QUOTE_REFRESH_QUEUE_URL'],
          required: false,
        },
      ])
    } catch (error: unknown) {
      const { message, stack } = formatError(error)
      logger.error('env_resolution_failed', {
        job_name: 'alert-corridor-refresh',
        error: message,
        stack,
      })
      throw new Error(`Failed to resolve environment: ${message}`)
    }

    const { runAlertCorridorRefreshJob } = await import('../alert-corridor-refresh-job')
    const result = await runAlertCorridorRefreshJob()

    return { status: 'ok', result }
  } catch (error) {
    logger.error('handler_error', { error: error instanceof Error ? error.message : String(error) })
    throw error
  } finally {
    await cleanupAllConnections()
  }
}
