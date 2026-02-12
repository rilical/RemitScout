/**
 * AWS Context Utilities
 * 
 * Provides utilities for detecting and extracting AWS runtime context
 * (Lambda, ECS) and related metadata.
 */

import { config } from '../config'
import { createLogger } from '../logger'

const logger = createLogger('shared.aws-context')

export type LambdaContext = {
  functionName?: string
  functionVersion?: string
  requestId?: string
  timeoutMs?: number
  remainingTimeMs?: number
}

export type EcsContext = {
  taskArn?: string
  taskId?: string
  containerName?: string
  containerId?: string
}

export type AwsContext = {
  isLambda: boolean
  isECS: boolean
  region?: string
  accountId?: string
  lambda?: LambdaContext
  ecs?: EcsContext
}

const isLambda = config.runtime.isLambda
const isECS = config.runtime.isEcs

/**
 * Extracts Lambda context from AWS Lambda context object or environment.
 */
export const getLambdaContext = (context?: unknown): LambdaContext => {
  const lambdaContext: LambdaContext = {}

  if (context && typeof context === 'object') {
    const ctx = context as Record<string, unknown>
    if (typeof ctx.functionName === 'string') {
      lambdaContext.functionName = ctx.functionName
    }
    if (typeof ctx.functionVersion === 'string') {
      lambdaContext.functionVersion = ctx.functionVersion
    }
    if (typeof ctx.requestId === 'string') {
      lambdaContext.requestId = ctx.requestId
    }
    if (typeof ctx.getRemainingTimeInMillis === 'function') {
      const remaining = ctx.getRemainingTimeInMillis() as number
      if (typeof remaining === 'number') {
        lambdaContext.remainingTimeMs = remaining
      }
    }
  }

  return lambdaContext
}

/**
 * Extracts ECS context from environment variables.
 */
export const getEcsContext = async (): Promise<EcsContext> => {
  const ecsContext: EcsContext = {}

  if (config.runtime.ecsTaskArn) {
    ecsContext.taskArn = config.runtime.ecsTaskArn
    // Extract task ID from ARN: arn:aws:ecs:region:account:task/cluster/task-id
    const arnParts = config.runtime.ecsTaskArn.split('/')
    if (arnParts.length > 0) {
      ecsContext.taskId = arnParts[arnParts.length - 1]
    }
  }

  if (config.runtime.ecsContainerName) {
    ecsContext.containerName = config.runtime.ecsContainerName
  }

  // Try to fetch container metadata if available
  const metadataUri = config.runtime.ecsMetadataUriV4 || config.runtime.ecsMetadataUri
  if (metadataUri) {
    try {
      const response = await fetch(`${metadataUri}/task`, { signal: AbortSignal.timeout(1000) })
      if (response.ok) {
        const metadata = await response.json()
        if (metadata.DockerId) {
          ecsContext.containerId = metadata.DockerId
        }
        if (metadata.ContainerName) {
          ecsContext.containerName = metadata.ContainerName
        }
      }
    } catch (error) {
      logger.debug('ecs_metadata_fetch_failed', {
        metadata_uri: metadataUri,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return ecsContext
}

/**
 * Gets AWS region from environment.
 */
export const getAwsRegion = (): string | undefined => {
  return config.aws.region || undefined
}

/**
 * Gets AWS account ID from environment or STS.
 */
export const getAwsAccountId = async (): Promise<string | undefined> => {
  if (config.runtime.awsAccountId) {
    return config.runtime.awsAccountId
  }

  // Try to extract from Lambda function ARN
  const functionArn = config.runtime.lambdaFunctionArn
  if (functionArn) {
    const arnParts = functionArn.split(':')
    if (arnParts.length >= 5) {
      return arnParts[4] // Account ID is the 5th part
    }
  }

  // Try to extract from ECS task ARN
  const taskArn = config.runtime.ecsTaskArn
  if (taskArn) {
    const arnParts = taskArn.split(':')
    if (arnParts.length >= 5) {
      return arnParts[4] // Account ID is the 5th part
    }
  }

  return undefined
}

/**
 * Gets complete AWS context.
 */
export const getAwsContext = async (lambdaContext?: unknown): Promise<AwsContext> => {
  const context: AwsContext = {
    isLambda,
    isECS,
    region: getAwsRegion(),
  }

  if (isLambda) {
    context.lambda = getLambdaContext(lambdaContext)
  }

  if (isECS) {
    context.ecs = await getEcsContext()
  }

  context.accountId = await getAwsAccountId()

  return context
}

/**
 * Checks if running in Lambda and approaching timeout.
 */
export const isLambdaTimeoutWarning = (lambdaContext?: LambdaContext, threshold = 0.8): boolean => {
  if (!lambdaContext || !lambdaContext.timeoutMs || !lambdaContext.remainingTimeMs) {
    return false
  }

  const elapsed = lambdaContext.timeoutMs - lambdaContext.remainingTimeMs
  const thresholdMs = lambdaContext.timeoutMs * threshold

  return elapsed >= thresholdMs
}
