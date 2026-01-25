/**
 * ECS/Lambda entrypoint for Gold Reconciliation Job.
 *
 * Resolves database URLs from AWS secrets/SSM before running the job.
 */

import { resolveDatabaseUrl } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'
import { formatError } from '../../shared/utils/error-handling'

const logger = createLogger('script.gold-reconciliation-job-ecs')

export const handler = async (): Promise<number> => {
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
    throw new Error(`Failed to resolve database URLs: ${message}`)
  }

  const { runGoldReconciliationJob } = await import('../gold-reconciliation-job')
  await runGoldReconciliationJob()
  return 0
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      const { message, stack } = formatError(error)
      logger.error('gold_reconciliation_job_fatal', {
        error: message,
        stack,
      })
      process.exit(1)
    })
}
