import {
  CfnReplicationGroup,
  CfnSubnetGroup,
} from 'aws-cdk-lib/aws-elasticache'
import type { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2'
import type { Construct } from 'constructs'

export type CacheResources = {
  subnetGroup: CfnSubnetGroup
  replicationGroup: CfnReplicationGroup
}

export type CacheOptions = {
  envName: string
  vpc: Vpc
  redisSecurityGroup: SecurityGroup
}

export const createCache = (scope: Construct, options: CacheOptions): CacheResources => {
  const isProd = options.envName === 'prod'
  const subnets = options.vpc.privateSubnets

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
  })

  return {
    subnetGroup,
    replicationGroup,
  }
}
