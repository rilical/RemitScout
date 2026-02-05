import { Duration, Stack } from 'aws-cdk-lib'
import { CfnQueue, Queue } from 'aws-cdk-lib/aws-sqs'
import type { Construct } from 'constructs'

export type QueueResources = {
  quoteRefreshQueue: Queue
  quoteRefreshDlq: Queue
  fxRateRefreshQueue: Queue
  fxRateRefreshDlq: Queue
  exportJobQueue: Queue
  exportJobDlq: Queue
  alertEvaluationQueue: Queue
  alertEvaluationDlq: Queue
  ingestFanoutQueue: Queue
  ingestFanoutDlq: Queue
  ingestFanoutTier2Queue: Queue
  ingestFanoutTier2Dlq: Queue
  goldLiveQueue: Queue
  goldLiveDlq: Queue
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

  const fxRateRefreshDlq = new Queue(scope, 'FxRateRefreshDlq', {
    queueName: `remit-scout-${options.envName}-fx-rate-refresh-dlq`,
    retentionPeriod: Duration.days(14),
  })

  const fxRateRefreshQueue = new Queue(scope, 'FxRateRefreshQueue', {
    queueName: `remit-scout-${options.envName}-fx-rate-refresh`,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    deadLetterQueue: {
      queue: fxRateRefreshDlq,
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

  const ingestFanoutTier2Dlq = new Queue(scope, 'IngestFanoutTier2Dlq', {
    queueName: `remit-scout-${options.envName}-ingest-fanout-tier2-dlq`,
    retentionPeriod: Duration.days(14),
  })

  const ingestFanoutTier2QueueName = `remit-scout-${options.envName}-ingest-fanout-tier2`
  const ingestFanoutTier2Queue = new Queue(scope, 'IngestFanoutTier2Queue', {
    queueName: ingestFanoutTier2QueueName,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    deadLetterQueue: {
      queue: ingestFanoutTier2Dlq,
      maxReceiveCount: 5,
    },
  })
  const ingestFanoutTier2DlqResource = ingestFanoutTier2Dlq.node.defaultChild as CfnQueue
  const ingestFanoutTier2QueueArn = Stack.of(scope).formatArn({
    service: 'sqs',
    resource: ingestFanoutTier2QueueName,
  })
  ingestFanoutTier2DlqResource.redriveAllowPolicy = {
    redrivePermission: 'byQueue',
    sourceQueueArns: [ingestFanoutTier2QueueArn],
  }

  const goldLiveDlq = new Queue(scope, 'GoldLiveDlq', {
    queueName: `remit-scout-${options.envName}-gold-live-dlq`,
    retentionPeriod: Duration.days(14),
  })

  const goldLiveQueue = new Queue(scope, 'GoldLiveQueue', {
    queueName: `remit-scout-${options.envName}-gold-live`,
    visibilityTimeout: Duration.minutes(2),
    retentionPeriod: Duration.days(2),
    deadLetterQueue: {
      queue: goldLiveDlq,
      maxReceiveCount: 5,
    },
  })

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
    fxRateRefreshQueue,
    fxRateRefreshDlq,
    exportJobQueue,
    exportJobDlq,
    alertEvaluationQueue,
    alertEvaluationDlq,
    ingestFanoutQueue,
    ingestFanoutDlq,
    ingestFanoutTier2Queue,
    ingestFanoutTier2Dlq,
    goldLiveQueue,
    goldLiveDlq,
    notificationsQueue,
    notificationsDlq,
    opsAlertsQueue,
    opsAlertsDlq,
  }
}
