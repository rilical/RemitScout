/**
 * B2C Refresh Worker ECS Entry Point
 * 
 * ECS task entry point for B2C refresh worker.
 * Resolves AWS parameters and calls the worker.
 * 
 * Note: This is for ECS deployments, not Lambda.
 */

import { createLogger } from '../../shared/logger'
import { resolveAwsEnv, resolveDatabaseUrl } from '../../shared/aws-params'
import { formatError } from '../../shared/utils/error-handling'

const logger = createLogger('script.b2c-refresh-worker-ecs')

export const handler = async (): Promise<number> => {
  // Resolve database URL with error handling
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

    // Validate database URL is set
    if (!process.env.DATABASE_URL_PLANE_B) {
      throw new Error('DATABASE_URL_PLANE_B is required but not set after resolution')
    }
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('database_url_resolution_failed', {
      job_name: 'b2c-refresh-worker',
      env_vars_attempted: [
        'DATABASE_URL_PLANE_B',
        'PLANE_B_DB_SECRET_ARN',
        'PLANE_B_DB_SSM_NAME',
        'PLANE_B_DB_HOST',
        'PLANE_B_DB_PORT',
        'PLANE_B_DB_NAME',
      ],
      error: message,
      stack,
    })
    throw new Error(`Failed to resolve database URL: ${message}`)
  }

  const { createShutdownHandler } = await import('../../shared/shutdown')
  const { isShutdownRequested } = createShutdownHandler({
    timeoutMs: 30000,
    logger,
    onShutdown: async () => {
      logger.info('b2c_refresh_worker_shutdown', { reason: 'shutdown_requested' })
    },
  })

  if (isShutdownRequested()) {
    logger.info('b2c_refresh_worker_skipped', { reason: 'shutdown_requested' })
    return 0
  }

  // Resolve AWS environment variables with error handling
  try {
    await resolveAwsEnv([
      {
        envVar: 'REDIS_URL',
        secretArnEnv: 'REDIS_SECRET_ARN',
        ssmNameEnv: 'REDIS_SSM_NAME',
        jsonKeys: ['url', 'REDIS_URL', 'redis_url'],
        required: true,
      },
    ])

    // Validate required env vars are present
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL is required but not set after resolution')
    }
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('aws_env_resolution_failed', {
      job_name: 'b2c-refresh-worker',
      env_vars_attempted: ['REDIS_URL', 'REDIS_SECRET_ARN', 'REDIS_SSM_NAME'],
      error: message,
      stack,
    })
    throw new Error(`Failed to resolve AWS environment variables: ${message}`)
  }

  const { runStartupChecks } = await import('../../shared/startup')
  await runStartupChecks({
    requirements: {
      requirePlaneB: true,
      requireRedis: true,
      requireQueues: true,
      requireStorage: true,
    },
  })

  // Import and run worker (using direct import path, not path.resolve)
  try {
    const { runB2cRefreshWorkerLoop } = await import('../b2c-refresh-worker')
    return await runB2cRefreshWorkerLoop()
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    logger.error('b2c_refresh_worker_failed', {
      error: message,
      stack,
    })
    throw error
  }
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then(code => process.exit(code))
    .catch((error: unknown) => {
      const { message, stack } = formatError(error)
      logger.error('b2c_refresh_worker_fatal', {
        error: message,
        stack,
      })
      process.exit(1)
    })
}
