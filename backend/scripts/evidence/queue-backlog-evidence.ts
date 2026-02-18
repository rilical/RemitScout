import { GetQueueUrlCommand, SQSClient } from '@aws-sdk/client-sqs'

import { config } from '../../shared/config'
import { getQueueAgeSeconds, getQueueDLQ, getQueueDepth, getQueueStats } from '../../shared/sqs'
import { formatError } from '../../shared/utils/error-handling'
import {
  DEFAULT_EVIDENCE_BUDGETS,
  getGithubActionsRunUrl,
  resolveCaseEnv,
  writeEvidenceResult,
  type EvidenceFinding,
  type EvidencePointer,
  type EvidenceResult,
} from '../lib/evidence'

type QueueKind =
  | 'quote_refresh'
  | 'fx_rate_refresh'
  | 'ingest_fanout'
  | 'ingest_fanout_tier2'
  | 'exports'
  | 'notifications'
  | 'ops_alerts'
  | 'gold_live'

const QUEUE_KINDS: QueueKind[] = [
  'quote_refresh',
  'fx_rate_refresh',
  'ingest_fanout',
  'ingest_fanout_tier2',
  'exports',
  'notifications',
  'ops_alerts',
  'gold_live',
]

const isQueueKind = (value: string): value is QueueKind =>
  QUEUE_KINDS.includes(value as QueueKind)

const getQueueName = (env: string, kind: QueueKind): string => {
  const prefix = `remit-scout-${env}-`
  switch (kind) {
    case 'quote_refresh': return `${prefix}quote-refresh`
    case 'fx_rate_refresh': return `${prefix}fx-rate-refresh`
    case 'exports': return `${prefix}export-job`
    case 'ingest_fanout': return `${prefix}ingest-fanout`
    case 'ingest_fanout_tier2': return `${prefix}ingest-fanout-tier2`
    case 'notifications': return `${prefix}notifications`
    case 'ops_alerts': return `${prefix}ops-alerts`
    case 'gold_live': return `${prefix}gold-live`
  }
}

const resolveQueueUrlFromConfig = (kind: QueueKind): string => {
  switch (kind) {
    case 'quote_refresh': return config.queues.quoteRefreshUrl
    case 'fx_rate_refresh': return config.queues.fxRateRefreshUrl
    case 'exports': return config.queues.exports.url
    case 'ingest_fanout': return config.queues.ingestFanout.tier1Url || config.queues.ingestFanout.url
    case 'ingest_fanout_tier2': return config.queues.ingestFanout.tier2Url
    case 'notifications': return config.queues.notifications.url
    case 'ops_alerts': return config.queues.opsAlerts.url
    case 'gold_live': return config.queues.goldLive.url
  }
}

const getSqsClient = (): SQSClient => new SQSClient({})

const resolveQueueUrl = async (env: string, kind: QueueKind): Promise<{ queueUrl: string; source: string; queueName: string }> => {
  const fromConfig = String(resolveQueueUrlFromConfig(kind) || '').trim()
  const queueName = getQueueName(env, kind)
  if (fromConfig) return { queueUrl: fromConfig, source: 'config', queueName }

  // GH Actions / local envs may not have queue URLs set. Fall back to AWS GetQueueUrl by name.
  const client = getSqsClient()
  const res = await client.send(new GetQueueUrlCommand({ QueueName: queueName }))
  const queueUrl = String(res.QueueUrl || '').trim()
  if (!queueUrl) throw new Error(`Queue URL not found for QueueName='${queueName}'`)
  return { queueUrl, source: 'aws_get_queue_url', queueName }
}

const queueAgeThresholdSeconds = (env: 'dev' | 'staging' | 'prod', kind: QueueKind): number | null => {
  // Mirrors current monitoring alarms in infrastructure/cdk/lib/monitoring.ts where defined.
  if (kind === 'quote_refresh') {
    return env === 'prod' ? 15 * 60 : (env === 'staging' ? 30 * 60 : 60 * 60)
  }
  if (kind === 'ingest_fanout_tier2') {
    return env === 'prod' ? 60 * 60 : (env === 'staging' ? 90 * 60 : 2 * 60 * 60)
  }
  return null
}

const main = async () => {
  const queueKindRaw = String(process.env.QUEUE_KIND || '').trim()
  if (!isQueueKind(queueKindRaw)) {
    console.error(`Invalid or missing QUEUE_KIND. Allowed: ${QUEUE_KINDS.join(', ')}`)
    process.exit(2)
  }

  const env = resolveCaseEnv(process.env.ENVIRONMENT || config.envName || process.env.NODE_ENV || 'dev')
  const caseId = String(process.env.CASE_ID || '').trim()

  try {
    const { queueUrl, source, queueName } = await resolveQueueUrl(env, queueKindRaw)
    const stats = await getQueueStats(queueUrl)
    const ageSeconds = await getQueueAgeSeconds(queueUrl)
    const dlqUrl = await getQueueDLQ(queueUrl)
    const dlqDepth = dlqUrl ? await getQueueDepth(dlqUrl) : 0

    const threshold = queueAgeThresholdSeconds(env, queueKindRaw)

    const findings: EvidenceFinding[] = []
    if (dlqDepth > 0) {
      findings.push({
        reason_code: 'queue.dlq_nonzero',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `DLQ depth is ${dlqDepth}.`,
        details: { queue_kind: queueKindRaw, dlq_url: dlqUrl, dlq_depth: dlqDepth },
      })
    }

    if (threshold !== null && ageSeconds >= threshold) {
      findings.push({
        reason_code: 'queue.oldest_age_high',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `ApproximateAgeOfOldestMessage ${Math.round(ageSeconds)}s exceeds threshold ${threshold}s.`,
        details: { queue_kind: queueKindRaw, age_seconds: ageSeconds, threshold_seconds: threshold },
      })
    }

    // Depth alarms are not currently defined for all queues; include as data without finding by default.

    const pointers: EvidencePointer[] = []
    const runUrl = getGithubActionsRunUrl()
    if (runUrl) pointers.push({ kind: 'github_actions_run', ref: runUrl, note: 'Evidence workflow run' })

    const evidence: EvidenceResult = {
      success: findings.length === 0,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.queue_backlog.github_actions',
      summary: [
        `queue_kind=${queueKindRaw}`,
        `env=${env}`,
        `visible=${stats.visible} in_flight=${stats.inFlight} delayed=${stats.delayed} total=${stats.total}`,
        `oldest_age_seconds=${Math.round(ageSeconds)}`,
        `dlq_depth=${dlqDepth}`,
        `queue_url_source=${source}`,
      ].join(' | '),
      findings,
      recommended_next_skill_ids: ['manual.human_triage'],
      pointers,
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }

    // Put full stats in details behind budgeted evidence.
    evidence.findings.push({
      reason_code: 'queue.stats',
      severity: 'sev3',
      message: 'Queue stats snapshot.',
      details: { queue_name: queueName, queue_url: queueUrl, dlq_url: dlqUrl, stats, age_seconds: ageSeconds, threshold_seconds: threshold },
    })

    writeEvidenceResult(evidence)
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    const evidence: EvidenceResult = {
      success: false,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.queue_backlog.github_actions',
      summary: 'Queue backlog evidence generation failed.',
      findings: [
        { reason_code: 'evidence.error', severity: env === 'prod' ? 'sev1' : 'sev2', message, details: { stack } },
      ],
      recommended_next_skill_ids: ['manual.human_triage'],
      pointers: [],
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }
    writeEvidenceResult(evidence)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('queue_backlog_evidence_fatal', { error: error instanceof Error ? error.message : String(error) })
  process.exit(1)
})
