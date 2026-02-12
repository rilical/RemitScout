import { ECSClient, UpdateServiceCommand } from '@aws-sdk/client-ecs'
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
  SSMClient,
  GetParameterCommand,
  PutParameterCommand,
} from '@aws-sdk/client-ssm'

import { createLogger } from '../../shared/logger'

const logger = createLogger('script.ops-pause')

type PauseEvent = { paused?: boolean }

const parseJson = <T>(value: string | undefined, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch (error) {
    logger.warn('parse_json_failed', { value, error: String(error) })
    return fallback
  }
}

const toBool = (value?: string): boolean => value === '1' || value?.toLowerCase() === 'true'

const normalizeRuleName = (prefix: string, name: string): string => {
  if (!name) return name
  return name.startsWith(prefix) ? name : `${prefix}${name}`
}

const listRulesByPrefix = async (
  client: EventBridgeClient,
  prefix: string,
): Promise<string[]> => {
  const names: string[] = []
  let nextToken: string | undefined
  do {
    const response = await client.send(
      new ListRulesCommand({ NamePrefix: prefix, NextToken: nextToken }),
    )
    response.Rules?.forEach((rule) => {
      if (rule.Name) names.push(rule.Name)
    })
    nextToken = response.NextToken
  } while (nextToken)
  return names
}

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
  const ecsServiceNames = parseJson<string[]>(process.env.ECS_SERVICES_JSON, [])
  const ecsBaseline = parseJson<Record<string, number>>(process.env.ECS_BASELINE_JSON, {})
  const rulePrefix = process.env.EVENT_RULE_PREFIX ?? `remit-scout-${envName}-`
  const allowlistRaw = parseJson<string[]>(process.env.EVENT_RULE_ALLOWLIST, [])
  const allowlist = allowlistRaw.map((name) => normalizeRuleName(rulePrefix, name))

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
  const ecs = new ECSClient({})
  const events = new EventBridgeClient({})
  const rds = new RDSClient({})
  const elasticache = new ElastiCacheClient({})

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

      const desiredMap = pauseEcs
        ? Object.fromEntries(ecsServiceNames.map((name) => [name, 0]))
        : Object.fromEntries(ecsServiceNames.map((name) => [name, ecsBaseline[name] ?? 0]))
      if (pauseEcs) {
        await setEcsDesiredCounts(ecs, ecsClusterName, ecsServiceNames, desiredMap)
      }

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
      const rulesToEnable = allowlist.length > 0 ? allowlist : allRules
      await setRulesEnabled(events, rulesToEnable, true)

      const desiredMap = pauseEcs
        ? Object.fromEntries(ecsServiceNames.map((name) => [name, ecsBaseline[name] ?? 0]))
        : Object.fromEntries(ecsServiceNames.map((name) => [name, ecsBaseline[name] ?? 0]))
      await setEcsDesiredCounts(ecs, ecsClusterName, ecsServiceNames, desiredMap)
    }
  } else {
    // Soft mode: no DB/Redis stop/start; only toggle rules + ECS desired counts.
    if (shouldPause) {
      const allRules = await listRulesByPrefix(events, rulePrefix)
      await setRulesEnabled(events, allRules, false)
    } else {
      const allRules = await listRulesByPrefix(events, rulePrefix)
      await setRulesEnabled(events, allRules, false)
      const rulesToEnable = allowlist.length > 0 ? allowlist : allRules
      await setRulesEnabled(events, rulesToEnable, true)
    }

    const desiredMap = shouldPause && pauseEcs
      ? Object.fromEntries(ecsServiceNames.map((name) => [name, 0]))
      : Object.fromEntries(
          ecsServiceNames.map((name) => [name, ecsBaseline[name] ?? 0]),
        )
    if (pauseEcs || !shouldPause) {
      await setEcsDesiredCounts(ecs, ecsClusterName, ecsServiceNames, desiredMap)
    }
  }

  return { paused: shouldPause }
}
