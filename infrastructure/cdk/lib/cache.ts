import { RemovalPolicy, SecretValue } from 'aws-cdk-lib'
import {
  CfnReplicationGroup,
  CfnSubnetGroup,
} from 'aws-cdk-lib/aws-elasticache'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import type { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2'
import type { Construct } from 'constructs'

export type CacheResources = {
  subnetGroup: CfnSubnetGroup
  replicationGroup: CfnReplicationGroup
  redisAuthSecret: Secret
  redisAuthToken: SecretValue
}

export type CacheOptions = {
  envName: string
  vpc: Vpc
  redisSecurityGroup: SecurityGroup
  redisAuthMode?: 'legacy' | 'required'
  nodeType?: string
  replicasPerNodeGroup?: number
  automaticFailoverEnabled?: boolean
  multiAzEnabled?: boolean
}

export const createCache = (scope: Construct, options: CacheOptions): CacheResources => {
  const isProd = options.envName === 'prod'
  const isStaging = options.envName === 'staging'
  const isProtectedEnv = isProd || isStaging
  const subnets = options.vpc.privateSubnets
  const redisAuthMode = options.redisAuthMode ?? (isProtectedEnv ? 'required' : 'legacy')
  const authEnabled = redisAuthMode === 'required'

  const redisSnapshottingClusterIdRaw = process.env.REDIS_SNAPSHOTTING_CLUSTER_ID?.trim()
  const redisSnapshottingClusterId =
    isProtectedEnv && redisSnapshottingClusterIdRaw
      ? redisSnapshottingClusterIdRaw
      : undefined
  const snapshotsEnabled = Boolean(redisSnapshottingClusterId)

  const redisAuthSecret = new Secret(scope, 'RedisAuthSecret', {
    secretName: `remit-scout/${options.envName}/redis-auth`,
    description: `Redis AUTH token for Remit-Scout ${options.envName}`,
    generateSecretString: {
      passwordLength: 48,
      excludePunctuation: true,
      includeSpace: false,
    },
  })

  // `generateSecretString` without a template produces a plain secret string, not JSON.
  // Use the full secret value directly to avoid JSON parse failures during stack updates.
  const redisAuthToken = redisAuthSecret.secretValue

  const subnetGroup = new CfnSubnetGroup(scope, 'RedisSubnetGroup', {
    cacheSubnetGroupName: `remit-scout-${options.envName}-redis`,
    description: 'Remit-Scout Redis subnet group',
    subnetIds: subnets.map((subnet) => subnet.subnetId),
  })

  const replicationGroup = new CfnReplicationGroup(
    scope,
    'RedisReplicationGroupAuth',
    {
      replicationGroupDescription: `Remit-Scout Redis (${options.envName})`,
      cacheNodeType: isProd ? (options.nodeType ?? 'cache.t4g.small') : 'cache.t4g.micro',
      engine: 'redis',
      engineVersion: '7.1',
      numNodeGroups: 1,
      replicasPerNodeGroup: isProtectedEnv ? (options.replicasPerNodeGroup ?? 1) : undefined,
      automaticFailoverEnabled: isProd
        ? (options.automaticFailoverEnabled ?? true)
        : isStaging
          ? (options.automaticFailoverEnabled ?? true)
          : false,
      multiAzEnabled: isProd ? (options.multiAzEnabled ?? true) : false,
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      cacheSubnetGroupName: subnetGroup.ref,
      securityGroupIds: [options.redisSecurityGroup.securityGroupId],
      autoMinorVersionUpgrade: true,
      // AWS requires SnapshottingClusterId whenever SnapshotRetentionLimit is enabled.
      // Keep snapshots disabled until the cluster id is explicitly provided.
      snapshotRetentionLimit: snapshotsEnabled ? 1 : 0,
      snapshotWindow: snapshotsEnabled ? '03:00-04:00' : undefined,
      snapshottingClusterId: snapshotsEnabled ? redisSnapshottingClusterId : undefined,
      // Auth token must be enabled for protected environments. We use a distinct
      // logical ID when auth is enabled so upgrades can migrate by replacement.
      authToken: authEnabled ? redisAuthToken.toString() : undefined,
    },
  )

  const removalPolicy = isProtectedEnv ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
  redisAuthSecret.applyRemovalPolicy(removalPolicy)
  subnetGroup.applyRemovalPolicy(removalPolicy)
  replicationGroup.applyRemovalPolicy(removalPolicy)

  return {
    subnetGroup,
    replicationGroup,
    redisAuthSecret,
    redisAuthToken,
  }
}
