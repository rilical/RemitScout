/**
 * AWS Context Utilities
 * 
 * Provides utilities for detecting and extracting AWS runtime context
 * (Lambda, ECS) and related metadata.
 */

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

const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
const isECS = Boolean(
  process.env.ECS_CONTAINER_METADATA_URI || process.env.ECS_CONTAINER_METADATA_URI_V4,
)

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

  // Fallback to environment variables
  if (!lambdaContext.functionName && process.env.AWS_LAMBDA_FUNCTION_NAME) {
    lambdaContext.functionName = process.env.AWS_LAMBDA_FUNCTION_NAME
  }
  if (!lambdaContext.functionVersion && process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    lambdaContext.functionVersion = process.env.AWS_LAMBDA_FUNCTION_VERSION
  }
  if (!lambdaContext.requestId && process.env.AWS_REQUEST_ID) {
    lambdaContext.requestId = process.env.AWS_REQUEST_ID
  }

  // Calculate timeout if available
  const timeoutSeconds = Number(process.env.AWS_LAMBDA_FUNCTION_TIMEOUT)
  if (Number.isFinite(timeoutSeconds) && timeoutSeconds > 0) {
    lambdaContext.timeoutMs = timeoutSeconds * 1000
  }

  return lambdaContext
}

/**
 * Extracts ECS context from environment variables.
 */
export const getEcsContext = async (): Promise<EcsContext> => {
  const ecsContext: EcsContext = {}

  if (process.env.ECS_TASK_ARN) {
    ecsContext.taskArn = process.env.ECS_TASK_ARN
    // Extract task ID from ARN: arn:aws:ecs:region:account:task/cluster/task-id
    const arnParts = process.env.ECS_TASK_ARN.split('/')
    if (arnParts.length > 0) {
      ecsContext.taskId = arnParts[arnParts.length - 1]
    }
  }

  if (process.env.ECS_CONTAINER_NAME) {
    ecsContext.containerName = process.env.ECS_CONTAINER_NAME
  }

  // Try to fetch container metadata if available
  const metadataUri = process.env.ECS_CONTAINER_METADATA_URI_V4 || process.env.ECS_CONTAINER_METADATA_URI
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
    } catch {
      // Silently fail metadata fetch
    }
  }

  return ecsContext
}

/**
 * Gets AWS region from environment.
 */
export const getAwsRegion = (): string | undefined => {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION
}

/**
 * Gets AWS account ID from environment or STS.
 */
export const getAwsAccountId = async (): Promise<string | undefined> => {
  if (process.env.AWS_ACCOUNT_ID) {
    return process.env.AWS_ACCOUNT_ID
  }

  // Try to extract from Lambda function ARN
  const functionArn = process.env.AWS_LAMBDA_FUNCTION_ARN
  if (functionArn) {
    const arnParts = functionArn.split(':')
    if (arnParts.length >= 5) {
      return arnParts[4] // Account ID is the 5th part
    }
  }

  // Try to extract from ECS task ARN
  const taskArn = process.env.ECS_TASK_ARN
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



