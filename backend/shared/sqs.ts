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
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch'
import { context as otelContext, propagation, trace, type Context } from '@opentelemetry/api'

import { createLogger } from './logger'
import { isRetryableError, isThrottlingError } from './aws-errors'
import { retry } from './retry'
import { registerSQSClient } from './connection-manager'
import { startSpan } from './tracing'
import {
  trackMessageSent,
  trackMessageReceived,
  trackMessageDeleted,
  trackMessageFailed,
  trackReceiveError,
  trackDeleteError,
  trackDlqSendError,
  trackVisibilityExtended,
  trackQueueDepth,
} from './sqs-metrics'

const logger = createLogger('shared.sqs')

let client: SQSClient | null = null
let cloudWatchClient: CloudWatchClient | null = null

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getLongPollSeconds = () => {
  const raw = toNumber(process.env.SQS_LONG_POLL_SECONDS, 20)
  if (!Number.isFinite(raw) || raw < 0) return 0
  return Math.min(20, Math.floor(raw))
}

const getQueueName = (queueUrl: string): string => {
  const normalized = queueUrl.trim().replace(/\/+$/, '')
  const parts = normalized.split('/')
  return parts[parts.length - 1] || queueUrl
}

const getClient = (): SQSClient => {
  if (!client) {
    client = new SQSClient({})
    registerSQSClient(client, 'default')
  }
  return client
}

const getCloudWatchClient = (): CloudWatchClient => {
  if (!cloudWatchClient) {
    cloudWatchClient = new CloudWatchClient({})
  }
  return cloudWatchClient
}

export type SqsMessage<T> = {
  messageId: string
  receiptHandle: string
  payload: T | null
  attributes: Record<string, string>
  messageAttributes: Record<string, string>
  traceContext?: Context
  raw: Message
}

const DEFAULT_VISIBILITY_TIMEOUT = 30
const VISIBILITY_EXTENSION_THRESHOLD = 0.5

const visibilityTimeoutCache = new Map<string, number>()

const buildTraceMessageAttributes = (): Record<string, { DataType: 'String'; StringValue: string }> | undefined => {
  const activeSpan = trace.getSpan(otelContext.active())
  if (!activeSpan) return undefined
  const carrier: Record<string, string> = {}
  propagation.inject(otelContext.active(), carrier)
  const entries = Object.entries(carrier).filter(([, value]) => Boolean(value))
  if (entries.length === 0) return undefined
  const attributes: Record<string, { DataType: 'String'; StringValue: string }> = {}
  for (const [key, value] of entries) {
    attributes[key] = { DataType: 'String', StringValue: value }
  }
  return attributes
}

const isInvalidReceiptHandleError = (message: string): boolean => {
  const normalized = message.toLowerCase()
  if (normalized.includes('receipt') && normalized.includes('handle') && normalized.includes('invalid')) {
    return true
  }
  if (normalized.includes('message does not exist')) {
    return true
  }
  if (normalized.includes('not available for visibility timeout change')) {
    return true
  }
  return false
}

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
    const message = error instanceof Error ? error.message : String(error)
    if (isInvalidReceiptHandleError(message)) {
      logger.debug('extend_visibility_skipped', {
        queue_url: queueUrl,
        reason: 'invalid_receipt_handle',
        error: message,
      })
      return
    }
    trackMessageFailed(queueUrl, 'extend_visibility')
    logger.error('extend_visibility_failed', {
      queue_url: queueUrl,
      error: message,
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

export type VisibilityTimeoutExtender = (() => Promise<void>) & {
  extendNow: () => Promise<void>
  stopExtending: () => Promise<void>
}

export const createVisibilityTimeoutExtender = (
  queueUrl: string,
  receiptHandle: string,
  onExtend?: () => void,
): VisibilityTimeoutExtender => {
  let intervalId: NodeJS.Timeout | null = null
  let lastExtension = Date.now()
  let stopped = false
  let resolvedVisibilityTimeout: number | null = null

  const start = async () => {
    const visibilityTimeout = await getVisibilityTimeout(queueUrl)
    resolvedVisibilityTimeout = visibilityTimeout
    if (stopped) return
    const extensionInterval = visibilityTimeout * 1000 * VISIBILITY_EXTENSION_THRESHOLD

    intervalId = setInterval(async () => {
      try {
        if (stopped) return
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

  const started = start().catch((error) => {
    logger.warn('visibility_extender_start_failed', {
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
  })

  const stopExtending = async () => {
    stopped = true
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  const extendNow = async () => {
    await started
    if (stopped) return
    if (!resolvedVisibilityTimeout) {
      resolvedVisibilityTimeout = await getVisibilityTimeout(queueUrl)
    }
    if (stopped) return
    await extendMessageVisibility(queueUrl, receiptHandle, resolvedVisibilityTimeout)
    lastExtension = Date.now()
    if (onExtend) onExtend()
  }

  const extender = (async () => stopExtending()) as VisibilityTimeoutExtender
  extender.extendNow = extendNow
  extender.stopExtending = stopExtending
  return extender
}

export const drainAndStop = async (extender: VisibilityTimeoutExtender): Promise<void> => {
  // Best-effort: extend once to reduce redelivery risk during shutdown, then
  // stop extending so the message can be retried elsewhere if we don't finish.
  try {
    await extender.extendNow()
  } catch (error) {
    logger.debug('drain_extend_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
  try {
    await extender.stopExtending()
  } catch (error) {
    logger.debug('drain_stop_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
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
      } catch (policyError) {
        logger.warn('dlq_redrive_policy_parse_failed', {
          queue_url: queueUrl,
          error: policyError instanceof Error ? policyError.message : String(policyError),
        })
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
 * Sends a failed message to the queue's configured DLQ.
 *
 * Error behavior:
 * - Resolves without throwing if no DLQ is configured.
 * - Catches and logs DLQ send failures to avoid crashing workers.
 * - Emits `sqs_dlq_send_errors_total` on DLQ send failures.
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

    // Redrive-friendly DLQ payload:
    // - Preserve the original payload as top-level keys when it's an object.
    // - Attach failure metadata under a reserved key to avoid breaking consumers.
    const dlqMeta = {
      originalQueueUrl: queueUrl,
      originalMessageId: originalMessage.messageId,
      receiptHandle: originalMessage.receiptHandle,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      failedAt: new Date().toISOString(),
    }

    const originalPayload = originalMessage.payload as unknown
    const dlqPayload: unknown =
      originalPayload && typeof originalPayload === 'object' && !Array.isArray(originalPayload)
        ? {
          ...(originalPayload as Record<string, unknown>),
          __rs_dlq: dlqMeta,
        }
        : {
          payload: originalPayload,
          __rs_dlq: dlqMeta,
        }

    await sendJsonMessage(dlqUrl, dlqPayload)
    logger.info('message_sent_to_dlq', {
      queue_url: queueUrl,
      dlq_url: dlqUrl,
      message_id: originalMessage.messageId,
    })
  } catch (dlqError) {
    trackDlqSendError(queueUrl)
    logger.error('dlq_send_failed', {
      queue_url: queueUrl,
      message_id: originalMessage.messageId,
      error: dlqError instanceof Error ? dlqError.message : String(dlqError),
    })
    // Don't throw - DLQ failures shouldn't break the worker
  }
}

/**
 * Sends a single JSON message with bounded retries.
 *
 * Error behavior:
 * - Retries transient AWS errors with exponential backoff.
 * - Throws when retries are exhausted.
 * - Emits send failure metrics when final send fails.
 */
export const sendJsonMessage = async <T>(
  queueUrl: string,
  payload: T,
  options?: { maxRetries?: number; retryDelayMs?: number },
): Promise<void> => {
  const maxRetries = options?.maxRetries ?? 3
  const retryDelayMs = options?.retryDelayMs ?? 100
  const queueName = getQueueName(queueUrl)

  const sendAttempt = async (): Promise<void> => {
    const sqs = getClient()
    const traceAttributes = buildTraceMessageAttributes()
    await startSpan(
      'sqs.send_json_message',
      async () => {
        await sqs.send(
          new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(payload),
            ...(traceAttributes ? { MessageAttributes: traceAttributes } : {}),
          }),
        )
      },
      {
        attributes: {
          'messaging.system': 'aws.sqs',
          'messaging.destination': queueName,
          'aws.sqs.queue_url': queueUrl,
        },
      },
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
  const queueName = getQueueName(queueUrl)

  const sendBatchAttempt = async (): Promise<void> => {
    const sqs = getClient()
    const traceAttributes = buildTraceMessageAttributes()
    await startSpan(
      'sqs.send_batch_json_messages',
      async () => {
        await sqs.send(
          new SendMessageBatchCommand({
            QueueUrl: queueUrl,
            Entries: messages.map((msg) => ({
              Id: msg.id,
              MessageBody: JSON.stringify(msg.payload),
              ...(traceAttributes ? { MessageAttributes: traceAttributes } : {}),
            })),
          }),
        )
      },
      {
        attributes: {
          'messaging.system': 'aws.sqs',
          'messaging.destination': queueName,
          'aws.sqs.queue_url': queueUrl,
        },
      },
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

/**
 * Receives and JSON-decodes SQS messages.
 *
 * Error behavior:
 * - Invalid JSON payloads are logged and returned with `payload: null`.
 * - On SQS receive failure, catches and returns `{ messages: [], error }`.
 * - Emits receive failure metrics (`sqs_receive_errors_total`) on SQS failures.
 */
export const receiveJsonMessages = async <T>(
  queueUrl: string,
  maxMessages: number,
): Promise<{ messages: SqsMessage<T>[]; error?: Error }> => {
  try {
    const waitTimeSeconds = getLongPollSeconds()
    const sqs = getClient()
    const queueName = getQueueName(queueUrl)
    const response = await startSpan(
      'sqs.receive_json_messages',
      async () => {
        return await sqs.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: Math.min(maxMessages, 10),
            WaitTimeSeconds: waitTimeSeconds,
            MessageAttributeNames: ['All'],
            AttributeNames: ['All'],
          }),
        )
      },
      {
        attributes: {
          'messaging.system': 'aws.sqs',
          'messaging.destination': queueName,
          'aws.sqs.queue_url': queueUrl,
        },
      },
    )

    const messages = response.Messages ?? []
    if (messages.length > 0) {
      trackMessageReceived(queueUrl, messages.length)
    }
    return {
      messages: messages.map((message) => {
      const body = message.Body ?? ''
      let payload: T | null = null
      if (body) {
        try {
          const parsed = JSON.parse(body) as unknown
          if (
            parsed &&
            typeof parsed === 'object' &&
            !Array.isArray(parsed) &&
            'originalPayload' in parsed &&
            ('originalQueueUrl' in parsed || 'originalMessageId' in parsed || 'error' in parsed)
          ) {
            const originalPayload = (parsed as { originalPayload?: unknown }).originalPayload
            if (originalPayload !== undefined) {
              payload = originalPayload as T
            } else {
              payload = parsed as T
            }
          } else {
            payload = parsed as T
          }
        } catch (error) {
          logger.warn('invalid_message_body', {
            queue_url: queueUrl,
            message_id: message.MessageId,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      const rawMessageAttributes = message.MessageAttributes ?? {}
      const messageAttributes: Record<string, string> = {}
      for (const [key, value] of Object.entries(rawMessageAttributes)) {
        if (value?.StringValue) {
          messageAttributes[key] = value.StringValue
        }
      }
      const traceContext = Object.keys(messageAttributes).length > 0
        ? propagation.extract(otelContext.active(), messageAttributes)
        : undefined

      return {
        messageId: message.MessageId ?? '',
        receiptHandle: message.ReceiptHandle ?? '',
        payload,
        attributes: message.Attributes ?? {},
        messageAttributes,
        traceContext,
        raw: message,
      }
      }),
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    trackMessageFailed(queueUrl, 'receive')
    trackReceiveError(queueUrl)
    logger.error('receive_failed', {
      queue_url: queueUrl,
      error: err.message,
    })
    return { messages: [], error: err }
  }
}

export type DeleteMessagesResult = {
  succeeded: string[]
  failed: string[]
}

/**
 * Deletes receipt handles in batch (up to 10 per API call).
 *
 * Error behavior:
 * - Never throws on per-batch failures.
 * - Returns failed receipt handles in `failed` for caller-side handling.
 * - Emits delete failure metrics (`sqs_delete_errors_total`) for partial/total failures.
 */
export const deleteMessages = async (
  queueUrl: string,
  receiptHandles: string[],
): Promise<DeleteMessagesResult> => {
  if (receiptHandles.length === 0) return { succeeded: [], failed: [] }

  const sqs = getClient()
  const queueName = getQueueName(queueUrl)
  const succeeded: string[] = []
  const failed: string[] = []
  const batchSize = 10
  for (let i = 0; i < receiptHandles.length; i += batchSize) {
    const batch = receiptHandles.slice(i, i + batchSize)
    const entries = batch.map((handle, index) => ({
      Id: `${i + index}`,
      ReceiptHandle: handle,
    }))

    try {
      const response = await startSpan(
        'sqs.delete_messages',
        async () => {
          return await sqs.send(
            new DeleteMessageBatchCommand({
              QueueUrl: queueUrl,
              Entries: entries,
            }),
          )
        },
        {
          attributes: {
            'messaging.system': 'aws.sqs',
            'messaging.destination': queueName,
            'aws.sqs.queue_url': queueUrl,
          },
        },
      )
      const handleById = new Map(entries.map((entry) => [entry.Id, entry.ReceiptHandle]))
      const successfulIds = (response.Successful ?? [])
        .map((entry) => entry.Id)
        .filter((id): id is string => Boolean(id))
      const failedEntries = response.Failed ?? []
      const failedIds = failedEntries
        .map((entry) => entry.Id)
        .filter((id): id is string => Boolean(id))

      for (const id of successfulIds) {
        const handle = handleById.get(id)
        if (handle) succeeded.push(handle)
      }
      for (const id of failedIds) {
        const handle = handleById.get(id)
        if (handle) failed.push(handle)
      }

      if (successfulIds.length > 0) {
        trackMessageDeleted(queueUrl, successfulIds.length)
      }
      if (failedIds.length > 0) {
        // Caller needs to know this happened; visibility timeout is the safety net.
        trackMessageFailed(queueUrl, 'delete')
        trackDeleteError(queueUrl, failedIds.length)
        logger.warn('delete_partial_failure', {
          queue_url: queueUrl,
          batch_size: batch.length,
          failed_count: failedIds.length,
          // Avoid logging receipt handles.
          failures: failedEntries.map((entry) => ({
            code: entry.Code,
            message: entry.Message,
            senderFault: entry.SenderFault,
          })),
        })
      }
    } catch (error) {
      trackMessageFailed(queueUrl, 'delete')
      trackDeleteError(queueUrl, batch.length)
      logger.error('delete_failed', {
        queue_url: queueUrl,
        batch_size: batch.length,
        error: error instanceof Error ? error.message : String(error),
      })
      failed.push(...batch)
    }
  }

  return { succeeded, failed }
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

export const getQueueAgeSeconds = async (queueUrl: string): Promise<number> => {
  try {
    const queueName = queueUrl.split('/').pop()
    if (!queueName) return 0
    const client = getCloudWatchClient()
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000)
    const response = await client.send(
      new GetMetricStatisticsCommand({
        Namespace: 'AWS/SQS',
        MetricName: 'ApproximateAgeOfOldestMessage',
        Dimensions: [{ Name: 'QueueName', Value: queueName }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 60,
        Statistics: ['Maximum'],
      }),
    )
    const points = response.Datapoints ?? []
    const maxPoint = points.reduce((best, point) => {
      if (!point || typeof point.Maximum !== 'number') return best
      if (!best || (best.Maximum ?? 0) < point.Maximum) return point
      return best
    }, undefined as typeof points[number] | undefined)
    const ageSeconds = Number(maxPoint?.Maximum ?? 0)
    return Number.isFinite(ageSeconds) ? ageSeconds : 0
  } catch (error) {
    trackMessageFailed(queueUrl, 'get_age')
    logger.error('age_failed', {
      queue_url: queueUrl,
      error: error instanceof Error ? error.message : String(error),
    })
    return 0
  }
}

export const getQueueDLQ = async (queueUrl: string): Promise<string | null> => {
  return getDLQUrl(queueUrl)
}
