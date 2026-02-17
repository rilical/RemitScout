import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import {
  AuroraPostgresEngineVersion,
  ClusterInstance,
  Credentials,
  PerformanceInsightRetention,
  ParameterGroup,
  DatabaseCluster,
  DatabaseClusterEngine,
  DatabaseProxy,
  ProxyTarget,
} from 'aws-cdk-lib/aws-rds'
import { InstanceType, SubnetType, type SecurityGroup, type Vpc } from 'aws-cdk-lib/aws-ec2'
import { Key } from 'aws-cdk-lib/aws-kms'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import type { Construct } from 'constructs'

export type DatabaseResources = {
  cluster: DatabaseCluster
  proxy?: DatabaseProxy
  credentialsSecret: Secret
  encryptionKey: Key
}

export type DatabaseOptions = {
  envName: string
  vpc: Vpc
  dbSecurityGroup: SecurityGroup
  proxySecurityGroup?: SecurityGroup
  enableProxy?: boolean
}

export const createDatabase = (scope: Construct, options: DatabaseOptions): DatabaseResources => {
  const isProd = options.envName === 'prod'
  const isDev = options.envName === 'dev'
  const isStaging = options.envName === 'staging'
  const enableProxy = options.enableProxy ?? true

  const encryptionKey = new Key(scope, 'DatabaseEncryptionKey', {
    description: `RemitScout ${options.envName} Aurora encryption key`,
    enableKeyRotation: true,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    alias: `alias/remit-scout-${options.envName}-rds`,
  })

  const parameterGroup = new ParameterGroup(scope, 'DatabaseParameterGroup', {
    engine: DatabaseClusterEngine.auroraPostgres({
      version: AuroraPostgresEngineVersion.VER_15_14,
    }),
    parameters: {
      shared_preload_libraries: 'pgaudit',
      'pgaudit.log': 'all',
      'pgaudit.log_catalog': 'on',
      'pgaudit.log_parameter': 'on',
      'pgaudit.log_relation': 'on',
      'pgaudit.log_statement_once': 'on',
      log_connections: '1',
      log_disconnections: '1',
      log_statement: 'all',
      log_min_duration_statement: '1000',
    },
  })

  const credentialsSecret = new Secret(scope, 'AuroraMasterSecret', {
    secretName: `remit-scout/${options.envName}/database/master`,
    generateSecretString: {
      secretStringTemplate: JSON.stringify({ username: 'remit_scout' }),
      generateStringKey: 'password',
      excludePunctuation: true,
    },
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  const clusterBaseProps = {
    engine: DatabaseClusterEngine.auroraPostgres({
      version: AuroraPostgresEngineVersion.VER_15_14,
    }),
    credentials: Credentials.fromSecret(credentialsSecret),
    defaultDatabaseName: 'remit_scout',
    backup: { retention: Duration.days(isProd ? 30 : (isDev ? 3 : 14)) },
    storageEncrypted: true,
    storageEncryptionKey: encryptionKey,
    deletionProtection: isProd || isStaging,
    parameterGroup,
    cloudwatchLogsExports: ['postgresql'],
    cloudwatchLogsRetention: isProd ? RetentionDays.ONE_YEAR : RetentionDays.ONE_MONTH,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  }

  const dbSubnetType = SubnetType.PRIVATE_WITH_EGRESS

  const cluster = isDev
    ? new DatabaseCluster(scope, 'RemitScoutAuroraCluster', {
        ...clusterBaseProps,
        vpc: options.vpc,
        vpcSubnets: { subnetType: dbSubnetType },
        securityGroups: [options.dbSecurityGroup],
        writer: ClusterInstance.serverlessV2('Writer', {
          publiclyAccessible: false,
        }),
        serverlessV2MinCapacity: 0,
        serverlessV2MaxCapacity: 1,
        serverlessV2AutoPauseDuration: Duration.minutes(10),
      })
    : new DatabaseCluster(scope, 'RemitScoutAuroraCluster', {
        ...clusterBaseProps,
        instances: isProd ? 2 : 1,
        instanceProps: {
          vpc: options.vpc,
          vpcSubnets: { subnetType: dbSubnetType },
          securityGroups: [options.dbSecurityGroup],
          instanceType: new InstanceType(isProd ? 'r6g.xlarge' : 'r6g.large'),
          enablePerformanceInsights: true,
          performanceInsightRetention: PerformanceInsightRetention.DEFAULT,
        },
      })

  const proxy = enableProxy
    ? new DatabaseProxy(scope, 'RemitScoutDbProxy', {
        proxyTarget: ProxyTarget.fromCluster(cluster),
        vpc: options.vpc,
        secrets: [credentialsSecret],
        requireTLS: true,
        borrowTimeout: Duration.seconds(120),
        idleClientTimeout: Duration.minutes(10),
        maxConnectionsPercent: 90,
        maxIdleConnectionsPercent: 50,
        securityGroups: [options.proxySecurityGroup ?? options.dbSecurityGroup],
        vpcSubnets: { subnetType: dbSubnetType },
      })
    : undefined

  return {
    cluster,
    proxy,
    credentialsSecret,
    encryptionKey,
  }
}
