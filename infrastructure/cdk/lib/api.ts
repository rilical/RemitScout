import path from 'path'

import { Annotations, Duration, Fn, Stack, Token } from 'aws-cdk-lib'
import { HttpApi, HttpMethod, HttpStage } from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import {
  HttpIamAuthorizer,
  HttpJwtAuthorizer,
} from 'aws-cdk-lib/aws-apigatewayv2-authorizers'
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import { Runtime, Tracing, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { SubnetType, type SecurityGroup, type Vpc } from 'aws-cdk-lib/aws-ec2'
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { CfnIPSet, CfnWebACL } from 'aws-cdk-lib/aws-wafv2'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import type { Construct } from 'constructs'

import type { IamResources } from './iam'

export type ApiOptions = {
  envName: string
  vpc: Vpc
  roles: IamResources
  planeASecurityGroup: SecurityGroup
  planeCSecurityGroup: SecurityGroup
  planeADbSecretArn?: string
  planeADbSecretJsonKey?: string
  planeADbSsmName?: string
  planeADbHost?: string
  planeADbPort?: string
  planeADbName?: string
  planeCDbSecretArn?: string
  planeCDbSecretJsonKey?: string
  planeCDbSsmName?: string
  planeCDbHost?: string
  planeCDbPort?: string
  planeCDbName?: string
  redisSecretArn?: string
  redisSecretJsonKey?: string
  redisSsmName?: string
  planeCBaseUrl?: string
  quoteRefreshQueueUrl?: string
  exportJobQueueUrl?: string
  exportJobQueueMode?: string
  exportsBucketName?: string
  exportsPrefix?: string
  userAssetsBucketName?: string
  userAssetsPrefix?: string
  enableCloudFront?: boolean
  enableWaf?: boolean
  planeADomainName?: string
  planeACertificateArn?: string
  planeAHostedZoneId?: string
  planeAHostedZoneName?: string
  planeAJwtIssuer?: string
  planeAJwtAudiences?: string[]
  enablePlaneAJwtAuth?: boolean
  enablePlaneCIamAuth?: boolean
  disablePlaneCExecuteEndpoint?: boolean
  wafAllowListIps?: string[]
  wafBlockListIps?: string[]
  wafEnableBotControl?: boolean
  otelLambdaLayerArn?: string
  planeAThrottleRate?: number
  planeAThrottleBurst?: number
  planeCThrottleRate?: number
  planeCThrottleBurst?: number
}

export type ApiResources = {
  planeAApi: HttpApi
  planeCApi: HttpApi
  planeAFunction: NodejsFunction
  planeCFunction: NodejsFunction
  planeACloudFront?: Distribution
  planeAWaf?: CfnWebACL
}

export const createApi = (scope: Construct, options: ApiOptions): ApiResources => {
  const logRetention = options.envName === 'prod'
    ? RetentionDays.THIRTY_DAYS
    : RetentionDays.TWO_WEEKS
  const lambdaSubnets = { subnetType: SubnetType.PRIVATE_WITH_EGRESS }

  const planeAEnvironment: Record<string, string> = {
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }
  if (options.planeADbHost) {
    planeAEnvironment.PLANE_A_DB_HOST = options.planeADbHost
  }
  if (options.planeADbPort) {
    planeAEnvironment.PLANE_A_DB_PORT = options.planeADbPort
  }
  if (options.planeADbName) {
    planeAEnvironment.PLANE_A_DB_NAME = options.planeADbName
  }
  if (options.quoteRefreshQueueUrl) {
    planeAEnvironment.QUOTE_REFRESH_QUEUE_URL = options.quoteRefreshQueueUrl
  }
  if (options.exportJobQueueUrl) {
    planeAEnvironment.EXPORT_JOB_QUEUE_URL = options.exportJobQueueUrl
  }
  if (options.exportJobQueueMode) {
    planeAEnvironment.EXPORT_JOB_QUEUE_MODE = options.exportJobQueueMode
  }
  if (options.exportsBucketName) {
    planeAEnvironment.EXPORTS_S3_BUCKET = options.exportsBucketName
  }
  if (options.exportsPrefix) {
    planeAEnvironment.EXPORTS_S3_PREFIX = options.exportsPrefix
  }
  if (options.userAssetsBucketName) {
    planeAEnvironment.USER_ASSETS_S3_BUCKET = options.userAssetsBucketName
  }
  if (options.userAssetsPrefix) {
    planeAEnvironment.USER_ASSETS_S3_PREFIX = options.userAssetsPrefix
  }

  const planeCEnvironment: Record<string, string> = {
    NODE_ENV: 'production',
    PGSSLMODE: 'require',
    TRACING_EXPORTER: 'xray',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    CLOUDWATCH_METRICS_ENABLED: '1',
    CLOUDWATCH_NAMESPACE: 'RemitScout',
    CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS: '15000',
    CLOUDWATCH_HIGH_CARDINALITY_METRICS: '0',
  }

  const otelLambdaLayer = options.otelLambdaLayerArn
    ? LayerVersion.fromLayerVersionArn(scope, 'ApiOtelLambdaLayer', options.otelLambdaLayerArn)
    : undefined
  if (options.planeCDbHost) {
    planeCEnvironment.PLANE_C_DB_HOST = options.planeCDbHost
  }
  if (options.planeCDbPort) {
    planeCEnvironment.PLANE_C_DB_PORT = options.planeCDbPort
  }
  if (options.planeCDbName) {
    planeCEnvironment.PLANE_C_DB_NAME = options.planeCDbName
  }

  const planeCFunction = new NodejsFunction(scope, 'PlaneCApiFunction', {
    entry: path.resolve(__dirname, '..', '..', '..', 'backend', 'plane-c', 'src', 'lambda.ts'),
    handler: 'handler',
    runtime: Runtime.NODEJS_18_X,
    memorySize: 1024,
    timeout: Duration.seconds(30),
    role: options.roles.planeCLambdaRole,
    tracing: Tracing.ACTIVE,
    vpc: options.vpc,
    vpcSubnets: lambdaSubnets,
    securityGroups: [options.planeCSecurityGroup],
    environment: planeCEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  if (options.planeCDbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'PlaneCDbSecret',
      options.planeCDbSecretArn,
    )
    secret.grantRead(planeCFunction)
    planeCFunction.addEnvironment('PLANE_C_DB_SECRET_ARN', options.planeCDbSecretArn)
  }
  if (options.planeCDbSecretJsonKey) {
    planeCFunction.addEnvironment('PLANE_C_DB_SECRET_JSON_KEY', options.planeCDbSecretJsonKey)
  }
  if (options.planeCDbSsmName) {
    planeCFunction.addEnvironment('PLANE_C_DB_SSM_NAME', options.planeCDbSsmName)
  }
  if (options.redisSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'PlaneCRedisSecret',
      options.redisSecretArn,
    )
    secret.grantRead(planeCFunction)
    planeCFunction.addEnvironment('REDIS_SECRET_ARN', options.redisSecretArn)
  }
  if (options.redisSecretJsonKey) {
    planeCFunction.addEnvironment('REDIS_SECRET_JSON_KEY', options.redisSecretJsonKey)
  }
  if (options.redisSsmName) {
    planeCFunction.addEnvironment('REDIS_SSM_NAME', options.redisSsmName)
  }

  const enablePlaneCIamAuth = options.enablePlaneCIamAuth ?? options.envName === 'prod'
  if (enablePlaneCIamAuth && !options.disablePlaneCExecuteEndpoint) {
    Annotations.of(scope).addWarning(
      'Plane C IAM auth enabled but execute-api endpoint is still enabled. Consider setting disablePlaneCExecuteEndpoint=true or placing Plane C behind a private domain.',
    )
  }
  const planeCApi = new HttpApi(scope, 'PlaneCHttpApi', {
    apiName: `remit-scout-plane-c-${options.envName}`,
    disableExecuteApiEndpoint: options.disablePlaneCExecuteEndpoint ?? false,
    createDefaultStage: false,
  })
  const planeCIamAuthorizer = enablePlaneCIamAuth
    ? new HttpIamAuthorizer()
    : undefined
  const planeCIntegration = new HttpLambdaIntegration('PlaneCLambdaIntegration', planeCFunction)
  planeCApi.addRoutes({
    path: '/{proxy+}',
    methods: [HttpMethod.ANY],
    integration: planeCIntegration,
    authorizer: planeCIamAuthorizer,
  })
  planeCApi.addRoutes({
    path: '/',
    methods: [HttpMethod.ANY],
    integration: planeCIntegration,
    authorizer: planeCIamAuthorizer,
  })

  if (options.planeCBaseUrl) {
    planeAEnvironment.PLANE_C_BASE_URL = options.planeCBaseUrl
  } else {
    planeAEnvironment.PLANE_C_BASE_URL = planeCApi.apiEndpoint
  }

  const planeAFunction = new NodejsFunction(scope, 'PlaneAApiFunction', {
    entry: path.resolve(__dirname, '..', '..', '..', 'backend', 'plane-a', 'src', 'lambda.ts'),
    handler: 'handler',
    runtime: Runtime.NODEJS_18_X,
    memorySize: 1024,
    timeout: Duration.seconds(30),
    role: options.roles.planeALambdaRole,
    tracing: Tracing.ACTIVE,
    vpc: options.vpc,
    vpcSubnets: lambdaSubnets,
    securityGroups: [options.planeASecurityGroup],
    environment: planeAEnvironment,
    logRetention,
    layers: otelLambdaLayer ? [otelLambdaLayer] : undefined,
  })

  if (options.planeADbSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'PlaneADbSecret',
      options.planeADbSecretArn,
    )
    secret.grantRead(planeAFunction)
    planeAFunction.addEnvironment('PLANE_A_DB_SECRET_ARN', options.planeADbSecretArn)
  }
  if (options.planeADbSecretJsonKey) {
    planeAFunction.addEnvironment('PLANE_A_DB_SECRET_JSON_KEY', options.planeADbSecretJsonKey)
  }
  if (options.planeADbSsmName) {
    planeAFunction.addEnvironment('PLANE_A_DB_SSM_NAME', options.planeADbSsmName)
  }
  if (options.redisSecretArn) {
    const secret = Secret.fromSecretCompleteArn(
      scope,
      'PlaneARedisSecret',
      options.redisSecretArn,
    )
    secret.grantRead(planeAFunction)
    planeAFunction.addEnvironment('REDIS_SECRET_ARN', options.redisSecretArn)
  }
  if (options.redisSecretJsonKey) {
    planeAFunction.addEnvironment('REDIS_SECRET_JSON_KEY', options.redisSecretJsonKey)
  }
  if (options.redisSsmName) {
    planeAFunction.addEnvironment('REDIS_SSM_NAME', options.redisSsmName)
  }

  const enablePlaneAJwtAuth = options.enablePlaneAJwtAuth ?? options.envName === 'prod'
  const jwtIssuer = options.planeAJwtIssuer
  const jwtAudiences = options.planeAJwtAudiences ?? []
  const planeAJwtAuthorizer = enablePlaneAJwtAuth && jwtIssuer && jwtAudiences.length > 0
    ? new HttpJwtAuthorizer('PlaneAJwtAuthorizer', jwtIssuer, {
      jwtAudience: jwtAudiences,
    })
    : undefined
  if (enablePlaneAJwtAuth && !planeAJwtAuthorizer) {
    Annotations.of(scope).addWarning(
      'Plane A JWT auth enabled but issuer/audience missing; requests will be unauthenticated at API Gateway.',
    )
  }

  const planeAApi = new HttpApi(scope, 'PlaneAHttpApi', {
    apiName: `remit-scout-plane-a-${options.envName}`,
    createDefaultStage: false,
  })
  const planeAIntegration = new HttpLambdaIntegration('PlaneALambdaIntegration', planeAFunction)

  const publicRoutes = [
    '/healthz',
    '/readyz',
    '/metrics',
    '/api/quotes/current',
    '/api/v1/quotes/current',
    '/api/popular-corridors',
    '/api/v1/popular-corridors',
    '/api/billing/webhook',
    '/api/v1/billing/webhook',
    '/api/contact',
    '/api/v1/contact',
  ]

  for (const path of publicRoutes) {
    planeAApi.addRoutes({
      path,
      methods: [HttpMethod.ANY],
      integration: planeAIntegration,
    })
  }

  planeAApi.addRoutes({
    path: '/{proxy+}',
    methods: [HttpMethod.ANY],
    integration: planeAIntegration,
    authorizer: planeAJwtAuthorizer,
  })
  planeAApi.addRoutes({
    path: '/',
    methods: [HttpMethod.ANY],
    integration: planeAIntegration,
    authorizer: planeAJwtAuthorizer,
  })

  new HttpStage(scope, 'PlaneAStage', {
    httpApi: planeAApi,
    stageName: '$default',
    autoDeploy: true,
    throttle: {
      rateLimit: options.planeAThrottleRate ?? 50,
      burstLimit: options.planeAThrottleBurst ?? 100,
    },
    detailedMetricsEnabled: true,
  })

  new HttpStage(scope, 'PlaneCStage', {
    httpApi: planeCApi,
    stageName: '$default',
    autoDeploy: true,
    throttle: {
      rateLimit: options.planeCThrottleRate ?? 20,
      burstLimit: options.planeCThrottleBurst ?? 40,
    },
    detailedMetricsEnabled: true,
  })

  let planeAWaf: CfnWebACL | undefined
  let planeACloudFront: Distribution | undefined
  const planeADomainName = options.planeADomainName
  const planeACertificateArn = options.planeACertificateArn
  const enableCloudFront = options.enableCloudFront ?? options.envName === 'prod'
  const enableWaf = options.enableWaf ?? options.envName === 'prod'
  const wafAllowList = options.wafAllowListIps ?? []
  const wafBlockList = options.wafBlockListIps ?? []
  const wafEnableBotControl = options.wafEnableBotControl ?? false

  if (enableCloudFront) {
    if (enableWaf) {
      const region = Stack.of(scope).region
      const regionReady = Token.isUnresolved(region) || region === 'us-east-1'

      if (regionReady) {
        const ipSetRules: CfnWebACL.RuleProperty[] = []

        let allowIpSet: CfnIPSet | undefined
        if (wafAllowList.length > 0) {
          allowIpSet = new CfnIPSet(scope, 'PlaneAAllowIpSet', {
            addresses: wafAllowList,
            ipAddressVersion: 'IPV4',
            name: `remit-scout-${options.envName}-allow`,
            scope: 'CLOUDFRONT',
          })
          ipSetRules.push({
            name: 'AllowList',
            priority: 0,
            action: { allow: {} },
            statement: {
              ipSetReferenceStatement: {
                arn: allowIpSet.attrArn,
              },
            },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: `remit-scout-${options.envName}-allow`,
              sampledRequestsEnabled: true,
            },
          })
        }

        if (wafBlockList.length > 0) {
          const blockIpSet = new CfnIPSet(scope, 'PlaneABlockIpSet', {
            addresses: wafBlockList,
            ipAddressVersion: 'IPV4',
            name: `remit-scout-${options.envName}-block`,
            scope: 'CLOUDFRONT',
          })
          ipSetRules.push({
            name: 'BlockList',
            priority: allowIpSet ? 1 : 0,
            action: { block: {} },
            statement: {
              ipSetReferenceStatement: {
                arn: blockIpSet.attrArn,
              },
            },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: `remit-scout-${options.envName}-block`,
              sampledRequestsEnabled: true,
            },
          })
        }

        planeAWaf = new CfnWebACL(scope, 'PlaneAWebAcl', {
          name: `remit-scout-${options.envName}-edge`,
          scope: 'CLOUDFRONT',
          defaultAction: wafAllowList.length > 0 ? { block: {} } : { allow: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `remit-scout-${options.envName}-edge`,
            sampledRequestsEnabled: true,
          },
          rules: [
            ...ipSetRules,
            {
              name: 'AWSManagedRulesCommonRuleSet',
              priority: ipSetRules.length + 0,
              overrideAction: { none: {} },
              statement: {
                managedRuleGroupStatement: {
                  vendorName: 'AWS',
                  name: 'AWSManagedRulesCommonRuleSet',
                },
              },
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: `remit-scout-${options.envName}-common`,
                sampledRequestsEnabled: true,
              },
            },
            ...(wafEnableBotControl
              ? [{
                name: 'AWSManagedRulesBotControlRuleSet',
                priority: ipSetRules.length + 1,
                overrideAction: { none: {} },
                statement: {
                  managedRuleGroupStatement: {
                    vendorName: 'AWS',
                    name: 'AWSManagedRulesBotControlRuleSet',
                  },
                },
                visibilityConfig: {
                  cloudWatchMetricsEnabled: true,
                  metricName: `remit-scout-${options.envName}-bot-control`,
                  sampledRequestsEnabled: true,
                },
              }]
              : []),
            {
              name: 'RateLimit',
              priority: ipSetRules.length + (wafEnableBotControl ? 2 : 1),
              action: { block: {} },
              statement: {
                rateBasedStatement: {
                  limit: 2000,
                  aggregateKeyType: 'IP',
                },
              },
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: `remit-scout-${options.envName}-rate`,
                sampledRequestsEnabled: true,
              },
            },
          ],
        })
      } else {
        Annotations.of(scope).addWarning(
          'CloudFront WAF requires stack region us-east-1; set enableWaf=false or deploy edge resources in us-east-1.',
        )
      }
    }

    const apiDomain = Fn.select(2, Fn.split('/', planeAApi.apiEndpoint))
    const origin = new HttpOrigin(apiDomain)

    planeACloudFront = new Distribution(scope, 'PlaneACloudFront', {
      defaultBehavior: {
        origin,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
      },
      webAclId: planeAWaf?.attrArn,
      domainNames: planeADomainName ? [planeADomainName] : undefined,
      certificate: planeADomainName && planeACertificateArn
        ? Certificate.fromCertificateArn(scope, 'PlaneACert', planeACertificateArn)
        : undefined,
      comment: `Plane A edge distribution (${options.envName})`,
    })

    if (planeADomainName && !planeACertificateArn) {
      Annotations.of(scope).addWarning(
        'Plane A domain name provided without certificate ARN; CloudFront will use the default domain.',
      )
    }

    if (planeACloudFront && planeADomainName && options.planeAHostedZoneId && options.planeAHostedZoneName) {
      const hostedZone = HostedZone.fromHostedZoneAttributes(scope, 'PlaneAHostedZone', {
        hostedZoneId: options.planeAHostedZoneId,
        zoneName: options.planeAHostedZoneName,
      })
      new ARecord(scope, 'PlaneACloudFrontAlias', {
        zone: hostedZone,
        recordName: planeADomainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(planeACloudFront)),
      })
    }
  }

  return {
    planeAApi,
    planeCApi,
    planeAFunction,
    planeCFunction,
    planeACloudFront,
    planeAWaf,
  }
}
