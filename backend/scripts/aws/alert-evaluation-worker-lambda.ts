import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { cleanupAllConnections } from '../../shared/connection-manager'
import { createLogger } from '../../shared/logger'

const logger = createLogger('script.alert-evaluation-worker-lambda')

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
        envVar: 'ALERT_EVALUATION_QUEUE_URL',
        secretArnEnv: 'ALERT_EVALUATION_QUEUE_SECRET_ARN',
        ssmNameEnv: 'ALERT_EVALUATION_QUEUE_SSM_NAME',
        jsonKeys: ['url', 'ALERT_EVALUATION_QUEUE_URL'],
        required: false,
      },
    ])

    const { runAlertEvaluationWorker } = await import('../alert-evaluation-worker')
    await runAlertEvaluationWorker({ once: true })

    return { status: 'ok' }
  } catch (error) {
    logger.error('handler_error', { error: error instanceof Error ? error.message : String(error) })
    throw error
  } finally {
    await cleanupAllConnections()
  }
}
