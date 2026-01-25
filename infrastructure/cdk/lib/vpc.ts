import { type Construct } from 'constructs'
import {
  Vpc,
  SubnetType,
  SecurityGroup,
  Port,
  GatewayVpcEndpointAwsService,
  InterfaceVpcEndpointAwsService,
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
  const isDev = options.envName === 'dev'
  const isProd = options.envName === 'prod'

  const vpc = new Vpc(scope, 'RemitScoutVpc', {
    maxAzs: isDev ? 1 : 2,
    natGateways: isProd ? 2 : 0,
    subnetConfiguration: isDev
      ? [
          {
            name: 'public',
            subnetType: SubnetType.PUBLIC,
          },
        ]
      : [
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

  vpc.addGatewayEndpoint('S3GatewayEndpoint', {
    service: GatewayVpcEndpointAwsService.S3,
    subnets: [{ subnetType: SubnetType.PUBLIC }],
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
  dbSecurityGroup.addIngressRule(planeASecurityGroup, Port.tcp(5432), 'Plane A to DB')
  dbSecurityGroup.addIngressRule(planeBSecurityGroup, Port.tcp(5432), 'Plane B to DB')
  dbSecurityGroup.addIngressRule(planeCSecurityGroup, Port.tcp(5432), 'Plane C to DB')

  // Allow Plane A/B/C to reach Redis.
  redisSecurityGroup.addIngressRule(planeASecurityGroup, Port.tcp(6379), 'Plane A to Redis')
  redisSecurityGroup.addIngressRule(planeBSecurityGroup, Port.tcp(6379), 'Plane B to Redis')
  redisSecurityGroup.addIngressRule(planeCSecurityGroup, Port.tcp(6379), 'Plane C to Redis')

  return {
    vpc,
    planeASecurityGroup,
    planeBSecurityGroup,
    planeCSecurityGroup,
    dbSecurityGroup,
    redisSecurityGroup,
  }
}
