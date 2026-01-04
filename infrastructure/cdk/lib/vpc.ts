import { type Construct } from 'constructs'
import {
  Vpc,
  SubnetType,
  SecurityGroup,
  Port,
} from 'aws-cdk-lib/aws-ec2'

export type NetworkingResources = {
  vpc: Vpc
  planeASecurityGroup: SecurityGroup
  planeBSecurityGroup: SecurityGroup
  planeCSecurityGroup: SecurityGroup
  dbSecurityGroup: SecurityGroup
  redisSecurityGroup: SecurityGroup
}

export type NetworkingOptions = {
  envName: string
}

export const createNetworking = (
  scope: Construct,
  options: NetworkingOptions,
): NetworkingResources => {
  const vpc = new Vpc(scope, 'RemitScoutVpc', {
    maxAzs: 2,
    natGateways: options.envName === 'prod' ? 2 : 1,
    subnetConfiguration: [
      {
        name: 'public',
        subnetType: SubnetType.PUBLIC,
      },
      {
        name: 'private',
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
    ],
  })

  const planeASecurityGroup = new SecurityGroup(scope, 'PlaneASecurityGroup', {
    vpc,
    description: 'Plane A service security group.',
    allowAllOutbound: true,
  })
  const planeBSecurityGroup = new SecurityGroup(scope, 'PlaneBSecurityGroup', {
    vpc,
    description: 'Plane B service security group.',
    allowAllOutbound: true,
  })
  const planeCSecurityGroup = new SecurityGroup(scope, 'PlaneCSecurityGroup', {
    vpc,
    description: 'Plane C service security group.',
    allowAllOutbound: true,
  })
  const dbSecurityGroup = new SecurityGroup(scope, 'DatabaseSecurityGroup', {
    vpc,
    description: 'Database security group (Aurora/RDS).',
    allowAllOutbound: true,
  })
  const redisSecurityGroup = new SecurityGroup(scope, 'RedisSecurityGroup', {
    vpc,
    description: 'Redis security group (ElastiCache).',
    allowAllOutbound: true,
  })

  // Allow Plane A/B/C to reach the database.
  dbSecurityGroup.addIngressRule(planeASecurityGroup, Port.tcp(5432), 'Plane A -> DB')
  dbSecurityGroup.addIngressRule(planeBSecurityGroup, Port.tcp(5432), 'Plane B -> DB')
  dbSecurityGroup.addIngressRule(planeCSecurityGroup, Port.tcp(5432), 'Plane C -> DB')

  // Allow Plane A/B/C to reach Redis.
  redisSecurityGroup.addIngressRule(planeASecurityGroup, Port.tcp(6379), 'Plane A -> Redis')
  redisSecurityGroup.addIngressRule(planeBSecurityGroup, Port.tcp(6379), 'Plane B -> Redis')
  redisSecurityGroup.addIngressRule(planeCSecurityGroup, Port.tcp(6379), 'Plane C -> Redis')

  return {
    vpc,
    planeASecurityGroup,
    planeBSecurityGroup,
    planeCSecurityGroup,
    dbSecurityGroup,
    redisSecurityGroup,
  }
}
