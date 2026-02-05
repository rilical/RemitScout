import { Counter, Gauge } from 'prom-client'
import { recordCloudWatchMetric } from './cloudwatch-metrics'
import { metricsRegistry } from './metrics-registry'

const environmentDimension = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development'

const sqsMessagesSent = new Counter({
  name: 'sqs_messages_sent_total',
  help: 'Total SQS messages sent.',
  labelNames: ['queue_url'],
  registers: [metricsRegistry],
})

const sqsMessagesReceived = new Counter({
  name: 'sqs_messages_received_total',
  help: 'Total SQS messages received.',
  labelNames: ['queue_url'],
  registers: [metricsRegistry],
})

const sqsMessagesDeleted = new Counter({
  name: 'sqs_messages_deleted_total',
  help: 'Total SQS messages deleted.',
  labelNames: ['queue_url'],
  registers: [metricsRegistry],
})

const sqsMessagesFailed = new Counter({
  name: 'sqs_messages_failed_total',
  help: 'Total SQS message operations failed.',
  labelNames: ['queue_url', 'operation'],
  registers: [metricsRegistry],
})

const sqsVisibilityExtended = new Counter({
  name: 'sqs_visibility_extended_total',
  help: 'Total SQS message visibility timeouts extended.',
  labelNames: ['queue_url'],
  registers: [metricsRegistry],
})

const sqsQueueDepth = new Gauge({
  name: 'sqs_queue_depth',
  help: 'Current SQS queue depth (approximate number of messages).',
  labelNames: ['queue_url'],
  registers: [metricsRegistry],
})

export const trackMessageSent = (queueUrl: string, count: number = 1): void => {
  sqsMessagesSent.inc({ queue_url: queueUrl }, count)
  recordCloudWatchMetric({
    name: 'sqs_messages_sent',
    value: count,
    unit: 'Count',
    dimensions: { queue_url: queueUrl, environment: environmentDimension },
  })
}

export const trackMessageReceived = (queueUrl: string, count: number = 1): void => {
  sqsMessagesReceived.inc({ queue_url: queueUrl }, count)
  recordCloudWatchMetric({
    name: 'sqs_messages_received',
    value: count,
    unit: 'Count',
    dimensions: { queue_url: queueUrl, environment: environmentDimension },
  })
}

export const trackMessageDeleted = (queueUrl: string, count: number = 1): void => {
  sqsMessagesDeleted.inc({ queue_url: queueUrl }, count)
  recordCloudWatchMetric({
    name: 'sqs_messages_deleted',
    value: count,
    unit: 'Count',
    dimensions: { queue_url: queueUrl, environment: environmentDimension },
  })
}

export const trackMessageFailed = (queueUrl: string, operation: string): void => {
  sqsMessagesFailed.inc({ queue_url: queueUrl, operation })
  recordCloudWatchMetric({
    name: 'sqs_messages_failed',
    value: 1,
    unit: 'Count',
    dimensions: { queue_url: queueUrl, operation, environment: environmentDimension },
  })
}

export const trackVisibilityExtended = (queueUrl: string): void => {
  sqsVisibilityExtended.inc({ queue_url: queueUrl })
  recordCloudWatchMetric({
    name: 'sqs_visibility_extended',
    value: 1,
    unit: 'Count',
    dimensions: { queue_url: queueUrl, environment: environmentDimension },
  })
}

export const trackQueueDepth = (queueUrl: string, depth: number): void => {
  sqsQueueDepth.set({ queue_url: queueUrl }, depth)
  recordCloudWatchMetric({
    name: 'sqs_queue_depth',
    value: depth,
    unit: 'Count',
    dimensions: { queue_url: queueUrl, environment: environmentDimension },
  })
}
