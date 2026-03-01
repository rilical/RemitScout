import { Duration, Stack } from 'aws-cdk-lib'
import { CfnQueue, Queue, QueueEncryption } from 'aws-cdk-lib/aws-sqs'
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
  agentFailureQueue: Queue
  agentFailureDlq: Queue
  agentStressQueue: Queue
  agentStressDlq: Queue
  toolRequestQueue: Queue
  toolRequestDlq: Queue
  normalizationQueue: Queue
  normalizationDlq: Queue
}

export type QueueOptions = {
  envName: string
}

export const createQueues = (scope: Construct, options: QueueOptions): QueueResources => {
  const attachRedriveAllowPolicy = (dlq: Queue, sourceQueueName: string): void => {
    const dlqResource = dlq.node.defaultChild as CfnQueue
    const sourceQueueArn = Stack.of(scope).formatArn({
      service: 'sqs',
      resource: sourceQueueName,
    })
    dlqResource.redriveAllowPolicy = {
      redrivePermission: 'byQueue',
      sourceQueueArns: [sourceQueueArn],
    }
  }

  const quoteRefreshDlq = new Queue(scope, 'QuoteRefreshDlq', {
    queueName: `remit-scout-${options.envName}-quote-refresh-dlq`,
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const quoteRefreshQueueName = `remit-scout-${options.envName}-quote-refresh`
  const quoteRefreshQueue = new Queue(scope, 'QuoteRefreshQueue', {
    queueName: quoteRefreshQueueName,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    encryption: QueueEncryption.KMS_MANAGED,
    deadLetterQueue: {
      queue: quoteRefreshDlq,
      maxReceiveCount: 5,
    },
  })
  attachRedriveAllowPolicy(quoteRefreshDlq, quoteRefreshQueueName)

  const fxRateRefreshDlq = new Queue(scope, 'FxRateRefreshDlq', {
    queueName: `remit-scout-${options.envName}-fx-rate-refresh-dlq`,
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const fxRateRefreshQueueName = `remit-scout-${options.envName}-fx-rate-refresh`
  const fxRateRefreshQueue = new Queue(scope, 'FxRateRefreshQueue', {
    queueName: fxRateRefreshQueueName,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    encryption: QueueEncryption.KMS_MANAGED,
    deadLetterQueue: {
      queue: fxRateRefreshDlq,
      maxReceiveCount: 5,
    },
  })
  attachRedriveAllowPolicy(fxRateRefreshDlq, fxRateRefreshQueueName)

  const exportJobDlq = new Queue(scope, 'ExportJobDlq', {
    queueName: `remit-scout-${options.envName}-export-job-dlq`,
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const exportJobQueueName = `remit-scout-${options.envName}-export-job`
  const exportJobQueue = new Queue(scope, 'ExportJobQueue', {
    queueName: exportJobQueueName,
    visibilityTimeout: Duration.minutes(15),
    retentionPeriod: Duration.days(4),
    encryption: QueueEncryption.KMS_MANAGED,
    deadLetterQueue: {
      queue: exportJobDlq,
      maxReceiveCount: 3,
    },
  })
  attachRedriveAllowPolicy(exportJobDlq, exportJobQueueName)

  const alertEvaluationDlq = new Queue(scope, 'AlertEvaluationDlq', {
    queueName: `remit-scout-${options.envName}-alert-evaluation-dlq`,
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const alertEvaluationQueueName = `remit-scout-${options.envName}-alert-evaluation`
  const alertEvaluationQueue = new Queue(scope, 'AlertEvaluationQueue', {
    queueName: alertEvaluationQueueName,
    visibilityTimeout: Duration.minutes(15),
    retentionPeriod: Duration.days(4),
    encryption: QueueEncryption.KMS_MANAGED,
    deadLetterQueue: {
      queue: alertEvaluationDlq,
      maxReceiveCount: 5,
    },
  })
  attachRedriveAllowPolicy(alertEvaluationDlq, alertEvaluationQueueName)

  const ingestFanoutDlq = new Queue(scope, 'IngestFanoutDlq', {
    queueName: `remit-scout-${options.envName}-ingest-fanout-dlq`,
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const ingestFanoutQueueName = `remit-scout-${options.envName}-ingest-fanout`
  const ingestFanoutQueue = new Queue(scope, 'IngestFanoutQueue', {
    queueName: ingestFanoutQueueName,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    encryption: QueueEncryption.KMS_MANAGED,
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
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const ingestFanoutTier2QueueName = `remit-scout-${options.envName}-ingest-fanout-tier2`
  const ingestFanoutTier2Queue = new Queue(scope, 'IngestFanoutTier2Queue', {
    queueName: ingestFanoutTier2QueueName,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    encryption: QueueEncryption.KMS_MANAGED,
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
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const goldLiveQueueName = `remit-scout-${options.envName}-gold-live`
  const goldLiveQueue = new Queue(scope, 'GoldLiveQueue', {
    queueName: goldLiveQueueName,
    visibilityTimeout: Duration.minutes(2),
    retentionPeriod: Duration.days(2),
    encryption: QueueEncryption.KMS_MANAGED,
    deadLetterQueue: {
      queue: goldLiveDlq,
      maxReceiveCount: 5,
    },
  })
  attachRedriveAllowPolicy(goldLiveDlq, goldLiveQueueName)

  const notificationsDlq = new Queue(scope, 'NotificationsDlq', {
    queueName: `remit-scout-${options.envName}-notifications-dlq`,
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const notificationsQueueName = `remit-scout-${options.envName}-notifications`
  const notificationsQueue = new Queue(scope, 'NotificationsQueue', {
    queueName: notificationsQueueName,
    visibilityTimeout: Duration.minutes(2),
    retentionPeriod: Duration.days(2),
    encryption: QueueEncryption.KMS_MANAGED,
    deadLetterQueue: {
      queue: notificationsDlq,
      maxReceiveCount: 5,
    },
  })
  attachRedriveAllowPolicy(notificationsDlq, notificationsQueueName)

  const opsAlertsDlq = new Queue(scope, 'OpsAlertsDlq', {
    queueName: `remit-scout-${options.envName}-ops-alerts-dlq`,
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const opsAlertsQueueName = `remit-scout-${options.envName}-ops-alerts`
  const opsAlertsQueue = new Queue(scope, 'OpsAlertsQueue', {
    queueName: opsAlertsQueueName,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    encryption: QueueEncryption.KMS_MANAGED,
    deadLetterQueue: {
      queue: opsAlertsDlq,
      maxReceiveCount: 5,
    },
  })
  attachRedriveAllowPolicy(opsAlertsDlq, opsAlertsQueueName)

  // Agent failure queue: receives structured failure bundles from the agent
  // orchestrator when an agent run terminates abnormally. Retention is long
  // (14 days) so on-call engineers can inspect failures after the fact.
  const agentFailureDlq = new Queue(scope, 'AgentFailureDlq', {
    queueName: `remit-scout-${options.envName}-agent-failure-dlq`,
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const agentFailureQueueName = `remit-scout-${options.envName}-agent-failure`
  const agentFailureQueue = new Queue(scope, 'AgentFailureQueue', {
    queueName: agentFailureQueueName,
    // Agent failure processing can be slow: allow time to page on-call and
    // correlate traces before the message becomes visible again.
    visibilityTimeout: Duration.minutes(10),
    retentionPeriod: Duration.days(7),
    encryption: QueueEncryption.KMS_MANAGED,
    deadLetterQueue: {
      queue: agentFailureDlq,
      // Low maxReceiveCount: if we cannot process a failure bundle after 3
      // attempts, send it to the DLQ rather than retrying indefinitely.
      maxReceiveCount: 3,
    },
  })
  attachRedriveAllowPolicy(agentFailureDlq, agentFailureQueueName)

  const agentStressDlq = new Queue(scope, 'AgentStressDlq', {
    queueName: `remit-scout-${options.envName}-agent-stress-dlq`,
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const agentStressQueueName = `remit-scout-${options.envName}-agent-stress`
  const agentStressQueue = new Queue(scope, 'AgentStressQueue', {
    queueName: agentStressQueueName,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    encryption: QueueEncryption.KMS_MANAGED,
    deadLetterQueue: {
      queue: agentStressDlq,
      maxReceiveCount: 3,
    },
  })
  attachRedriveAllowPolicy(agentStressDlq, agentStressQueueName)

  const toolRequestDlq = new Queue(scope, 'ToolRequestDlq', {
    queueName: `remit-scout-${options.envName}-tool-request-dlq`,
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const toolRequestQueueName = `remit-scout-${options.envName}-tool-request`
  const toolRequestQueue = new Queue(scope, 'ToolRequestQueue', {
    queueName: toolRequestQueueName,
    visibilityTimeout: Duration.minutes(10),
    retentionPeriod: Duration.days(4),
    encryption: QueueEncryption.KMS_MANAGED,
    deadLetterQueue: {
      queue: toolRequestDlq,
      maxReceiveCount: 3,
    },
  })
  attachRedriveAllowPolicy(toolRequestDlq, toolRequestQueueName)

  // Normalization queue: carries raw provider payloads that need to be
  // normalized into the canonical rate schema before being written to Silver.
  const normalizationDlq = new Queue(scope, 'NormalizationDlq', {
    queueName: `remit-scout-${options.envName}-normalization-dlq`,
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.KMS_MANAGED,
  })

  const normalizationQueueName = `remit-scout-${options.envName}-normalization`
  const normalizationQueue = new Queue(scope, 'NormalizationQueue', {
    queueName: normalizationQueueName,
    visibilityTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(4),
    encryption: QueueEncryption.KMS_MANAGED,
    deadLetterQueue: {
      queue: normalizationDlq,
      maxReceiveCount: 5,
    },
  })
  attachRedriveAllowPolicy(normalizationDlq, normalizationQueueName)

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
    agentFailureQueue,
    agentFailureDlq,
    agentStressQueue,
    agentStressDlq,
    toolRequestQueue,
    toolRequestDlq,
    normalizationQueue,
    normalizationDlq,
  }
}
