import { SecretValue } from 'aws-cdk-lib'
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
}

export const createCache = (scope: Construct, options: CacheOptions): CacheResources => {
  const isProd = options.envName === 'prod'
  const subnets = options.vpc.privateSubnets

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

  const replicationGroup = new CfnReplicationGroup(scope, 'RedisReplicationGroup', {
    replicationGroupDescription: `Remit-Scout Redis (${options.envName})`,
    cacheNodeType: isProd ? 'cache.r6g.large' : 'cache.t4g.micro',
    engine: 'redis',
    engineVersion: '7.1',
    numNodeGroups: 1,
    replicasPerNodeGroup: isProd ? 1 : undefined,
    automaticFailoverEnabled: isProd,
    multiAzEnabled: isProd,
    atRestEncryptionEnabled: true,
    transitEncryptionEnabled: true,
    cacheSubnetGroupName: subnetGroup.ref,
    securityGroupIds: [options.redisSecurityGroup.securityGroupId],
    autoMinorVersionUpgrade: true,
    // Do not set AuthToken in-place on existing replication groups.
    // CloudFormation treats this path as immutable for our existing stacks and enters
    // UPDATE_ROLLBACK_FAILED. Auth enablement must be handled as an explicit replacement migration.
  })

  return {
    subnetGroup,
    replicationGroup,
    redisAuthSecret,
    redisAuthToken,
  }
}
