import { RemovalPolicy, Stack } from 'aws-cdk-lib'
import {
  ContainerImage,
  FargateTaskDefinition,
  LogDrivers,
  Protocol,
  Secret as EcsSecret,
} from 'aws-cdk-lib/aws-ecs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import type { Repository } from 'aws-cdk-lib/aws-ecr'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import type { Construct } from 'constructs'

import type { IamResources } from './iam'

export type EcsTaskResources = {
  planeBIngestTask: FargateTaskDefinition
  b2cRefreshTask: FargateTaskDefinition
  ingestFanoutTask: FargateTaskDefinition
  notificationsQueueTask: FargateTaskDefinition
  opsAlertsQueueTask: FargateTaskDefinition
}

export type EcsTaskOptions = {
  envName: string
  backendRepository: Repository
  imageTag: string
  roles: IamResources
  planeBDbSecretArn?: string
  planeBDbSsmName?: string
  planeBDbHost?: string
  planeBDbPort?: string
  planeBDbName?: string
  redisSecretArn?: string
  redisSecretJsonKey?: string
  redisSsmName?: string
  proxyResidentialSecretArn?: string
  proxyResidentialSecretJsonKey?: string
  proxyResidentialSsmName?: string
  proxyResidentialUrl?: string
  proxyDatacenterSecretArn?: string
  proxyDatacenterSecretJsonKey?: string
  proxyDatacenterSsmName?: string
  proxyDatacenterUrl?: string
  quoteRefreshQueueUrl?: string
  ingestFanoutQueueUrl?: string
  notificationsQueueUrl?: string
  opsAlertsQueueUrl?: string
  bronzeBucketName?: string
  bronzePrefix?: string
  b2cQueueInSweep?: string
  ingestFanoutMode?: string
  notificationsMode?: string
  opsAlertsMode?: string
}

export const createEcsTasks = (
  scope: Construct,
  options: EcsTaskOptions,
): EcsTaskResources => {
  const isProd = options.envName === 'prod'
  const logRetention = isProd ? RetentionDays.ONE_MONTH : RetentionDays.TWO_WEEKS
  const image = ContainerImage.fromEcrRepository(options.backendRepository, options.imageTag)
  const otelConfigContent = [
    'receivers:',
    '  otlp:',
    '    protocols:',
    '      http:',
    '        endpoint: 0.0.0.0:4318',
    'exporters:',
    '  awsxray:',
    'service:',
    '  pipelines:',
    '    traces:',
    '      receivers: [otlp]',
    '      exporters: [awsxray]',
  ].join('\n')

  const planeBIngestTask = new FargateTaskDefinition(scope, 'PlaneBIngestTask', {
    cpu: 512,
    memoryLimitMiB: 1024,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
  })

  const planeBDbSecretArn = options.planeBDbSecretArn
  const planeBDbSsmName = options.planeBDbSsmName
  const planeBDbHost = options.planeBDbHost
  const planeBDbPort = options.planeBDbPort
  const planeBDbName = options.planeBDbName
  const redisSecretArn = options.redisSecretArn
  const redisSecretJsonKey = options.redisSecretJsonKey
  const redisSsmName = options.redisSsmName
  const proxyResidentialSecretArn = options.proxyResidentialSecretArn
  const proxyResidentialSecretJsonKey = options.proxyResidentialSecretJsonKey
  const proxyResidentialSsmName = options.proxyResidentialSsmName
  const proxyResidentialUrl = options.proxyResidentialUrl
  const proxyDatacenterSecretArn = options.proxyDatacenterSecretArn
  const proxyDatacenterSecretJsonKey = options.proxyDatacenterSecretJsonKey
  const proxyDatacenterSsmName = options.proxyDatacenterSsmName
  const proxyDatacenterUrl = options.proxyDatacenterUrl
  const quoteRefreshQueueUrl = options.quoteRefreshQueueUrl
  const ingestFanoutQueueUrl = options.ingestFanoutQueueUrl
  const notificationsQueueUrl = options.notificationsQueueUrl
  const opsAlertsQueueUrl = options.opsAlertsQueueUrl
  const bronzeBucketName = options.bronzeBucketName
  const bronzePrefix = options.bronzePrefix
  const b2cQueueInSweep = options.b2cQueueInSweep
  const ingestFanoutMode = options.ingestFanoutMode
  const notificationsMode = options.notificationsMode
  const opsAlertsMode = options.opsAlertsMode

  const buildSecrets = (): Record<string, EcsSecret> => {
    const secrets: Record<string, EcsSecret> = {}

    if (planeBDbSecretArn) {
      const secret = Secret.fromSecretCompleteArn(
        scope,
        'PlaneBEcsDatabaseSecret',
        planeBDbSecretArn,
      )
      secrets.PLANE_B_DB_USERNAME = EcsSecret.fromSecretsManager(secret, 'username')
      secrets.PLANE_B_DB_PASSWORD = EcsSecret.fromSecretsManager(secret, 'password')
    } else if (planeBDbSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'PlaneBEcsDatabaseParameter',
        planeBDbSsmName,
      )
      secrets.DATABASE_URL_PLANE_B = EcsSecret.fromSsmParameter(parameter)
    }

    if (redisSecretArn) {
      const secret = Secret.fromSecretCompleteArn(scope, 'PlaneBEcsRedisSecret', redisSecretArn)
      secrets.REDIS_URL = redisSecretJsonKey
        ? EcsSecret.fromSecretsManager(secret, redisSecretJsonKey)
        : EcsSecret.fromSecretsManager(secret)
    } else if (redisSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'PlaneBEcsRedisParameter',
        redisSsmName,
      )
      secrets.REDIS_URL = EcsSecret.fromSsmParameter(parameter)
    }

    if (proxyResidentialSecretArn) {
      const secret = Secret.fromSecretCompleteArn(
        scope,
        'PlaneBEcsProxyResidentialSecret',
        proxyResidentialSecretArn,
      )
      secrets.PROXY_RESIDENTIAL_URL = proxyResidentialSecretJsonKey
        ? EcsSecret.fromSecretsManager(secret, proxyResidentialSecretJsonKey)
        : EcsSecret.fromSecretsManager(secret)
    } else if (proxyResidentialSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'PlaneBEcsProxyResidentialParameter',
        proxyResidentialSsmName,
      )
      secrets.PROXY_RESIDENTIAL_URL = EcsSecret.fromSsmParameter(parameter)
    }

    if (proxyDatacenterSecretArn) {
      const secret = Secret.fromSecretCompleteArn(
        scope,
        'PlaneBEcsProxyDatacenterSecret',
        proxyDatacenterSecretArn,
      )
      secrets.PROXY_DATACENTER_URL = proxyDatacenterSecretJsonKey
        ? EcsSecret.fromSecretsManager(secret, proxyDatacenterSecretJsonKey)
        : EcsSecret.fromSecretsManager(secret)
    } else if (proxyDatacenterSsmName) {
      const parameter = StringParameter.fromStringParameterName(
        scope,
        'PlaneBEcsProxyDatacenterParameter',
        proxyDatacenterSsmName,
      )
      secrets.PROXY_DATACENTER_URL = EcsSecret.fromSsmParameter(parameter)
    }

    return secrets
  }

  const sharedSecrets = buildSecrets()
  const secretsConfig =
    Object.keys(sharedSecrets).length > 0 ? { secrets: sharedSecrets } : {}
  const sharedEnv: Record<string, string> = {
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }

  if (planeBDbHost) {
    sharedEnv.PLANE_B_DB_HOST = planeBDbHost
  }
  if (planeBDbPort) {
    sharedEnv.PLANE_B_DB_PORT = planeBDbPort
  }
  if (planeBDbName) {
    sharedEnv.PLANE_B_DB_NAME = planeBDbName
  }
  if (ingestFanoutQueueUrl) {
    sharedEnv.PLANE_B_INGEST_FANOUT_QUEUE_URL = ingestFanoutQueueUrl
  }
  if (notificationsQueueUrl) {
    sharedEnv.PLANE_B_NOTIFICATIONS_QUEUE_URL = notificationsQueueUrl
  }
  if (opsAlertsQueueUrl) {
    sharedEnv.PLANE_B_OPS_ALERT_QUEUE_URL = opsAlertsQueueUrl
  }
  if (quoteRefreshQueueUrl) {
    sharedEnv.QUOTE_REFRESH_QUEUE_URL = quoteRefreshQueueUrl
  }
  if (ingestFanoutMode) {
    sharedEnv.PLANE_B_INGEST_FANOUT_QUEUE_MODE = ingestFanoutMode
  }
  if (notificationsMode) {
    sharedEnv.PLANE_B_NOTIFICATIONS_QUEUE_MODE = notificationsMode
  }
  if (opsAlertsMode) {
    sharedEnv.PLANE_B_OPS_ALERT_QUEUE_MODE = opsAlertsMode
  }
  if (bronzeBucketName) {
    sharedEnv.BRONZE_S3_BUCKET = bronzeBucketName
  }
  if (bronzePrefix) {
    sharedEnv.BRONZE_S3_PREFIX = bronzePrefix
  }
  if (b2cQueueInSweep) {
    sharedEnv.PLANE_B_B2C_QUEUE_IN_SWEEP = b2cQueueInSweep
  }
  if (proxyResidentialUrl && !sharedSecrets.PROXY_RESIDENTIAL_URL) {
    sharedEnv.PROXY_RESIDENTIAL_URL = proxyResidentialUrl
  }
  if (proxyDatacenterUrl && !sharedSecrets.PROXY_DATACENTER_URL) {
    sharedEnv.PROXY_DATACENTER_URL = proxyDatacenterUrl
  }

  const planeBIngestLogGroup = new LogGroup(scope, 'PlaneBIngestLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/plane-b-ingest`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const planeBIngestOtelLogGroup = new LogGroup(scope, 'PlaneBIngestOtelLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/plane-b-ingest-otel`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  planeBIngestTask.addContainer('PlaneBIngestContainer', {
    image,
    command: ['node', 'backend/dist/scripts/aws/plane-b-ingest-ecs.js'],
    environment: sharedEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'plane-b-ingest',
      logGroup: planeBIngestLogGroup,
    }),
  })
  planeBIngestTask.addContainer('PlaneBIngestOtelCollector', {
    image: ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-otel-collector:latest'),
    cpu: 32,
    memoryLimitMiB: 256,
    environment: {
      AWS_REGION: Stack.of(scope).region,
      AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
    },
    logging: LogDrivers.awsLogs({
      streamPrefix: 'plane-b-ingest-otel',
      logGroup: planeBIngestOtelLogGroup,
    }),
    portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
  })

  const b2cRefreshTask = new FargateTaskDefinition(scope, 'B2cRefreshWorkerTask', {
    cpu: 256,
    memoryLimitMiB: 512,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
  })

  const b2cRefreshLogGroup = new LogGroup(scope, 'B2cRefreshLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/b2c-refresh-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const b2cRefreshOtelLogGroup = new LogGroup(scope, 'B2cRefreshOtelLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/b2c-refresh-worker-otel`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  b2cRefreshTask.addContainer('B2cRefreshWorkerContainer', {
    image,
    command: ['node', 'backend/dist/scripts/aws/b2c-refresh-worker-ecs.js'],
    environment: {
      ...sharedEnv,
      B2C_REFRESH_LIMIT: '50',
      B2C_REFRESH_CONCURRENCY: '5',
      B2C_REFRESH_HEALTH_ENABLED: '0',
      ...(quoteRefreshQueueUrl ? { QUOTE_REFRESH_QUEUE_URL: quoteRefreshQueueUrl } : {}),
    },
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'b2c-refresh-worker',
      logGroup: b2cRefreshLogGroup,
    }),
  })
  b2cRefreshTask.addContainer('B2cRefreshOtelCollector', {
    image: ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-otel-collector:latest'),
    cpu: 32,
    memoryLimitMiB: 256,
    environment: {
      AWS_REGION: Stack.of(scope).region,
      AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
    },
    logging: LogDrivers.awsLogs({
      streamPrefix: 'b2c-refresh-worker-otel',
      logGroup: b2cRefreshOtelLogGroup,
    }),
    portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
  })

  const ingestFanoutTask = new FargateTaskDefinition(scope, 'IngestFanoutWorkerTask', {
    cpu: 512,
    memoryLimitMiB: 1024,
    executionRole: options.roles.planeBEcsTaskExecutionRole,
    taskRole: options.roles.planeBEcsTaskRole,
  })

  const ingestFanoutLogGroup = new LogGroup(scope, 'IngestFanoutLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/ingest-fanout-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const ingestFanoutOtelLogGroup = new LogGroup(scope, 'IngestFanoutOtelLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/ingest-fanout-worker-otel`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  ingestFanoutTask.addContainer('IngestFanoutWorkerContainer', {
    image,
    command: ['node', 'backend/dist/scripts/ingest-fanout-worker.js'],
    environment: sharedEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'ingest-fanout-worker',
      logGroup: ingestFanoutLogGroup,
    }),
  })
  ingestFanoutTask.addContainer('IngestFanoutOtelCollector', {
    image: ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-otel-collector:latest'),
    cpu: 32,
    memoryLimitMiB: 256,
    environment: {
      AWS_REGION: Stack.of(scope).region,
      AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
    },
    logging: LogDrivers.awsLogs({
      streamPrefix: 'ingest-fanout-worker-otel',
      logGroup: ingestFanoutOtelLogGroup,
    }),
    portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
  })

  const notificationsQueueTask = new FargateTaskDefinition(
    scope,
    'NotificationsQueueWorkerTask',
    {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole: options.roles.planeBEcsTaskExecutionRole,
      taskRole: options.roles.planeBEcsTaskRole,
    },
  )

  const notificationsLogGroup = new LogGroup(scope, 'NotificationsQueueLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/notifications-queue-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const notificationsOtelLogGroup = new LogGroup(
    scope,
    'NotificationsQueueOtelLogGroup',
    {
      logGroupName: `/remit-scout/${options.envName}/notifications-queue-worker-otel`,
      retention: logRetention,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    },
  )

  notificationsQueueTask.addContainer('NotificationsQueueWorkerContainer', {
    image,
    command: ['node', 'backend/dist/scripts/notifications-queue-worker.js'],
    environment: sharedEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'notifications-queue-worker',
      logGroup: notificationsLogGroup,
    }),
  })
  notificationsQueueTask.addContainer('NotificationsQueueOtelCollector', {
    image: ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-otel-collector:latest'),
    cpu: 32,
    memoryLimitMiB: 256,
    environment: {
      AWS_REGION: Stack.of(scope).region,
      AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
    },
    logging: LogDrivers.awsLogs({
      streamPrefix: 'notifications-queue-worker-otel',
      logGroup: notificationsOtelLogGroup,
    }),
    portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
  })

  const opsAlertsQueueTask = new FargateTaskDefinition(
    scope,
    'OpsAlertsQueueWorkerTask',
    {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole: options.roles.planeBEcsTaskExecutionRole,
      taskRole: options.roles.planeBEcsTaskRole,
    },
  )

  const opsAlertsLogGroup = new LogGroup(scope, 'OpsAlertsQueueLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/ops-alerts-queue-worker`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })
  const opsAlertsOtelLogGroup = new LogGroup(scope, 'OpsAlertsQueueOtelLogGroup', {
    logGroupName: `/remit-scout/${options.envName}/ops-alerts-queue-worker-otel`,
    retention: logRetention,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  opsAlertsQueueTask.addContainer('OpsAlertsQueueWorkerContainer', {
    image,
    command: ['node', 'backend/dist/scripts/ops-alerts-queue-worker.js'],
    environment: sharedEnv,
    ...secretsConfig,
    logging: LogDrivers.awsLogs({
      streamPrefix: 'ops-alerts-queue-worker',
      logGroup: opsAlertsLogGroup,
    }),
  })
  opsAlertsQueueTask.addContainer('OpsAlertsQueueOtelCollector', {
    image: ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-otel-collector:latest'),
    cpu: 32,
    memoryLimitMiB: 256,
    environment: {
      AWS_REGION: Stack.of(scope).region,
      AWS_OTEL_CONFIG_CONTENT: otelConfigContent,
    },
    logging: LogDrivers.awsLogs({
      streamPrefix: 'ops-alerts-queue-worker-otel',
      logGroup: opsAlertsOtelLogGroup,
    }),
    portMappings: [{ containerPort: 4318, protocol: Protocol.TCP }],
  })

  return {
    planeBIngestTask,
    b2cRefreshTask,
    ingestFanoutTask,
    notificationsQueueTask,
    opsAlertsQueueTask,
  }
}
