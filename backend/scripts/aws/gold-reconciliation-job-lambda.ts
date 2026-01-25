/**
 * Lambda entrypoint for Gold Reconciliation Job.
 */

import { resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'
import { formatError } from '../../shared/utils/error-handling'

const logger = createLogger('script.gold-reconciliation-job-lambda')

export const handler = async (): Promise<{ statusCode: number; body: string }> => {
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
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('database_url_resolution_failed', {
      job_name: 'gold-reconciliation-job',
      error: message,
      stack,
    })
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'database_url_resolution_failed', message }),
    }
  }

  try {
    const { runGoldReconciliationJob } = await import('../gold-reconciliation-job')
    await runGoldReconciliationJob()
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('gold_reconciliation_job_failed', {
      error: message,
      stack,
    })
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'gold_reconciliation_job_failed', message }),
    }
  }
}
