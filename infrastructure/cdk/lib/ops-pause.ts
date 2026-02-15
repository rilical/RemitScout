import path from 'path'

import { Duration, Stack, Tags } from 'aws-cdk-lib'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import type { Role } from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'

export type OpsPauseResources = {
  pauseParam: StringParameter
  controllerFunction: NodejsFunction
}

export type OpsPauseOptions = {
  envName: string
  clusterName: string
  ecsServiceNames: string[]
  ecsBaselineDesired: Record<string, number>
  eventRulePrefix: string
  eventRuleAllowlist?: string[]
  hardStopEnabled?: boolean
  dbClusterIdentifier?: string
  redisReplicationGroupId?: string
  redisSubnetGroupName?: string
  redisSecurityGroupIds?: string[]
  redisNodeType?: string
  redisEngineVersion?: string
  redisNumNodeGroups?: number
  redisReplicasPerNodeGroup?: number
  redisAutomaticFailover?: boolean
  redisMultiAz?: boolean
  redisTransitEncryption?: boolean
  redisAtRestEncryption?: boolean
  redisAutoMinorVersionUpgrade?: boolean
  role: Role
}

export const createOpsPause = (
  scope: Construct,
  options: OpsPauseOptions,
): OpsPauseResources => {
  const isDev = options.envName === 'dev'
  const isProd = options.envName === 'prod'
  const stack = Stack.of(scope)
  const logRetention = isProd
    ? RetentionDays.ONE_MONTH
    : (isDev ? RetentionDays.THREE_DAYS : RetentionDays.TWO_WEEKS)

  const pauseParam = new StringParameter(scope, 'OpsPauseParam', {
    parameterName: `/remit-scout/${options.envName}/ops/paused`,
    stringValue: 'false',
  })

  const controllerFunction = new NodejsFunction(scope, 'OpsPauseControllerFunction', {
    entry: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'backend',
      'scripts',
      'aws',
      'ops-pause-lambda.ts',
    ),
    handler: 'handler',
    runtime: Runtime.NODEJS_20_X,
    memorySize: 256,
    timeout: Duration.minutes(5),
    role: options.role,
    logRetention,
    environment: {
      ENVIRONMENT: options.envName,
      PAUSE_PARAM_NAME: pauseParam.parameterName,
      HARD_STOP_ENABLED: options.hardStopEnabled ? '1' : '0',
      PAUSE_ECS: options.hardStopEnabled ? '1' : '0',
      ECS_CLUSTER_NAME: options.clusterName,
      ECS_SERVICES_JSON: JSON.stringify(options.ecsServiceNames),
      ECS_BASELINE_JSON: JSON.stringify(options.ecsBaselineDesired),
      EVENT_RULE_PREFIX: options.eventRulePrefix,
      EVENT_RULE_ALLOWLIST: JSON.stringify(options.eventRuleAllowlist ?? []),
      DB_CLUSTER_ID: options.dbClusterIdentifier ?? '',
      REDIS_REPLICATION_GROUP_ID: options.redisReplicationGroupId ?? '',
      REDIS_SUBNET_GROUP_NAME: options.redisSubnetGroupName ?? '',
      REDIS_SECURITY_GROUP_IDS: JSON.stringify(options.redisSecurityGroupIds ?? []),
      REDIS_NODE_TYPE: options.redisNodeType ?? '',
      REDIS_ENGINE_VERSION: options.redisEngineVersion ?? '',
      REDIS_NUM_NODE_GROUPS: String(options.redisNumNodeGroups ?? 1),
      REDIS_REPLICAS_PER_NODE_GROUP: String(options.redisReplicasPerNodeGroup ?? 0),
      REDIS_AUTOMATIC_FAILOVER: options.redisAutomaticFailover ? '1' : '0',
      REDIS_MULTI_AZ: options.redisMultiAz ? '1' : '0',
      REDIS_TRANSIT_ENCRYPTION: options.redisTransitEncryption ? '1' : '0',
      REDIS_AT_REST_ENCRYPTION: options.redisAtRestEncryption ? '1' : '0',
      REDIS_AUTO_MINOR_VERSION_UPGRADE: options.redisAutoMinorVersionUpgrade === false ? '0' : '1',
      REDIS_ALLOW_DELETE: '0',
    },
  })

  pauseParam.grantRead(controllerFunction)
  pauseParam.grantWrite(controllerFunction)

  const ecsServiceArn = stack.formatArn({
    service: 'ecs',
    resource: 'service',
    resourceName: `${options.clusterName}/*`,
  })
  const ecsClusterArn = stack.formatArn({
    service: 'ecs',
    resource: 'cluster',
    resourceName: options.clusterName,
  })

  options.role.addToPolicy(new PolicyStatement({
    actions: ['ecs:UpdateService', 'ecs:DescribeServices'],
    resources: [ecsServiceArn, ecsClusterArn],
  }))
  // OpsPause must also stop any orphaned scheduled ECS tasks (startedBy=events-rule/*) that
  // are not controlled by service desiredCount (otherwise dev can keep spending while "paused").
  options.role.addToPolicy(new PolicyStatement({
    actions: ['ecs:ListTasks', 'ecs:DescribeTasks', 'ecs:StopTask'],
    resources: ['*'],
  }))
  options.role.addToPolicy(new PolicyStatement({
    actions: ['events:DisableRule', 'events:EnableRule', 'events:ListRules'],
    resources: ['*'],
  }))
  if (options.dbClusterIdentifier && options.hardStopEnabled) {
    options.role.addToPolicy(new PolicyStatement({
      actions: ['rds:StartDBCluster', 'rds:StopDBCluster'],
      resources: ['*'],
    }))
    options.role.addToPolicy(new PolicyStatement({
      actions: ['rds:DescribeDBClusters'],
      resources: ['*'],
    }))
  }
  if (options.redisReplicationGroupId) {
    options.role.addToPolicy(new PolicyStatement({
      actions: [
        'elasticache:CreateReplicationGroup',
        'elasticache:DeleteReplicationGroup',
        'elasticache:DescribeReplicationGroups',
        'elasticache:DescribeCacheSubnetGroups',
      ],
      resources: ['*'],
    }))
  }

  Tags.of(controllerFunction).add('managed-by', 'ops-pause')
  Tags.of(pauseParam).add('managed-by', 'ops-pause')
  Tags.of(controllerFunction).add('environment', options.envName)

  return {
    pauseParam,
    controllerFunction,
  }
}
