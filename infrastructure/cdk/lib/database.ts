import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import {
  AuroraPostgresEngineVersion,
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
  DatabaseProxy,
  ProxyTarget,
} from 'aws-cdk-lib/aws-rds'
import { InstanceType, SubnetType, type SecurityGroup, type Vpc } from 'aws-cdk-lib/aws-ec2'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import type { Construct } from 'constructs'

export type DatabaseResources = {
  cluster: DatabaseCluster
  proxy: DatabaseProxy
  credentialsSecret: Secret
}

export type DatabaseOptions = {
  envName: string
  vpc: Vpc
  dbSecurityGroup: SecurityGroup
  proxySecurityGroup?: SecurityGroup
}

export const createDatabase = (scope: Construct, options: DatabaseOptions): DatabaseResources => {
  const isProd = options.envName === 'prod'

  const credentialsSecret = new Secret(scope, 'AuroraMasterSecret', {
    secretName: `remit-scout/${options.envName}/database/master`,
    generateSecretString: {
      secretStringTemplate: JSON.stringify({ username: 'remit_scout' }),
      generateStringKey: 'password',
      excludePunctuation: true,
    },
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  const cluster = new DatabaseCluster(scope, 'RemitScoutAuroraCluster', {
    engine: DatabaseClusterEngine.auroraPostgres({
      version: AuroraPostgresEngineVersion.VER_15_4,
    }),
    credentials: Credentials.fromSecret(credentialsSecret),
    instances: isProd ? 2 : 1,
    instanceProps: {
      vpc: options.vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [options.dbSecurityGroup],
      instanceType: new InstanceType(isProd ? 'r6g.xlarge' : 'r6g.large'),
    },
    defaultDatabaseName: 'remit_scout',
    backup: { retention: Duration.days(isProd ? 30 : 7) },
    storageEncrypted: true,
    deletionProtection: isProd,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  })

  const proxy = new DatabaseProxy(scope, 'RemitScoutDbProxy', {
    proxyTarget: ProxyTarget.fromCluster(cluster),
    vpc: options.vpc,
    secrets: [credentialsSecret],
    requireTLS: true,
    borrowTimeout: Duration.seconds(120),
    idleClientTimeout: Duration.minutes(10),
    maxConnectionsPercent: 90,
    maxIdleConnectionsPercent: 50,
    securityGroups: [options.proxySecurityGroup ?? options.dbSecurityGroup],
    vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
  })

  return {
    cluster,
    proxy,
    credentialsSecret,
  }
}
