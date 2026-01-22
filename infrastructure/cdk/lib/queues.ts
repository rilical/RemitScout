import { Duration, Stack } from 'aws-cdk-lib'
import { CfnQueue, Queue } from 'aws-cdk-lib/aws-sqs'
import type { Construct } from 'constructs'

export type QueueResources = {
  quoteRefreshQueue: Queue
  quoteRefreshDlq: Queue
  exportJobQueue: Queue
  exportJobDlq: Queue
  alertEvaluationQueue: Queue
  alertEvaluationDlq: Queue
  ingestFanoutQueue: Queue
  ingestFanoutDlq: Queue
  notificationsQueue: Queue
  notificationsDlq: Queue
  opsAlertsQueue: Queue
  opsAlertsDlq: Queue
}

export type QueueOptions = {
  envName: string
}

export const createQueues = (scope: Construct, options: QueueOptions): QueueResources => {
  const quoteRefreshDlq = new Queue(scope, 'QuoteRefreshDlq', {
    queueName: `remit-scout-${options.envName}-quote-refresh-dlq`,
    retentionPeriod: Duration.days(14),
  })

  const quoteRefreshQueue = new Queue(scope, 'QuoteRefreshQueue', {
    queueName: `remit-scout-${options.envName}-quote-refresh`,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    deadLetterQueue: {
      queue: quoteRefreshDlq,
      maxReceiveCount: 5,
    },
  })

  const exportJobDlq = new Queue(scope, 'ExportJobDlq', {
    queueName: `remit-scout-${options.envName}-export-job-dlq`,
    retentionPeriod: Duration.days(14),
  })

  const exportJobQueue = new Queue(scope, 'ExportJobQueue', {
    queueName: `remit-scout-${options.envName}-export-job`,
    visibilityTimeout: Duration.minutes(15),
    retentionPeriod: Duration.days(4),
    deadLetterQueue: {
      queue: exportJobDlq,
      maxReceiveCount: 3,
    },
  })

  const alertEvaluationDlq = new Queue(scope, 'AlertEvaluationDlq', {
    queueName: `remit-scout-${options.envName}-alert-evaluation-dlq`,
    retentionPeriod: Duration.days(14),
  })

  const alertEvaluationQueue = new Queue(scope, 'AlertEvaluationQueue', {
    queueName: `remit-scout-${options.envName}-alert-evaluation`,
    visibilityTimeout: Duration.minutes(15),
    retentionPeriod: Duration.days(4),
    deadLetterQueue: {
      queue: alertEvaluationDlq,
      maxReceiveCount: 5,
    },
  })

  const ingestFanoutDlq = new Queue(scope, 'IngestFanoutDlq', {
    queueName: `remit-scout-${options.envName}-ingest-fanout-dlq`,
    retentionPeriod: Duration.days(14),
  })

  const ingestFanoutQueueName = `remit-scout-${options.envName}-ingest-fanout`
  const ingestFanoutQueue = new Queue(scope, 'IngestFanoutQueue', {
    queueName: ingestFanoutQueueName,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    deadLetterQueue: {
      queue: ingestFanoutDlq,
      maxReceiveCount: 5,
    },
  })
  const ingestFanoutDlqResource = ingestFanoutDlq.node.defaultChild as CfnQueue
  const ingestFanoutQueueArn = Stack.of(scope).formatArn({
    service: 'sqs',
    resource: ingestFanoutQueueName,
  })
  ingestFanoutDlqResource.redriveAllowPolicy = {
    redrivePermission: 'byQueue',
    sourceQueueArns: [ingestFanoutQueueArn],
  }

  const notificationsDlq = new Queue(scope, 'NotificationsDlq', {
    queueName: `remit-scout-${options.envName}-notifications-dlq`,
    retentionPeriod: Duration.days(14),
  })

  const notificationsQueue = new Queue(scope, 'NotificationsQueue', {
    queueName: `remit-scout-${options.envName}-notifications`,
    visibilityTimeout: Duration.minutes(2),
    retentionPeriod: Duration.days(2),
    deadLetterQueue: {
      queue: notificationsDlq,
      maxReceiveCount: 5,
    },
  })

  const opsAlertsDlq = new Queue(scope, 'OpsAlertsDlq', {
    queueName: `remit-scout-${options.envName}-ops-alerts-dlq`,
    retentionPeriod: Duration.days(14),
  })

  const opsAlertsQueue = new Queue(scope, 'OpsAlertsQueue', {
    queueName: `remit-scout-${options.envName}-ops-alerts`,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    deadLetterQueue: {
      queue: opsAlertsDlq,
      maxReceiveCount: 5,
    },
  })

  return {
    quoteRefreshQueue,
    quoteRefreshDlq,
    exportJobQueue,
    exportJobDlq,
    alertEvaluationQueue,
    alertEvaluationDlq,
    ingestFanoutQueue,
    ingestFanoutDlq,
    notificationsQueue,
    notificationsDlq,
    opsAlertsQueue,
    opsAlertsDlq,
  }
}
