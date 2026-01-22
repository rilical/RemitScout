import {
  DeleteMessageBatchCommand,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  SendMessageBatchCommand,
  SendMessageCommand,
  ChangeMessageVisibilityCommand,
  SQSClient,
  type Message,
} from '@aws-sdk/client-sqs'

import { createLogger } from './logger'
import { isRetryableError, isThrottlingError } from './aws-errors'
import { retry } from './retry'
import { registerSQSClient } from './connection-manager'
import {
  trackMessageSent,
  trackMessageReceived,
  trackMessageDeleted,
  trackMessageFailed,
  trackVisibilityExtended,
  trackQueueDepth,
} from './sqs-metrics'

const logger = createLogger('shared.sqs')

let client: SQSClient | null = null

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getLongPollSeconds = () => {
  const raw = toNumber(process.env.SQS_LONG_POLL_SECONDS, 20)
  if (!Number.isFinite(raw) || raw < 0) return 0
  return Math.min(20, Math.floor(raw))
}

const getClient = (): SQSClient => {
  if (!client) {
    client = new SQSClient({})
    registerSQSClient(client, 'default')
  }
  return client
}

export type SqsMessage<T> = {
  messageId: string
  receiptHandle: string
  payload: T | null
  attributes: Record<string, string>
  raw: Message
}

const DEFAULT_VISIBILITY_TIMEOUT = 30
const VISIBILITY_EXTENSION_THRESHOLD = 0.5

const visibilityTimeoutCache = new Map<string, number>()

const getVisibilityTimeout = async (queueUrl: string): Promise<number> => {
  if (visibilityTimeoutCache.has(queueUrl)) {
    return visibilityTimeoutCache.get(queueUrl)!
  }

  try {
    const sqs = getClient()
    const response = await sqs.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['VisibilityTimeout'],
      }),
    )
    const timeout = Number(response.Attributes?.VisibilityTimeout || DEFAULT_VISIBILITY_TIMEOUT)
    visibilityTimeoutCache.set(queueUrl, timeout)
    return timeout
  } catch (error) {
    logger.warn('failed_to_get_visibility_timeout', {
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
    return DEFAULT_VISIBILITY_TIMEOUT
  }
}

export const extendMessageVisibility = async (
  queueUrl: string,
  receiptHandle: string,
  visibilityTimeoutSeconds: number,
): Promise<void> => {
  try {
    const sqs = getClient()
    await sqs.send(
      new ChangeMessageVisibilityCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
        VisibilityTimeout: visibilityTimeoutSeconds,
      }),
    )
    trackVisibilityExtended(queueUrl)
    logger.debug('message_visibility_extended', {
      queue_url: queueUrl,
      visibility_timeout: visibilityTimeoutSeconds,
    })
  } catch (error) {
    trackMessageFailed(queueUrl, 'extend_visibility')
    logger.error('extend_visibility_failed', {
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export const extendVisibilityTimeout = async (
  queueUrl: string,
  receiptHandle: string,
): Promise<void> => {
  const visibilityTimeout = await getVisibilityTimeout(queueUrl)
  await extendMessageVisibility(queueUrl, receiptHandle, visibilityTimeout)
}

export const createVisibilityTimeoutExtender = (
  queueUrl: string,
  receiptHandle: string,
  onExtend?: () => void,
): (() => Promise<void>) => {
  let intervalId: NodeJS.Timeout | null = null
  let lastExtension = Date.now()

  const start = async () => {
    const visibilityTimeout = await getVisibilityTimeout(queueUrl)
    const extensionInterval = visibilityTimeout * 1000 * VISIBILITY_EXTENSION_THRESHOLD

    intervalId = setInterval(async () => {
      try {
        const elapsed = Date.now() - lastExtension
        if (elapsed >= extensionInterval) {
          await extendMessageVisibility(queueUrl, receiptHandle, visibilityTimeout)
          lastExtension = Date.now()
          if (onExtend) {
            onExtend()
          }
        }
      } catch (error) {
        logger.warn('auto_visibility_extension_failed', {
          queue_url: queueUrl,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }, extensionInterval)
  }

  start().catch((error) => {
    logger.warn('visibility_extender_start_failed', {
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
  })

  return async () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}

/**
 * Gets the Dead Letter Queue URL for a given queue.
 */
export const getDLQUrl = async (queueUrl: string): Promise<string | null> => {
  try {
    const sqs = getClient()
    const response = await sqs.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['RedrivePolicy'],
      }),
    )
    const redrivePolicy = response.Attributes?.RedrivePolicy
    if (redrivePolicy) {
      try {
        const policy = JSON.parse(redrivePolicy)
        const dlqArn = policy.deadLetterTargetArn
        if (dlqArn) {
          // Extract queue name from ARN and construct URL
          // ARN format: arn:aws:sqs:region:account:queue-name
          const arnParts = dlqArn.split(':')
          if (arnParts.length >= 6) {
            const region = arnParts[3]
            const accountId = arnParts[4]
            const queueName = arnParts[5]
            return `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`
          }
        }
        return null
      } catch {
        return null
      }
    }
    return null
  } catch (error) {
    logger.debug('dlq_check_failed', {
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Sends a message to the Dead Letter Queue.
 */
export const sendToDLQ = async <T>(
  queueUrl: string,
  originalMessage: SqsMessage<T>,
  error: Error,
): Promise<void> => {
  try {
    const dlqUrl = await getDLQUrl(queueUrl)
    if (!dlqUrl) {
      logger.warn('dlq_not_configured', {
        queue_url: queueUrl,
        message_id: originalMessage.messageId,
      })
      return
    }

    const dlqPayload = {
      originalQueueUrl: queueUrl,
      originalMessageId: originalMessage.messageId,
      originalPayload: originalMessage.payload,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      failedAt: new Date().toISOString(),
      receiptHandle: originalMessage.receiptHandle,
    }

    await sendJsonMessage(dlqUrl, dlqPayload)
    logger.info('message_sent_to_dlq', {
      queue_url: queueUrl,
      dlq_url: dlqUrl,
      message_id: originalMessage.messageId,
    })
  } catch (dlqError) {
    logger.error('dlq_send_failed', {
      queue_url: queueUrl,
      message_id: originalMessage.messageId,
      error: dlqError instanceof Error ? dlqError.message : String(dlqError),
    })
    // Don't throw - DLQ failures shouldn't break the worker
  }
}

export const sendJsonMessage = async <T>(
  queueUrl: string,
  payload: T,
  options?: { maxRetries?: number; retryDelayMs?: number },
): Promise<void> => {
  const maxRetries = options?.maxRetries ?? 3
  const retryDelayMs = options?.retryDelayMs ?? 100

  const sendAttempt = async (): Promise<void> => {
    const sqs = getClient()
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
      }),
    )
  }

  try {
    await retry(sendAttempt, {
      maxRetries,
      initialDelayMs: retryDelayMs,
      backoffMultiplier: 2,
      maxDelayMs: 10000,
      retryable: (error) => {
        if (!isRetryableError(error)) {
          return false
        }
        if (isThrottlingError(error)) {
          return true
        }
        return true
      },
    })
    trackMessageSent(queueUrl)
  } catch (error) {
    trackMessageFailed(queueUrl, 'send')
    logger.error('send_failed', {
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export const sendBatchJsonMessages = async <T>(
  queueUrl: string,
  messages: Array<{ id: string; payload: T }>,
  options?: { maxRetries?: number; retryDelayMs?: number },
): Promise<Array<{ id: string; success: boolean; error?: string }>> => {
  if (messages.length === 0) return []
  if (messages.length > 10) {
    throw new Error('Batch size cannot exceed 10 messages')
  }

  const maxRetries = options?.maxRetries ?? 3
  const retryDelayMs = options?.retryDelayMs ?? 100

  const sendBatchAttempt = async (): Promise<void> => {
    const sqs = getClient()
    await sqs.send(
      new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: messages.map((msg) => ({
          Id: msg.id,
          MessageBody: JSON.stringify(msg.payload),
        })),
      }),
    )
  }

  try {
    await retry(sendBatchAttempt, {
      maxRetries,
      initialDelayMs: retryDelayMs,
      backoffMultiplier: 2,
      maxDelayMs: 10000,
      retryable: (error) => {
        if (!isRetryableError(error)) {
          return false
        }
        return true
      },
    })

    trackMessageSent(queueUrl, messages.length)
    return messages.map((msg) => ({ id: msg.id, success: true }))
  } catch (error) {
    trackMessageFailed(queueUrl, 'batch_send')
    logger.error('batch_send_failed', {
      queue_url: queueUrl,
      message_count: messages.length,
      error: error instanceof Error ? error.message : String(error),
    })

    return messages.map((msg) => ({
      id: msg.id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }))
  }
}

export const receiveJsonMessages = async <T>(
  queueUrl: string,
  maxMessages: number,
): Promise<SqsMessage<T>[]> => {
  try {
    const waitTimeSeconds = getLongPollSeconds()
    const sqs = getClient()
    const response = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: Math.min(maxMessages, 10),
        WaitTimeSeconds: waitTimeSeconds,
        MessageAttributeNames: ['All'],
        AttributeNames: ['All'],
      }),
    )

    const messages = response.Messages ?? []
    if (messages.length > 0) {
      trackMessageReceived(queueUrl, messages.length)
    }
    return messages.map((message) => {
      const body = message.Body ?? ''
      let payload: T | null = null
      if (body) {
        try {
          payload = JSON.parse(body) as T
        } catch (error) {
          logger.warn('invalid_message_body', {
            queue_url: queueUrl,
            message_id: message.MessageId,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      return {
        messageId: message.MessageId ?? '',
        receiptHandle: message.ReceiptHandle ?? '',
        payload,
        attributes: message.Attributes ?? {},
        raw: message,
      }
    })
  } catch (error) {
    logger.error('receive_failed', {
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

export const deleteMessages = async (
  queueUrl: string,
  receiptHandles: string[],
): Promise<void> => {
  if (receiptHandles.length === 0) return

  const sqs = getClient()
  const entries = receiptHandles.map((handle, index) => ({
    Id: `${index}`,
    ReceiptHandle: handle,
  }))

  try {
    await sqs.send(
      new DeleteMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries,
      }),
    )
    trackMessageDeleted(queueUrl, receiptHandles.length)
  } catch (error) {
    trackMessageFailed(queueUrl, 'delete')
    logger.error('delete_failed', {
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const getQueueDepth = async (queueUrl: string): Promise<number> => {
  try {
    const sqs = getClient()
    const response = await sqs.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['ApproximateNumberOfMessages'],
      }),
    )
    const count = response.Attributes?.ApproximateNumberOfMessages
    const depth = count ? Number(count) : 0
    trackQueueDepth(queueUrl, depth)
    return depth
  } catch (error) {
    trackMessageFailed(queueUrl, 'get_depth')
    logger.error('depth_failed', {
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
    return 0
  }
}

export type QueueStats = {
  visible: number
  inFlight: number
  delayed: number
  total: number
}

export const getQueueStats = async (queueUrl: string): Promise<QueueStats> => {
  try {
    const sqs = getClient()
    const response = await sqs.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: [
          'ApproximateNumberOfMessages',
          'ApproximateNumberOfMessagesNotVisible',
          'ApproximateNumberOfMessagesDelayed',
        ],
      }),
    )
    const visible = Number(response.Attributes?.ApproximateNumberOfMessages ?? 0)
    const inFlight = Number(response.Attributes?.ApproximateNumberOfMessagesNotVisible ?? 0)
    const delayed = Number(response.Attributes?.ApproximateNumberOfMessagesDelayed ?? 0)
    const total = visible + inFlight + delayed
    trackQueueDepth(queueUrl, total)
    return { visible, inFlight, delayed, total }
  } catch (error) {
    trackMessageFailed(queueUrl, 'get_stats')
    logger.error('stats_failed', {
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
    return { visible: 0, inFlight: 0, delayed: 0, total: 0 }
  }
}

export const getQueueDLQ = async (queueUrl: string): Promise<string | null> => {
  return getDLQUrl(queueUrl)
}
