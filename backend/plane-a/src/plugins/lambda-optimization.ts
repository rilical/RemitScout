import type { FastifyInstance } from 'fastify'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.lambda-optimization')

/**
 * Lambda-specific optimizations
 */
export const setupLambdaOptimizations = (app: FastifyInstance): void => {
  const isAwsRuntime = Boolean(
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_REGION,
  )

  if (!isAwsRuntime) {
    return
  }

  // Optimize for Lambda cold starts
  // Keep connection pools warm by reusing them across invocations
  // Note: Lambda container reuse means pools persist between invocations

  app.addHook('onClose', async () => {
    // Lambda containers are reused, so we don't close connections
    // This allows connection pooling across invocations
    logger.debug('lambda_container_reuse', {
      message: 'Lambda container may be reused - keeping connections open',
    })
  })

  // Log cold start detection
  if (!(global as { lambdaWarmed?: boolean }).lambdaWarmed) {
    logger.info('lambda_cold_start', {
      message: 'Lambda cold start detected',
      region: process.env.AWS_REGION,
      function_name: process.env.AWS_LAMBDA_FUNCTION_NAME,
    })
    ;(global as { lambdaWarmed?: boolean }).lambdaWarmed = true
  } else {
    logger.debug('lambda_warm_start', {
      message: 'Lambda warm start - container reused',
    })
  }
}


