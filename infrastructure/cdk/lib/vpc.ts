import { type Construct } from 'constructs'
import {
  Vpc,
  SubnetType,
  SecurityGroup,
  Port,
  Peer,
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
  natGateways?: number
}

export const createNetworking = (
  scope: Construct,
  options: NetworkingOptions,
): NetworkingResources => {
  const isDev = options.envName === 'dev'
  const isProd = options.envName === 'prod'
  const natGateways =
    typeof options.natGateways === 'number' && Number.isFinite(options.natGateways)
      ? options.natGateways
      : (isProd ? 2 : 1)

  const vpc = new Vpc(scope, 'RemitScoutVpc', {
    maxAzs: 2,
    natGateways,
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

  vpc.addGatewayEndpoint('S3GatewayEndpoint', {
    service: GatewayVpcEndpointAwsService.S3,
    subnets: [{ subnetType: SubnetType.PRIVATE_WITH_EGRESS }],
  })

  // Dev cost optimization:
  // - We rely on NAT for AWS service access (SecretsManager/SSM/etc) and external provider access.
  // - Avoid interface VPC endpoints in dev, as they incur hourly costs and add drift risk.
  //
  // Staging/prod keep interface endpoints for tighter egress and lower NAT data usage.
  if (!isDev) {
    const endpointSecurityGroup = new SecurityGroup(scope, 'VpcEndpointSecurityGroup', {
      vpc,
      description: 'Security group for VPC interface endpoints.',
      allowAllOutbound: true,
    })
    endpointSecurityGroup.addIngressRule(
      Peer.ipv4(vpc.vpcCidrBlock),
      Port.tcp(443),
      'Allow VPC access to interface endpoints',
    )
    const endpointSubnets = { subnetType: SubnetType.PRIVATE_WITH_EGRESS }

    vpc.addInterfaceEndpoint('EcrApiEndpoint', {
      service: InterfaceVpcEndpointAwsService.ECR,
      subnets: endpointSubnets,
      securityGroups: [endpointSecurityGroup],
    })
    vpc.addInterfaceEndpoint('EcrDockerEndpoint', {
      service: InterfaceVpcEndpointAwsService.ECR_DOCKER,
      subnets: endpointSubnets,
      securityGroups: [endpointSecurityGroup],
    })
    vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: endpointSubnets,
      securityGroups: [endpointSecurityGroup],
    })
    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: endpointSubnets,
      securityGroups: [endpointSecurityGroup],
    })
    vpc.addInterfaceEndpoint('SsmEndpoint', {
      service: InterfaceVpcEndpointAwsService.SSM,
      subnets: endpointSubnets,
      securityGroups: [endpointSecurityGroup],
    })
    vpc.addInterfaceEndpoint('StsEndpoint', {
      service: InterfaceVpcEndpointAwsService.STS,
      subnets: endpointSubnets,
      securityGroups: [endpointSecurityGroup],
    })
  }

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
