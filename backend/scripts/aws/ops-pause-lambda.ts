import {
  DescribeServicesCommand,
  ListServicesCommand,
  DescribeTasksCommand,
  ECSClient,
  ListTasksCommand,
  StopTaskCommand,
  UpdateServiceCommand,
} from '@aws-sdk/client-ecs'
import {
  EventBridgeClient,
  DisableRuleCommand,
  EnableRuleCommand,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge'
import {
  RDSClient,
  DescribeDBClustersCommand,
  StartDBClusterCommand,
  StopDBClusterCommand,
} from '@aws-sdk/client-rds'
import {
  ElastiCacheClient,
  CreateReplicationGroupCommand,
  DeleteReplicationGroupCommand,
  DescribeReplicationGroupsCommand,
} from '@aws-sdk/client-elasticache'
import {
  GetQueueAttributesCommand,
  PurgeQueueCommand,
  SQSClient,
} from '@aws-sdk/client-sqs'
import {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand,
} from '@aws-sdk/client-ssm'
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
} from '@aws-sdk/client-application-auto-scaling'

import { recordCloudWatchMetric } from '../../shared/cloudwatch-metrics'
import { createLogger } from '../../shared/logger'

const logger = createLogger('script.ops-pause')

type PauseEvent = { paused?: boolean }
type RuleStateSnapshot = { name: string; state: string }

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) return [items]
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize))
  }
  return chunks
}

const parseJson = <T>(value: string | undefined, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch (error) {
    logger.warn('parse_json_failed', { value, error: String(error) })
    return fallback
  }
}

const readJsonParameter = async <T>(
  client: SSMClient,
  parameterName: string | undefined,
  fallback: T,
): Promise<T> => {
  if (!parameterName) return fallback
  try {
    const response = await client.send(
      new GetParameterCommand({ Name: parameterName }),
    )
    return parseJson<T>(response.Parameter?.Value, fallback)
  } catch (error) {
    logger.warn('pause_config_param_read_failed', {
      parameterName,
      error: String(error),
    })
    return fallback
  }
}

const toBool = (value?: string): boolean => value === '1' || value?.toLowerCase() === 'true'

const normalizeRuleName = (prefix: string, name: string): string => {
  if (!name) return name
  return name.startsWith(prefix) ? name : `${prefix}${name}`
}

const emitOpsPauseMetric = (
  name: 'ops_pause_queues_purged' | 'ops_pause_purge_failed' | 'ops_pause_drift_detected',
  value: number,
  envName: string,
): void => {
  if (!Number.isFinite(value)) return
  try {
    recordCloudWatchMetric({
      name,
      value,
      dimensions: { environment: envName },
    })
  } catch (error) {
    logger.debug('ops_pause_metric_emit_failed', {
      metric: name,
      error: String(error),
    })
  }
}

const listRuleStatesByPrefix = async (
  client: EventBridgeClient,
  prefix: string,
): Promise<RuleStateSnapshot[]> => {
  const rules: RuleStateSnapshot[] = []
  let nextToken: string | undefined
  do {
    const response = await client.send(
      new ListRulesCommand({ NamePrefix: prefix, NextToken: nextToken }),
    )
    response.Rules?.forEach((rule) => {
      if (!rule.Name) return
      rules.push({
        name: rule.Name,
        state: rule.State ?? 'UNKNOWN',
      })
    })
    nextToken = response.NextToken
  } while (nextToken)
  return rules
}

const listRulesByPrefix = async (
  client: EventBridgeClient,
  prefix: string,
): Promise<string[]> => {
  const snapshots = await listRuleStatesByPrefix(client, prefix)
  return snapshots.map((rule) => rule.name)
}

const listRunningTaskArns = async (
  client: ECSClient,
  cluster: string,
): Promise<string[]> => {
  const arns: string[] = []
  let nextToken: string | undefined
  do {
    const response = await client.send(
      new ListTasksCommand({
        cluster,
        desiredStatus: 'RUNNING',
        nextToken,
      }),
    )
    response.taskArns?.forEach((arn) => {
      if (arn) arns.push(arn)
    })
    nextToken = response.nextToken
  } while (nextToken)
  return arns
}

const listClusterServiceNames = async (
  client: ECSClient,
  cluster: string,
): Promise<string[]> => {
  const names = new Set<string>()
  let nextToken: string | undefined
  do {
    const response = await client.send(
      new ListServicesCommand({
        cluster,
        nextToken,
      }),
    )
    response.serviceArns?.forEach((serviceArn) => {
      if (!serviceArn) return
      const serviceName = serviceArn.split('/').pop()?.trim()
      if (!serviceName) return
      names.add(serviceName)
    })
    nextToken = response.nextToken
  } while (nextToken)
  return [...names]
}

const listScalableTargetsByResourceIds = async (
  client: ApplicationAutoScalingClient,
  resourceIds: string[],
): Promise<Map<string, { inSuspended: boolean; outSuspended: boolean; scheduledSuspended: boolean }>> => {
  const targets = new Map<string, { inSuspended: boolean; outSuspended: boolean; scheduledSuspended: boolean }>()
  for (const chunk of chunkArray(resourceIds, 10)) {
    if (chunk.length === 0) continue
    const response = await client.send(
      new DescribeScalableTargetsCommand({
        ServiceNamespace: 'ecs',
        ScalableDimension: 'ecs:service:DesiredCount',
        ResourceIds: chunk,
      }),
    )
    for (const target of response.ScalableTargets ?? []) {
      const resourceId = target.ResourceId
      if (!resourceId) continue
      targets.set(resourceId, {
        inSuspended: target.SuspendedState?.DynamicScalingInSuspended === true,
        outSuspended: target.SuspendedState?.DynamicScalingOutSuspended === true,
        scheduledSuspended: target.SuspendedState?.ScheduledScalingSuspended === true,
      })
    }
  }
  return targets
}

const stopEventRuleStartedTasks = async (
  client: ECSClient,
  cluster: string,
  options: { rulePrefix: string; reason: string },
): Promise<{ matched: number; stopped: number }> => {
  const running = await listRunningTaskArns(client, cluster)
  if (running.length === 0) return { matched: 0, stopped: 0 }

  const toStop: string[] = []
  for (const chunk of chunkArray(running, 100)) {
    try {
      const response = await client.send(
        new DescribeTasksCommand({ cluster, tasks: chunk }),
      )
      for (const task of response.tasks ?? []) {
        const startedBy = task.startedBy ?? ''
        // Orphan protection: scheduled ECS tasks launched by EventBridge are not controlled
        // by ECS service desired counts, so they must be stopped explicitly on pause.
        if (!startedBy.startsWith('events-rule/')) continue
        if (task.taskArn) toStop.push(task.taskArn)
      }
    } catch (error) {
      logger.warn('ecs_describe_tasks_failed', {
        cluster,
        error: String(error),
      })
    }
  }

  if (toStop.length === 0) return { matched: 0, stopped: 0 }

  const concurrency = 10
  let stopped = 0
  for (let i = 0; i < toStop.length; i += concurrency) {
    const batch = toStop.slice(i, i + concurrency)
    const results = await Promise.allSettled(
      batch.map((taskArn) =>
        client.send(
          new StopTaskCommand({
            cluster,
            task: taskArn,
            reason: options.reason,
          }),
        ),
      ),
    )
    for (const result of results) {
      if (result.status === 'fulfilled') {
        stopped += 1
      } else {
        logger.warn('ecs_stop_task_failed', {
          cluster,
          error: String(result.reason),
        })
      }
    }
  }

  logger.warn('ecs_stop_event_rule_tasks_complete', {
    cluster,
    rulePrefix: options.rulePrefix,
    matched: toStop.length,
    stopped,
  })

  return { matched: toStop.length, stopped }
}

const RESUME_BATCH_DELAY_MS = 15_000

/**
 * Priority-ordered batch suffixes for staggered resume. Infrastructure-critical
 * jobs first, analytics/cleanup last. Rules are matched by suffix after the
 * environment prefix (e.g. `remit-scout-staging-data-health-slo`).
 */
const RESUME_BATCH_ORDER: string[][] = [
  ['data-health-slo', 'gold-reconciliation', 'b2b-sweep-scheduler', 'gold-fx-rates'],
  ['gold-publisher', 'gold-indices', 'gold-pulse-cache', 'gold-popular-corridors'],
  ['provider-weighting', 'smart-alerts', 'alert-corridor-refresh', 'alert-evaluation'],
  ['institutional-daily-export', 'oanda-sync', 'audit-log-cleanup', 'session-cleanup'],
  ['bank-vs-specialist', 'telemetry-analytics', 'stoplist-auto-resume', 'probe-fan-in'],
]

const setRulesEnabled = async (
  client: EventBridgeClient,
  ruleNames: string[],
  enabled: boolean,
): Promise<void> => {
  await Promise.all(
    ruleNames.map(async (ruleName) => {
      try {
        if (enabled) {
          await client.send(new EnableRuleCommand({ Name: ruleName }))
        } else {
          await client.send(new DisableRuleCommand({ Name: ruleName }))
        }
      } catch (error) {
        logger.warn('rule_toggle_failed', { ruleName, enabled, error: String(error) })
      }
    }),
  )
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Enables rules in priority-ordered batches with delays between each batch to
 * avoid thundering-herd DB connection storms after ops-resume.
 */
const staggeredEnableRules = async (
  client: EventBridgeClient,
  ruleNames: string[],
): Promise<void> => {
  const remaining = new Set(ruleNames)
  const batches: string[][] = []

  for (const suffixes of RESUME_BATCH_ORDER) {
    const batch: string[] = []
    for (const ruleName of remaining) {
      const lower = ruleName.toLowerCase()
      if (suffixes.some((suffix) => lower.includes(suffix))) {
        batch.push(ruleName)
      }
    }
    for (const matched of batch) {
      remaining.delete(matched)
    }
    if (batch.length > 0) {
      batches.push(batch)
    }
  }

  // Any rules not matched by the priority batches go into a final catch-all batch
  if (remaining.size > 0) {
    batches.push([...remaining])
  }

  for (let i = 0; i < batches.length; i++) {
    if (i > 0) {
      logger.info('resume_batch_delay', { batchIndex: i, delayMs: RESUME_BATCH_DELAY_MS })
      await sleep(RESUME_BATCH_DELAY_MS)
    }
    logger.info('resume_batch_enable', {
      batchIndex: i,
      ruleCount: batches[i].length,
      rules: batches[i],
    })
    await setRulesEnabled(client, batches[i], true)
  }
}

const setEcsDesiredCounts = async (
  client: ECSClient,
  cluster: string,
  services: string[],
  desiredMap: Record<string, number>,
): Promise<void> => {
  await Promise.all(
    services.map(async (serviceName) => {
      const desiredCount = desiredMap[serviceName] ?? 0
      try {
        await client.send(
          new UpdateServiceCommand({
            cluster,
            service: serviceName,
            desiredCount,
          }),
        )
      } catch (error) {
        logger.warn('ecs_update_failed', { serviceName, desiredCount, error: String(error) })
      }
    }),
  )
}

const isPurgeQueueInProgressError = (error: unknown): boolean => {
  const message = String(error)
  return message.includes('PurgeQueueInProgress')
}

const purgeQueues = async (
  client: SQSClient,
  queueUrls: string[],
): Promise<{ purged: number; failed: number }> => {
  let purged = 0
  let failed = 0
  for (const queueUrl of queueUrls) {
    let visibleMessages = 0
    let inFlightMessages = 0
    try {
      const attributes = await client.send(new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: [
          'ApproximateNumberOfMessages',
          'ApproximateNumberOfMessagesNotVisible',
        ],
      }))
      visibleMessages = Number(attributes.Attributes?.ApproximateNumberOfMessages ?? '0')
      inFlightMessages = Number(attributes.Attributes?.ApproximateNumberOfMessagesNotVisible ?? '0')
    } catch (error) {
      logger.warn('queue_attr_read_failed', {
        queueUrl,
        error: String(error),
      })
    }

    try {
      await client.send(new PurgeQueueCommand({ QueueUrl: queueUrl }))
      purged += 1
      logger.info('queue_purged', {
        queueUrl,
        visibleMessages,
        inFlightMessages,
      })
    } catch (error) {
      failed += 1
      if (isPurgeQueueInProgressError(error)) {
        logger.warn('queue_purge_in_progress', {
          queueUrl,
          error: String(error),
        })
      } else {
        logger.warn('queue_purge_failed', {
          queueUrl,
          error: String(error),
        })
      }
    }
  }

  return { purged, failed }
}

const validatePauseState = async (
  events: EventBridgeClient,
  ecs: ECSClient,
  applicationAutoScaling: ApplicationAutoScalingClient,
  options: {
    rulePrefix: string
    clusterName: string
    ecsServiceNames: string[]
    expectedEnabledRules: Set<string>
    expectedDesiredMap: Record<string, number>
    queueWorkerScalableTargetResourceIds: string[]
    expectQueueWorkerScalableTargetsActive: boolean
  },
): Promise<{ valid: boolean; drift: string[] }> => {
  const drift: string[] = []

  try {
    const rules = await listRuleStatesByPrefix(events, options.rulePrefix)
    for (const rule of rules) {
      const isEnabled = rule.state === 'ENABLED'
      const shouldBeEnabled = options.expectedEnabledRules.has(rule.name)
      if (isEnabled !== shouldBeEnabled) {
        drift.push(
          `rule:${rule.name}:actual=${rule.state}:expected=${shouldBeEnabled ? 'ENABLED' : 'DISABLED'}`,
        )
      }
    }
  } catch (error) {
    drift.push(`rules_validation_failed:${String(error)}`)
  }

  for (const servicesChunk of chunkArray(options.ecsServiceNames, 10)) {
    try {
      const response = await ecs.send(new DescribeServicesCommand({
        cluster: options.clusterName,
        services: servicesChunk,
      }))
      for (const service of response.services ?? []) {
        const serviceName = service.serviceName
        if (!serviceName) continue
        const actualDesiredCount = service.desiredCount ?? 0
        const expectedDesiredCount = options.expectedDesiredMap[serviceName] ?? 0
        if (actualDesiredCount !== expectedDesiredCount) {
          drift.push(
            `service:${serviceName}:actual=${actualDesiredCount}:expected=${expectedDesiredCount}`,
          )
        }
      }
      for (const failure of response.failures ?? []) {
        drift.push(
          `service_describe_failure:${failure.arn ?? failure.reason ?? 'unknown'}`,
        )
      }
    } catch (error) {
      drift.push(`services_validation_failed:${String(error)}`)
    }
  }

  if (options.expectQueueWorkerScalableTargetsActive && options.queueWorkerScalableTargetResourceIds.length > 0) {
    try {
      const targets = await listScalableTargetsByResourceIds(
        applicationAutoScaling,
        options.queueWorkerScalableTargetResourceIds,
      )
      for (const resourceId of options.queueWorkerScalableTargetResourceIds) {
        const target = targets.get(resourceId)
        if (!target) {
          drift.push(`scalable_target:${resourceId}:actual=missing:expected=active`)
          continue
        }
        if (target.inSuspended || target.outSuspended || target.scheduledSuspended) {
          drift.push(`scalable_target:${resourceId}:actual=suspended:expected=active`)
        }
      }
    } catch (error) {
      drift.push(`scalable_targets_validation_failed:${String(error)}`)
    }
  }

  return {
    valid: drift.length === 0,
    drift,
  }
}

const stopDbCluster = async (
  client: RDSClient,
  clusterId: string,
): Promise<void> => {
  try {
    const response = await client.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId }),
    )
    const status = response.DBClusters?.[0]?.Status ?? 'unknown'
    if (status === 'stopped' || status === 'stopping') {
      logger.info('db_already_stopped', { clusterId, status })
      return
    }
    await client.send(new StopDBClusterCommand({ DBClusterIdentifier: clusterId }))
    logger.info('db_stop_initiated', { clusterId })
  } catch (error) {
    logger.warn('db_stop_failed', { clusterId, error: String(error) })
  }
}

const startDbCluster = async (
  client: RDSClient,
  clusterId: string,
): Promise<void> => {
  try {
    const response = await client.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId }),
    )
    const status = response.DBClusters?.[0]?.Status ?? 'unknown'
    if (status === 'available' || status === 'starting') {
      logger.info('db_already_running', { clusterId, status })
      return
    }
    await client.send(new StartDBClusterCommand({ DBClusterIdentifier: clusterId }))
    logger.info('db_start_initiated', { clusterId })
  } catch (error) {
    logger.warn('db_start_failed', { clusterId, error: String(error) })
  }
}

const deleteRedisReplicationGroup = async (
  client: ElastiCacheClient,
  replicationGroupId: string,
): Promise<void> => {
  try {
    const response = await client.send(
      new DescribeReplicationGroupsCommand({ ReplicationGroupId: replicationGroupId }),
    )
    const status = response.ReplicationGroups?.[0]?.Status ?? 'unknown'
    if (status === 'deleting') {
      logger.info('redis_already_deleting', { replicationGroupId })
      return
    }
    await client.send(
      new DeleteReplicationGroupCommand({
        ReplicationGroupId: replicationGroupId,
        RetainPrimaryCluster: false,
      }),
    )
    logger.info('redis_delete_initiated', { replicationGroupId })
  } catch (error) {
    if (String(error).includes('ReplicationGroupNotFound')) {
      logger.info('redis_missing', { replicationGroupId })
      return
    }
    logger.warn('redis_delete_failed', { replicationGroupId, error: String(error) })
  }
}

const createRedisReplicationGroup = async (
  client: ElastiCacheClient,
  config: {
    replicationGroupId: string
    description: string
    cacheNodeType: string
    engine: string
    engineVersion: string
    subnetGroupName: string
    securityGroupIds: string[]
    numNodeGroups: number
    replicasPerNodeGroup: number
    automaticFailoverEnabled: boolean
    multiAzEnabled: boolean
    transitEncryptionEnabled: boolean
    atRestEncryptionEnabled: boolean
    autoMinorVersionUpgrade: boolean
  },
): Promise<void> => {
  try {
    const response = await client.send(
      new DescribeReplicationGroupsCommand({ ReplicationGroupId: config.replicationGroupId }),
    )
    const status = response.ReplicationGroups?.[0]?.Status ?? 'unknown'
    logger.info('redis_already_present', { replicationGroupId: config.replicationGroupId, status })
    return
  } catch (error) {
    if (!String(error).includes('ReplicationGroupNotFound')) {
      logger.warn('redis_describe_failed', {
        replicationGroupId: config.replicationGroupId,
        error: String(error),
      })
      return
    }
  }

  try {
    await client.send(
      new CreateReplicationGroupCommand({
        ReplicationGroupId: config.replicationGroupId,
        ReplicationGroupDescription: config.description,
        CacheNodeType: config.cacheNodeType,
        Engine: config.engine,
        EngineVersion: config.engineVersion,
        CacheSubnetGroupName: config.subnetGroupName,
        SecurityGroupIds: config.securityGroupIds,
        NumNodeGroups: config.numNodeGroups,
        ReplicasPerNodeGroup: config.replicasPerNodeGroup,
        AutomaticFailoverEnabled: config.automaticFailoverEnabled,
        MultiAZEnabled: config.multiAzEnabled,
        TransitEncryptionEnabled: config.transitEncryptionEnabled,
        AtRestEncryptionEnabled: config.atRestEncryptionEnabled,
        AutoMinorVersionUpgrade: config.autoMinorVersionUpgrade,
      }),
    )
    logger.info('redis_create_initiated', { replicationGroupId: config.replicationGroupId })
  } catch (error) {
    logger.warn('redis_create_failed', { replicationGroupId: config.replicationGroupId, error: String(error) })
  }
}

const waitForDbClusterAvailable = async (
  client: RDSClient,
  clusterId: string,
  maxWaitMs: number,
): Promise<boolean> => {
  const start = Date.now()
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  while (Date.now() - start < maxWaitMs) {
    try {
      const response = await client.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId }),
      )
      const status = response.DBClusters?.[0]?.Status ?? 'unknown'
      if (status === 'available') {
        logger.info('db_ready', { clusterId, status })
        return true
      }
      logger.info('db_waiting', { clusterId, status })
    } catch (error) {
      logger.warn('db_wait_failed', { clusterId, error: String(error) })
    }
    await sleep(5000)
  }

  logger.warn('db_wait_timeout', { clusterId, maxWaitMs })
  return false
}

export const handler = async (event: PauseEvent = {}): Promise<{ paused: boolean }> => {
  const envName = process.env.ENVIRONMENT ?? 'dev'
  const pauseParamName =
    process.env.PAUSE_PARAM_NAME ?? `/remit-scout/${envName}/ops/paused`
  const hardStopEnabled = toBool(process.env.HARD_STOP_ENABLED)
  const pauseEcs = toBool(process.env.PAUSE_ECS ?? '1')
  const ecsClusterName = process.env.ECS_CLUSTER_NAME ?? `remit-scout-${envName}`
  const ecsServicesParamName = process.env.ECS_SERVICES_PARAM_NAME
  const ecsBaselineParamName = process.env.ECS_BASELINE_PARAM_NAME
  const ecsServiceNamesFromEnv = parseJson<string[]>(process.env.ECS_SERVICES_JSON, [])
  const ecsBaselineFromEnv = parseJson<Record<string, number>>(process.env.ECS_BASELINE_JSON, {})
  const rulePrefix = process.env.EVENT_RULE_PREFIX ?? `remit-scout-${envName}-`
  const queueWorkerScalableTargetResourceIds = parseJson<string[]>(
    process.env.QUEUE_WORKER_SCALABLE_TARGETS_JSON,
    [],
  )
    .map((resourceId) => resourceId.trim())
    .filter(Boolean)
  const resumeAllowlistRaw = parseJson<string[]>(
    process.env.EVENT_RULE_RESUME_ALLOWLIST ?? process.env.EVENT_RULE_ALLOWLIST,
    [],
  )
  const resumeAllowlist = resumeAllowlistRaw.map((name) => normalizeRuleName(rulePrefix, name))
  const purgeQueuesOnResume = toBool(process.env.PURGE_QUEUES_ON_RESUME ?? '0')
  const purgeQueueUrls = parseJson<string[]>(process.env.PURGE_QUEUE_URLS_JSON, [])
    .map((queueUrl) => queueUrl.trim())
    .filter(Boolean)

  const dbClusterId = process.env.DB_CLUSTER_ID
  const redisReplicationGroupId = process.env.REDIS_REPLICATION_GROUP_ID
  const redisSubnetGroupName = process.env.REDIS_SUBNET_GROUP_NAME
  const redisSecurityGroupIds = parseJson<string[]>(process.env.REDIS_SECURITY_GROUP_IDS, [])
  const redisNodeType = process.env.REDIS_NODE_TYPE ?? 'cache.t4g.micro'
  const redisEngineVersion = process.env.REDIS_ENGINE_VERSION ?? '7.1'
  const redisNumNodeGroups = Number(process.env.REDIS_NUM_NODE_GROUPS ?? '1')
  const redisReplicasPerNodeGroup = Number(process.env.REDIS_REPLICAS_PER_NODE_GROUP ?? '0')
  const redisAutomaticFailover = toBool(process.env.REDIS_AUTOMATIC_FAILOVER)
  const redisMultiAz = toBool(process.env.REDIS_MULTI_AZ)
  const redisTransitEncryption = toBool(process.env.REDIS_TRANSIT_ENCRYPTION)
  const redisAtRestEncryption = toBool(process.env.REDIS_AT_REST_ENCRYPTION)
  const redisAutoMinorUpgrade = toBool(process.env.REDIS_AUTO_MINOR_VERSION_UPGRADE ?? '1')
  const redisAllowDelete = toBool(process.env.REDIS_ALLOW_DELETE)

  const ssm = new SSMClient({})
  const configuredEcsServiceNames = await readJsonParameter(
    ssm,
    ecsServicesParamName,
    ecsServiceNamesFromEnv,
  )
  const configuredEcsBaseline = await readJsonParameter(
    ssm,
    ecsBaselineParamName,
    ecsBaselineFromEnv,
  )
  const ecs = new ECSClient({})
  const discoveredEcsServiceNames = await listClusterServiceNames(ecs, ecsClusterName)
  const ecsServiceNames = [...new Set([...configuredEcsServiceNames, ...discoveredEcsServiceNames])]
  const ecsBaseline: Record<string, number> = {}
  for (const [serviceName, desiredCount] of Object.entries(configuredEcsBaseline)) {
    const normalized = Number(desiredCount)
    ecsBaseline[serviceName] = Number.isFinite(normalized) ? Math.max(0, Math.trunc(normalized)) : 0
  }
  for (const serviceName of ecsServiceNames) {
    if (!(serviceName in ecsBaseline)) {
      ecsBaseline[serviceName] = 0
    }
  }
  const unmanagedDiscoveredServices = discoveredEcsServiceNames.filter(
    (serviceName) => !configuredEcsServiceNames.includes(serviceName),
  )
  if (unmanagedDiscoveredServices.length > 0) {
    logger.warn('ops_pause_discovered_unmanaged_services', {
      cluster: ecsClusterName,
      count: unmanagedDiscoveredServices.length,
      services: unmanagedDiscoveredServices,
    })
  }
  const events = new EventBridgeClient({})
  const applicationAutoScaling = new ApplicationAutoScalingClient({})
  const rds = new RDSClient({})
  const elasticache = new ElastiCacheClient({})
  const sqs = new SQSClient({})
  let expectedEnabledRules = new Set<string>()
  let expectedDesiredMap: Record<string, number> = Object.fromEntries(
    ecsServiceNames.map((name) => [name, ecsBaseline[name] ?? 0]),
  )

  const snsRecords = Array.isArray((event as { Records?: unknown }).Records)
    ? (event as { Records?: Array<{ Sns?: { Subject?: string; Message?: string } }> }).Records
    : null
  const snsRecord = snsRecords?.[0]?.Sns
  const isSnsTrigger = Boolean(snsRecord)
  if (isSnsTrigger) {
    logger.warn('pause_triggered_by_sns', {
      envName,
      record_count: snsRecords?.length ?? 0,
      subject: snsRecord?.Subject,
    })
  }

  const resolvedPaused = isSnsTrigger
    ? true
    : typeof event.paused === 'boolean'
      ? event.paused
      : await (async () => {
          try {
            const response = await ssm.send(
              new GetParameterCommand({ Name: pauseParamName }),
            )
            return response.Parameter?.Value === 'true'
          } catch (error) {
            logger.warn('pause_param_missing', { pauseParamName, error: String(error) })
            return false
          }
        })()

  const shouldPause = resolvedPaused
  logger.info('pause_state', { envName, shouldPause, hardStopEnabled })

  try {
    await ssm.send(
      new PutParameterCommand({
        Name: pauseParamName,
        Value: shouldPause ? 'true' : 'false',
        Type: 'String',
        Overwrite: true,
      }),
    )
  } catch (error) {
    logger.warn('pause_param_write_failed', {
      pauseParamName,
      shouldPause,
      error: String(error),
    })
  }

  // Safety invariant: pausing must always disable *all* rules by prefix, even if an allowlist is set.
  // Allowlist exists to make resume low-noise (enable only a small set), not to make pause partial.
  if (hardStopEnabled) {
    if (shouldPause) {
      const allRules = await listRulesByPrefix(events, rulePrefix)
      await setRulesEnabled(events, allRules, false)
      expectedEnabledRules = new Set()

      const desiredMap = pauseEcs
        ? Object.fromEntries(ecsServiceNames.map((name) => [name, 0]))
        : Object.fromEntries(ecsServiceNames.map((name) => [name, ecsBaseline[name] ?? 0]))
      expectedDesiredMap = desiredMap
      if (pauseEcs) {
        await setEcsDesiredCounts(ecs, ecsClusterName, ecsServiceNames, desiredMap)
      }

      // Stop orphaned scheduled tasks (events-rule/*) before stopping the DB to avoid
      // prolonged error noise and ongoing spend.
      await stopEventRuleStartedTasks(ecs, ecsClusterName, {
        rulePrefix,
        reason: 'ops-pause: stop orphaned events-rule task',
      })

      if (dbClusterId) {
        await stopDbCluster(rds, dbClusterId)
      }
      if (redisReplicationGroupId && redisAllowDelete) {
        await deleteRedisReplicationGroup(elasticache, redisReplicationGroupId)
      } else if (redisReplicationGroupId && !redisAllowDelete) {
        logger.info('redis_delete_skipped', { redisReplicationGroupId })
      }
    } else {
      if (dbClusterId) {
        await startDbCluster(rds, dbClusterId)
        const ready = await waitForDbClusterAvailable(rds, dbClusterId, 90000)
        if (!ready) {
          logger.warn('resume_db_not_ready_continuing', {
            envName,
            message: 'DB is still starting; continuing resume anyway (some scheduled tasks may log connection timeouts until DB becomes available).',
          })
        }
      }
      if (
        redisReplicationGroupId &&
        redisSubnetGroupName &&
        redisSecurityGroupIds.length > 0
      ) {
        await createRedisReplicationGroup(elasticache, {
          replicationGroupId: redisReplicationGroupId,
          description: `Remit-Scout Redis (${envName})`,
          cacheNodeType: redisNodeType,
          engine: 'redis',
          engineVersion: redisEngineVersion,
          subnetGroupName: redisSubnetGroupName,
          securityGroupIds: redisSecurityGroupIds,
          numNodeGroups: Number.isFinite(redisNumNodeGroups) ? redisNumNodeGroups : 1,
          replicasPerNodeGroup: Number.isFinite(redisReplicasPerNodeGroup)
            ? redisReplicasPerNodeGroup
            : 0,
          automaticFailoverEnabled: redisAutomaticFailover,
          multiAzEnabled: redisMultiAz,
          transitEncryptionEnabled: redisTransitEncryption,
          atRestEncryptionEnabled: redisAtRestEncryption,
          autoMinorVersionUpgrade: redisAutoMinorUpgrade,
        })
      } else if (redisReplicationGroupId) {
        logger.warn('redis_create_skipped_missing_config', {
          redisReplicationGroupId,
          redisSubnetGroupName,
          redisSecurityGroupIds,
        })
      }

      // Resume must be low-noise: first disable everything, then enable the allowlist (or all).
      // Only do this after the DB is reachable to avoid noisy "connection timeout" runs.
      const allRules = await listRulesByPrefix(events, rulePrefix)
      await setRulesEnabled(events, allRules, false)
      const rulesToEnable =
        resumeAllowlist.length > 0
          ? resumeAllowlist
          : (envName === 'dev' ? [] : allRules)
      expectedEnabledRules = new Set(rulesToEnable)
      if (rulesToEnable.length === 0 && envName === 'dev') {
        logger.warn('resume_allowlist_empty_dev', {
          envName,
          rulePrefix,
          message:
            'EVENT_RULE_ALLOWLIST is empty; leaving rules disabled to prevent runaway scheduled ECS tasks.',
        })
      } else {
        await staggeredEnableRules(events, rulesToEnable)
      }

      if (purgeQueuesOnResume && purgeQueueUrls.length > 0) {
        const purgeResult = await purgeQueues(sqs, purgeQueueUrls)
        emitOpsPauseMetric('ops_pause_queues_purged', purgeResult.purged, envName)
        emitOpsPauseMetric('ops_pause_purge_failed', purgeResult.failed, envName)
      }

      const desiredMap = pauseEcs
        ? Object.fromEntries(ecsServiceNames.map((name) => [name, ecsBaseline[name] ?? 0]))
        : Object.fromEntries(ecsServiceNames.map((name) => [name, ecsBaseline[name] ?? 0]))
      expectedDesiredMap = desiredMap
      await setEcsDesiredCounts(ecs, ecsClusterName, ecsServiceNames, desiredMap)
    }
  } else {
    // Soft mode: no DB/Redis stop/start; only toggle rules + ECS desired counts.
    if (shouldPause) {
      const allRules = await listRulesByPrefix(events, rulePrefix)
      await setRulesEnabled(events, allRules, false)
      expectedEnabledRules = new Set()
    } else {
      const allRules = await listRulesByPrefix(events, rulePrefix)
      await setRulesEnabled(events, allRules, false)
      const rulesToEnable =
        resumeAllowlist.length > 0
          ? resumeAllowlist
          : (envName === 'dev' ? [] : allRules)
      expectedEnabledRules = new Set(rulesToEnable)
      if (rulesToEnable.length === 0 && envName === 'dev') {
        logger.warn('resume_allowlist_empty_dev', {
          envName,
          rulePrefix,
          message:
            'EVENT_RULE_ALLOWLIST is empty; leaving rules disabled to prevent runaway scheduled ECS tasks.',
        })
      } else {
        await staggeredEnableRules(events, rulesToEnable)
      }

      if (purgeQueuesOnResume && purgeQueueUrls.length > 0) {
        const purgeResult = await purgeQueues(sqs, purgeQueueUrls)
        emitOpsPauseMetric('ops_pause_queues_purged', purgeResult.purged, envName)
        emitOpsPauseMetric('ops_pause_purge_failed', purgeResult.failed, envName)
      }
    }

    const desiredMap = shouldPause && pauseEcs
      ? Object.fromEntries(ecsServiceNames.map((name) => [name, 0]))
      : Object.fromEntries(
          ecsServiceNames.map((name) => [name, ecsBaseline[name] ?? 0]),
        )
    expectedDesiredMap = desiredMap
    if (pauseEcs || !shouldPause) {
      await setEcsDesiredCounts(ecs, ecsClusterName, ecsServiceNames, desiredMap)
    }

    if (shouldPause) {
      await stopEventRuleStartedTasks(ecs, ecsClusterName, {
        rulePrefix,
        reason: 'ops-pause: stop orphaned events-rule task',
      })
    }
  }

  try {
    const validation = await validatePauseState(events, ecs, applicationAutoScaling, {
      rulePrefix,
      clusterName: ecsClusterName,
      ecsServiceNames,
      expectedEnabledRules,
      expectedDesiredMap,
      queueWorkerScalableTargetResourceIds,
      expectQueueWorkerScalableTargetsActive: !shouldPause,
    })
    emitOpsPauseMetric('ops_pause_drift_detected', validation.drift.length, envName)
    if (validation.valid) {
      logger.info('pause_state_validation_ok', {
        envName,
        shouldPause,
        expectedEnabledRules: expectedEnabledRules.size,
      })
    } else {
      logger.warn('pause_state_validation_drift', {
        envName,
        shouldPause,
        drift: validation.drift,
      })
      const shouldFailResume = !shouldPause && envName !== 'dev'
      const hasScalableTargetDrift = validation.drift.some((entry) => entry.startsWith('scalable_target:'))
      if (shouldFailResume && hasScalableTargetDrift) {
        throw new Error('Queue worker scalable targets remain suspended outside pause mode')
      }
    }
  } catch (error) {
    emitOpsPauseMetric('ops_pause_drift_detected', 1, envName)
    logger.warn('pause_state_validation_failed', {
      rulePrefix,
      envName,
      shouldPause,
      error: String(error),
    })
    if (!shouldPause && envName !== 'dev') {
      throw error
    }
  }

  return { paused: shouldPause }
}
