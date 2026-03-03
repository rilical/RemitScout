import { type Construct } from 'constructs'
import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import {
  Vpc,
  SubnetType,
  SecurityGroup,
  Port,
  Peer,
  FlowLogDestination,
  FlowLogTrafficType,
  GatewayVpcEndpointAwsService,
  InterfaceVpcEndpointAwsService,
} from 'aws-cdk-lib/aws-ec2'
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
} from 'aws-cdk-lib/aws-s3'

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
  interfaceEndpointMode?: InterfaceEndpointMode
  interfaceEndpointAllowlist?: string[]
}

export type InterfaceEndpointMode = 'all' | 'minimal' | 'none'

export const createNetworking = (
  scope: Construct,
  options: NetworkingOptions,
): NetworkingResources => {
  const isDev = options.envName === 'dev'
  const isProd = options.envName === 'prod'
  const interfaceEndpointMode: InterfaceEndpointMode = isDev
    ? 'none'
    : (options.interfaceEndpointMode ?? 'all')
  const interfaceEndpointAllowlist = new Set(
    (options.interfaceEndpointAllowlist ?? [])
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  )
  const natGateways =
    typeof options.natGateways === 'number' && Number.isFinite(options.natGateways)
      ? options.natGateways
      : 1

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

  // VPC flow logs stored in S3 (21x cheaper than CloudWatch Logs ingestion).
  // Retention matches previous CloudWatch config: 14 days prod, 3 days non-prod.
  const flowLogsBucket = new Bucket(scope, 'VpcFlowLogsBucket', {
    bucketName: `remit-scout-vpc-flow-logs-${options.envName}`,
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    autoDeleteObjects: !isProd,
    lifecycleRules: [
      {
        expiration: Duration.days(isProd ? 14 : 3),
        abortIncompleteMultipartUploadAfter: Duration.days(1),
      },
    ],
  })

  vpc.addFlowLog('VpcFlowLog', {
    destination: FlowLogDestination.toS3(flowLogsBucket, `${options.envName}/vpc-flow-logs`),
    trafficType: FlowLogTrafficType.REJECT,
  })

  vpc.addGatewayEndpoint('S3GatewayEndpoint', {
    service: GatewayVpcEndpointAwsService.S3,
    subnets: [{ subnetType: SubnetType.PRIVATE_WITH_EGRESS }],
  })

  // Dev cost optimization:
  // - We rely on NAT for AWS service access (SecretsManager/SSM/etc) and external provider access.
  // - Avoid interface VPC endpoints in dev, as they incur hourly costs and add drift risk.
  //
  // Staging/prod default to full endpoint coverage.
  // Controlled cost experiments can switch to `minimal` or `none` via context.
  if (interfaceEndpointMode !== 'none') {
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
    const endpointDefinitions = [
      { id: 'EcrApiEndpoint', key: 'ecr.api', service: InterfaceVpcEndpointAwsService.ECR, minimal: false },
      { id: 'EcrDockerEndpoint', key: 'ecr.dkr', service: InterfaceVpcEndpointAwsService.ECR_DOCKER, minimal: false },
      { id: 'CloudWatchLogsEndpoint', key: 'logs', service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS, minimal: false },
      { id: 'SecretsManagerEndpoint', key: 'secretsmanager', service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER, minimal: true },
      { id: 'SsmEndpoint', key: 'ssm', service: InterfaceVpcEndpointAwsService.SSM, minimal: true },
      { id: 'StsEndpoint', key: 'sts', service: InterfaceVpcEndpointAwsService.STS, minimal: true },
      { id: 'SqsEndpoint', key: 'sqs', service: InterfaceVpcEndpointAwsService.SQS, minimal: false },
    ] as const
    const knownEndpointKeys = new Set(endpointDefinitions.map((endpoint) => endpoint.key))
    const unknownAllowlistKeys = [...interfaceEndpointAllowlist].filter(
      (key) => !knownEndpointKeys.has(key as (typeof endpointDefinitions)[number]['key']),
    )
    if (unknownAllowlistKeys.length > 0) {
      throw new Error(
        `Unknown interface endpoint allowlist keys: ${unknownAllowlistKeys.join(', ')}.`,
      )
    }
    const modeFilteredEndpoints = interfaceEndpointMode === 'minimal'
      ? endpointDefinitions.filter((endpoint) => endpoint.minimal)
      : endpointDefinitions
    const selectedEndpoints = interfaceEndpointAllowlist.size > 0
      ? modeFilteredEndpoints.filter((endpoint) => interfaceEndpointAllowlist.has(endpoint.key))
      : modeFilteredEndpoints

    for (const endpoint of selectedEndpoints) {
      vpc.addInterfaceEndpoint(endpoint.id, {
        service: endpoint.service,
        subnets: endpointSubnets,
        securityGroups: [endpointSecurityGroup],
      })
    }
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
    allowAllOutbound: false,
  })
  const redisSecurityGroup = new SecurityGroup(scope, 'RedisSecurityGroup', {
    vpc,
    description: 'Redis security group (ElastiCache).',
    allowAllOutbound: false,
  })

  // Restrict data-store egress to VPC-internal destinations only.
  dbSecurityGroup.addEgressRule(Peer.ipv4(vpc.vpcCidrBlock), Port.allTraffic(), 'DB egress limited to VPC')
  redisSecurityGroup.addEgressRule(Peer.ipv4(vpc.vpcCidrBlock), Port.allTraffic(), 'Redis egress limited to VPC')

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
