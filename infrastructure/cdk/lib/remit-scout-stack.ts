import { Stack, type StackProps, Tags, CfnOutput } from 'aws-cdk-lib'
import type { Construct } from 'constructs'

import { createNetworking } from './vpc'
import { createIam } from './iam'
import { createCompute } from './compute'
import { createScheduledJobs } from './scheduled-jobs'
import { createRegistry } from './registry'
import { createEcsTasks } from './ecs-tasks'
import { createEcsServices } from './ecs-services'
import { createDatabase } from './database'
import { createCache } from './cache'
import { createStorage } from './storage'
import { createQueues } from './queues'
import { createApi } from './api'
import { createFrontend } from './frontend'
import { createPipeline } from './pipeline'
import { createBackup } from './backup'
import { createMonitoring } from './monitoring'
import { createSynthetics } from './synthetics'
import { createSnsSubscriptions } from './sns-subscriptions'

const toOptionalBool = (value: string | boolean | undefined): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return value === '1' || value.toLowerCase() === 'true'
  }
  return undefined
}

const toOptionalNumber = (value: string | number | undefined): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const toList = (value: string | string[] | undefined): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

const normalizeOrigin = (value?: string): string => {
  if (!value) return ''
  try {
    return new URL(value).origin
  } catch {
    return value.replace(/\/$/, '')
  }
}

export type RemitScoutStackProps = StackProps & {
  envName?: string
}

export class RemitScoutStack extends Stack {
  constructor(scope: Construct, id: string, props: RemitScoutStackProps) {
    super(scope, id, props)

    const envName = props.envName ?? 'dev'
    Tags.of(this).add('project', 'remit-scout')
    Tags.of(this).add('environment', envName)

    const imageTag =
      this.node.tryGetContext('backendImageTag') ??
      process.env.BACKEND_IMAGE_TAG ??
      'latest'
    const devSharedSecretArn =
      this.node.tryGetContext('devSharedSecretArn') ??
      process.env.DEV_SHARED_SECRET_ARN ??
      (envName === 'dev'
        ? 'arn:aws:secretsmanager:us-east-1:716156543157:secret:rs-development-eZ3K6K'
        : undefined)

    const networking = createNetworking(this, { envName })
    const iam = createIam(this, {
      envName,
      sharedSecretArns: devSharedSecretArn ? [devSharedSecretArn] : [],
    })
    const registry = createRegistry(this, { envName })
    const database = createDatabase(this, {
      envName,
      vpc: networking.vpc,
      dbSecurityGroup: networking.dbSecurityGroup,
    })
    const cache = createCache(this, {
      envName,
      vpc: networking.vpc,
      redisSecurityGroup: networking.redisSecurityGroup,
    })
    const storage = createStorage(this, { envName })
    const queues = createQueues(this, { envName })

    const planeADbSecretArn =
      this.node.tryGetContext('planeADbSecretArn') ??
      process.env.PLANE_A_DB_SECRET_ARN ??
      database.credentialsSecret.secretArn
    const planeADbSecretJsonKey =
      this.node.tryGetContext('planeADbSecretJsonKey') ??
      process.env.PLANE_A_DB_SECRET_JSON_KEY
    const planeADbSsmName =
      this.node.tryGetContext('planeADbSsmName') ??
      process.env.PLANE_A_DB_SSM_NAME
    const planeBDbSecretArn =
      this.node.tryGetContext('planeBDbSecretArn') ??
      process.env.PLANE_B_DB_SECRET_ARN ??
      database.credentialsSecret.secretArn
    const planeBDbSsmName =
      this.node.tryGetContext('planeBDbSsmName') ??
      process.env.PLANE_B_DB_SSM_NAME
    const planeCDbSecretArn =
      this.node.tryGetContext('planeCDbSecretArn') ??
      process.env.PLANE_C_DB_SECRET_ARN ??
      database.credentialsSecret.secretArn
    const planeCDbSecretJsonKey =
      this.node.tryGetContext('planeCDbSecretJsonKey') ??
      process.env.PLANE_C_DB_SECRET_JSON_KEY
    const planeCDbSsmName =
      this.node.tryGetContext('planeCDbSsmName') ??
      process.env.PLANE_C_DB_SSM_NAME
    const redisSecretArn =
      this.node.tryGetContext('redisSecretArn') ??
      process.env.REDIS_SECRET_ARN
    const redisSecretJsonKey =
      this.node.tryGetContext('redisSecretJsonKey') ??
      process.env.REDIS_SECRET_JSON_KEY
    const redisSsmName =
      this.node.tryGetContext('redisSsmName') ??
      process.env.REDIS_SSM_NAME
    const redisUrl = `rediss://${cache.replicationGroup.attrPrimaryEndPointAddress}:${cache.replicationGroup.attrPrimaryEndPointPort}`
    const supabaseSecretArn =
      this.node.tryGetContext('supabaseSecretArn') ??
      process.env.SUPABASE_SECRET_ARN ??
      devSharedSecretArn
    const supabaseSsmName =
      this.node.tryGetContext('supabaseSsmName') ??
      process.env.SUPABASE_SSM_NAME
    const stripeSecretArn =
      this.node.tryGetContext('stripeSecretArn') ??
      process.env.STRIPE_SECRET_ARN ??
      devSharedSecretArn
    const stripeSsmName =
      this.node.tryGetContext('stripeSsmName') ??
      process.env.STRIPE_SSM_NAME
    const communicationsSecretArn =
      this.node.tryGetContext('communicationsSecretArn') ??
      process.env.COMMUNICATIONS_SECRET_ARN
    const oandaSecretArn =
      this.node.tryGetContext('oandaSecretArn') ??
      process.env.OANDA_SECRET_ARN
    const oandaSsmName =
      this.node.tryGetContext('oandaSsmName') ??
      process.env.OANDA_SSM_NAME
    const proxyResidentialSecretArn =
      this.node.tryGetContext('proxyResidentialSecretArn') ??
      process.env.PROXY_RESIDENTIAL_SECRET_ARN
    const proxyResidentialSecretJsonKey =
      this.node.tryGetContext('proxyResidentialSecretJsonKey') ??
      process.env.PROXY_RESIDENTIAL_SECRET_JSON_KEY
    const proxyResidentialSsmName =
      this.node.tryGetContext('proxyResidentialSsmName') ??
      process.env.PROXY_RESIDENTIAL_SSM_NAME
    const proxyResidentialUrl =
      this.node.tryGetContext('proxyResidentialUrl') ??
      process.env.PROXY_RESIDENTIAL_URL
    const proxyDatacenterSecretArn =
      this.node.tryGetContext('proxyDatacenterSecretArn') ??
      process.env.PROXY_DATACENTER_SECRET_ARN
    const proxyDatacenterSecretJsonKey =
      this.node.tryGetContext('proxyDatacenterSecretJsonKey') ??
      process.env.PROXY_DATACENTER_SECRET_JSON_KEY
    const proxyDatacenterSsmName =
      this.node.tryGetContext('proxyDatacenterSsmName') ??
      process.env.PROXY_DATACENTER_SSM_NAME
    const proxyDatacenterUrl =
      this.node.tryGetContext('proxyDatacenterUrl') ??
      process.env.PROXY_DATACENTER_URL
    const ingestFanoutMode =
      this.node.tryGetContext('planeBIngestFanoutMode') ??
      process.env.PLANE_B_INGEST_FANOUT_QUEUE_MODE ??
      (envName === 'prod' || envName === 'dev' ? 'queue' : 'off')
    const goldLiveQueueMode =
      this.node.tryGetContext('goldLiveQueueMode') ??
      process.env.GOLD_LIVE_QUEUE_MODE ??
      (envName === 'dev' ? 'queue' : 'off')
    const notificationsMode =
      this.node.tryGetContext('planeBNotificationsMode') ??
      process.env.PLANE_B_NOTIFICATIONS_QUEUE_MODE ??
      (envName === 'prod' || envName === 'dev' ? 'queue' : 'off')
    const opsAlertsMode =
      this.node.tryGetContext('planeBOpsAlertsMode') ??
      process.env.PLANE_B_OPS_ALERT_QUEUE_MODE ??
      (envName === 'prod' || envName === 'dev' ? 'queue' : 'off')
    const b2cRefreshServiceEnabled = toOptionalBool(
      this.node.tryGetContext('planeBB2cRefreshServiceEnabled') ??
        process.env.PLANE_B_B2C_REFRESH_SERVICE_ENABLED,
    ) ?? (envName === 'prod' || envName === 'dev')
    const b2cQueueInSweep =
      this.node.tryGetContext('planeBB2cQueueInSweep') ??
      process.env.PLANE_B_B2C_QUEUE_IN_SWEEP ??
      (b2cRefreshServiceEnabled ? undefined : (envName === 'dev' ? '0' : undefined))
    const planeBB2bTargetMinutes =
      this.node.tryGetContext('planeBB2bTargetMinutes') ??
      process.env.PLANE_B_B2B_TARGET_MINUTES ??
      (envName === 'dev' ? '240' : undefined)
    const planeBB2bObservationMode =
      this.node.tryGetContext('planeBB2bObservationMode') ??
      process.env.PLANE_B_B2B_OBSERVATION_MODE ??
      (envName === 'dev' ? '0' : undefined)
    const planeBB2bMaxQueueDepth =
      this.node.tryGetContext('planeBB2bMaxQueueDepth') ??
      process.env.PLANE_B_B2B_MAX_QUEUE_DEPTH ??
      (envName === 'dev' ? '5000' : undefined)
    const quoteRefreshQueueMode =
      this.node.tryGetContext('quoteRefreshQueueMode') ??
      process.env.QUOTE_REFRESH_QUEUE_MODE ??
      (envName === 'dev' ? 'queue' : (envName === 'prod' ? 'queue' : 'off'))
    const exportJobQueueMode =
      this.node.tryGetContext('exportJobQueueMode') ??
      process.env.EXPORT_JOB_QUEUE_MODE ??
      (envName === 'prod' || envName === 'dev' ? 'queue' : 'off')
    const planeBIngestDesiredCount = toOptionalNumber(
      this.node.tryGetContext('planeBIngestDesiredCount') ??
        process.env.PLANE_B_INGEST_DESIRED_COUNT,
    ) ?? (envName === 'dev' ? 1 : undefined)
    const planeBQueueWorkerDesiredCount = toOptionalNumber(
      this.node.tryGetContext('planeBQueueWorkerDesiredCount') ??
        process.env.PLANE_B_QUEUE_WORKER_DESIRED_COUNT,
    ) ?? (envName === 'dev' ? 1 : undefined)
    const planeBQueueWorkerMaxCount = toOptionalNumber(
      this.node.tryGetContext('planeBQueueWorkerMaxCount') ??
        process.env.PLANE_B_QUEUE_WORKER_MAX,
    ) ?? (envName === 'prod' ? 20 : envName === 'dev' ? 10 : 50)
    const planeBQueueWorkerSpotOnly = toOptionalBool(
      this.node.tryGetContext('planeBQueueWorkerSpotOnly') ??
        process.env.PLANE_B_QUEUE_WORKER_SPOT_ONLY,
    )
    const bronzePrefix =
      this.node.tryGetContext('bronzePrefix') ??
      process.env.BRONZE_S3_PREFIX ??
      'bronze'
    const exportsPrefix =
      this.node.tryGetContext('exportsPrefix') ??
      process.env.EXPORTS_S3_PREFIX ??
      'exports'
    const userAssetsPrefix =
      this.node.tryGetContext('userAssetsPrefix') ??
      process.env.USER_ASSETS_S3_PREFIX ??
      'avatars'
    const auditLogsPrefix =
      this.node.tryGetContext('auditLogsPrefix') ??
      process.env.AUDIT_LOGS_S3_PREFIX ??
      'audit-logs'
    const planeCBaseUrl =
      this.node.tryGetContext('planeCBaseUrl') ??
      process.env.PLANE_C_BASE_URL
    const enableCloudFront = toOptionalBool(
      this.node.tryGetContext('enableCloudFront') ??
        process.env.ENABLE_CLOUDFRONT,
    ) ?? (envName === 'prod')
    const enableWaf = toOptionalBool(
      this.node.tryGetContext('enableWaf') ??
        process.env.ENABLE_WAF,
    ) ?? (envName === 'prod')
    const enablePlaneAJwtAuth = toOptionalBool(
      this.node.tryGetContext('enablePlaneAJwtAuth') ??
        process.env.PLANE_A_ENABLE_JWT_AUTH,
    )
    const planeAJwtIssuer = (() => {
      const explicit =
        this.node.tryGetContext('planeAJwtIssuer') ??
        process.env.PLANE_A_JWT_ISSUER
      if (explicit) return explicit
      const supabaseUrl = process.env.SUPABASE_URL
      if (supabaseUrl) {
        return `${supabaseUrl.replace(/\/$/, '')}/auth/v1`
      }
      return undefined
    })()
    const planeAJwtAudiences = (() => {
      const raw =
        this.node.tryGetContext('planeAJwtAudiences') ??
        process.env.PLANE_A_JWT_AUDIENCES
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        return raw.split(',').map((value) => value.trim()).filter(Boolean)
      }
      return []
    })()
    const planeAAdminEmails = toList(
      this.node.tryGetContext('planeAAdminEmails') ??
      process.env.PLANE_A_ADMIN_EMAILS,
    )
    const planeACorsOriginsRaw = toList(
      this.node.tryGetContext('planeACorsOrigins') ??
      process.env.PLANE_A_CORS_ORIGINS,
    )
    const planeACorsAllowedHeaders = toList(
      this.node.tryGetContext('planeACorsAllowedHeaders') ??
      process.env.PLANE_A_CORS_ALLOWED_HEADERS,
    )
    const planeACorsAllowedMethods = toList(
      this.node.tryGetContext('planeACorsAllowedMethods') ??
      process.env.PLANE_A_CORS_ALLOWED_METHODS,
    )
    const planeACorsAllowCredentials = toOptionalBool(
      this.node.tryGetContext('planeACorsAllowCredentials') ??
        process.env.PLANE_A_CORS_ALLOW_CREDENTIALS,
    )
    const frontendDomainName =
      this.node.tryGetContext('frontendDomainName') ??
      process.env.FRONTEND_DOMAIN_NAME
    const frontendBaseUrl =
      this.node.tryGetContext('frontendBaseUrl') ??
      process.env.FRONTEND_BASE_URL ??
      process.env.PUBLIC_SITE_URL ??
      (frontendDomainName ? `https://${frontendDomainName}` : undefined)
    const normalizedFrontendOrigin = normalizeOrigin(frontendBaseUrl)
    const planeACorsOrigins = planeACorsOriginsRaw.length
      ? planeACorsOriginsRaw
      : (normalizedFrontendOrigin ? [normalizedFrontendOrigin] : [])
    const publicSupabaseUrl =
      this.node.tryGetContext('publicSupabaseUrl') ??
      process.env.PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_URL
    const publicSupabaseAnonKey =
      this.node.tryGetContext('publicSupabaseAnonKey') ??
      process.env.PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY
    const publicSupabaseUrlSecretJsonKey =
      this.node.tryGetContext('publicSupabaseUrlSecretJsonKey') ??
      process.env.PUBLIC_SUPABASE_URL_SECRET_JSON_KEY
    const publicSupabaseAnonKeySecretJsonKey =
      this.node.tryGetContext('publicSupabaseAnonKeySecretJsonKey') ??
      process.env.PUBLIC_SUPABASE_ANON_KEY_SECRET_JSON_KEY
    const enablePlaneCIamAuth = toOptionalBool(
      this.node.tryGetContext('enablePlaneCIamAuth') ??
        process.env.PLANE_C_ENABLE_IAM_AUTH,
    )
    const disablePlaneAExecuteEndpoint = toOptionalBool(
      this.node.tryGetContext('disablePlaneAExecuteEndpoint') ??
        process.env.PLANE_A_DISABLE_EXECUTE_ENDPOINT,
    )
    const disablePlaneCExecuteEndpoint = toOptionalBool(
      this.node.tryGetContext('disablePlaneCExecuteEndpoint') ??
        process.env.PLANE_C_DISABLE_EXECUTE_ENDPOINT,
    )
    const wafAllowListIps = (() => {
      const raw =
        this.node.tryGetContext('wafAllowListIps') ??
        process.env.WAF_ALLOWLIST_IPS
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        return raw.split(',').map((value) => value.trim()).filter(Boolean)
      }
      return []
    })()
    const wafBlockListIps = (() => {
      const raw =
        this.node.tryGetContext('wafBlockListIps') ??
        process.env.WAF_BLOCKLIST_IPS
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        return raw.split(',').map((value) => value.trim()).filter(Boolean)
      }
      return []
    })()
    const wafEnableBotControl = toOptionalBool(
      this.node.tryGetContext('wafEnableBotControl') ??
        process.env.WAF_ENABLE_BOT_CONTROL,
    )
    const planeAThrottleRate = toOptionalNumber(
      this.node.tryGetContext('planeAThrottleRate') ??
        process.env.PLANE_A_API_THROTTLE_RATE,
    )
    const planeAThrottleBurst = toOptionalNumber(
      this.node.tryGetContext('planeAThrottleBurst') ??
        process.env.PLANE_A_API_THROTTLE_BURST,
    )
    const planeCThrottleRate = toOptionalNumber(
      this.node.tryGetContext('planeCThrottleRate') ??
        process.env.PLANE_C_API_THROTTLE_RATE,
    )
    const planeCThrottleBurst = toOptionalNumber(
      this.node.tryGetContext('planeCThrottleBurst') ??
        process.env.PLANE_C_API_THROTTLE_BURST,
    )
    const otelLambdaLayerArn =
      this.node.tryGetContext('otelLambdaLayerArn') ??
      process.env.OTEL_LAMBDA_LAYER_ARN
    const slackWebhookUrl =
      this.node.tryGetContext('slackWebhookUrl') ??
      process.env.SLACK_WEBHOOK_URL
    const pagerDutyIntegrationKey =
      this.node.tryGetContext('pagerDutyIntegrationKey') ??
      process.env.PAGERDUTY_INTEGRATION_KEY
    const pipelineConnectionArn =
      this.node.tryGetContext('pipelineConnectionArn') ??
      process.env.PIPELINE_CONNECTION_ARN
    const pipelineRepoOwner =
      this.node.tryGetContext('pipelineRepoOwner') ??
      process.env.PIPELINE_REPO_OWNER ??
      (envName === 'dev' ? 'rilical' : undefined)
    const pipelineRepoName =
      this.node.tryGetContext('pipelineRepoName') ??
      process.env.PIPELINE_REPO_NAME ??
      (envName === 'dev' ? 'Remit-Scout-V2' : undefined)
    const pipelineRepoBranch =
      this.node.tryGetContext('pipelineRepoBranch') ??
      process.env.PIPELINE_REPO_BRANCH ??
      (envName === 'dev' ? 'develop' : undefined)
    const pipelineEnableDeploy =
      toOptionalBool(
        this.node.tryGetContext('pipelineEnableDeploy') ??
          process.env.PIPELINE_ENABLE_DEPLOY,
      ) ?? envName === 'dev'
    const pipelineRequireApproval =
      toOptionalBool(
        this.node.tryGetContext('pipelineRequireApproval') ??
          process.env.PIPELINE_REQUIRE_APPROVAL,
      ) ?? envName !== 'dev'

    const compute = createCompute(this, {
      envName,
      vpc: networking.vpc,
      roles: iam,
    })

    const planeADbHost = database.proxy.endpoint
    const planeADbPort = '5432'
    const planeADbName = 'remit_scout'
    const planeBDbHost = database.proxy.endpoint
    const planeBDbPort = '5432'
    const planeBDbName = 'remit_scout'
    const planeCDbHost = database.proxy.endpoint
    const planeCDbPort = '5432'
    const planeCDbName = 'remit_scout'

    const tasks = createEcsTasks(this, {
      envName,
      backendRepository: registry.backendRepository,
      imageTag,
      roles: iam,
      planeBDbSecretArn,
      planeBDbSsmName,
      redisSecretArn,
      redisSecretJsonKey,
      redisSsmName,
      redisUrl,
      planeBDbHost,
      planeBDbPort,
      planeBDbName,
      planeCDbSecretArn,
      planeCDbSsmName,
      planeCDbHost,
      planeCDbPort,
      planeCDbName,
      quoteRefreshQueueUrl: queues.quoteRefreshQueue.queueUrl,
      quoteRefreshQueueMode,
      ingestFanoutQueueUrl: queues.ingestFanoutQueue.queueUrl,
      goldLiveQueueUrl: queues.goldLiveQueue.queueUrl,
      goldLiveQueueMode,
      notificationsQueueUrl: queues.notificationsQueue.queueUrl,
      opsAlertsQueueUrl: queues.opsAlertsQueue.queueUrl,
      proxyResidentialSecretArn,
      proxyResidentialSecretJsonKey,
      proxyResidentialSsmName,
      proxyResidentialUrl,
      proxyDatacenterSecretArn,
      proxyDatacenterSecretJsonKey,
      proxyDatacenterSsmName,
      proxyDatacenterUrl,
      bronzeBucketName: storage.bronzeBucket.bucketName,
      bronzePrefix,
      b2cQueueInSweep,
      b2cRefreshLoopEnabled: b2cRefreshServiceEnabled,
      planeBB2bTargetMinutes,
      planeBB2bObservationMode,
      planeBB2bMaxQueueDepth,
      ingestFanoutMode,
      notificationsMode,
      opsAlertsMode,
    })

    const api = createApi(this, {
      envName,
      vpc: networking.vpc,
      roles: iam,
      planeASecurityGroup: networking.planeASecurityGroup,
      planeCSecurityGroup: networking.planeCSecurityGroup,
      quoteRefreshQueueUrl: queues.quoteRefreshQueue.queueUrl,
      quoteRefreshQueueMode,
      exportJobQueueUrl: queues.exportJobQueue.queueUrl,
      exportJobQueueMode,
      exportsBucketName: storage.exportsBucket.bucketName,
      exportsPrefix,
      userAssetsBucketName: storage.userAssetsBucket.bucketName,
      userAssetsPrefix,
      planeADbSecretArn,
      planeADbSecretJsonKey,
      planeADbSsmName,
      planeADbHost,
      planeADbPort,
      planeADbName,
      supabaseSecretArn,
      supabaseSsmName,
      stripeSecretArn,
      stripeSsmName,
      communicationsSecretArn,
      planeAAdminEmails,
      planeACorsOrigins,
      planeACorsAllowedHeaders,
      planeACorsAllowedMethods,
      planeACorsAllowCredentials,
      frontendBaseUrl,
      planeCDbSecretArn,
      planeCDbSecretJsonKey,
      planeCDbSsmName,
      planeCDbHost,
      planeCDbPort,
      planeCDbName,
      redisSecretArn,
      redisSecretJsonKey,
      redisSsmName,
      redisUrl,
      planeCBaseUrl,
      enableCloudFront,
      enableWaf,
      enablePlaneAJwtAuth,
      planeAJwtIssuer,
      planeAJwtAudiences,
      enablePlaneCIamAuth,
      disablePlaneAExecuteEndpoint,
      disablePlaneCExecuteEndpoint,
      wafAllowListIps,
      wafBlockListIps,
      wafEnableBotControl,
      otelLambdaLayerArn,
      planeAThrottleRate,
      planeAThrottleBurst,
      planeCThrottleRate,
      planeCThrottleBurst,
      planeADomainName:
        this.node.tryGetContext('planeADomainName') ?? process.env.PLANE_A_DOMAIN_NAME,
      planeACertificateArn:
        this.node.tryGetContext('planeACertificateArn') ?? process.env.PLANE_A_CERT_ARN,
      planeAHostedZoneId:
        this.node.tryGetContext('planeAHostedZoneId') ?? process.env.PLANE_A_HOSTED_ZONE_ID,
      planeAHostedZoneName:
        this.node.tryGetContext('planeAHostedZoneName') ?? process.env.PLANE_A_HOSTED_ZONE_NAME,
    })

    const frontend = createFrontend(this, {
      envName,
      frontendDomainName:
        frontendDomainName,
      frontendCertificateArn:
        this.node.tryGetContext('frontendCertificateArn') ?? process.env.FRONTEND_CERT_ARN,
      frontendHostedZoneId:
        this.node.tryGetContext('frontendHostedZoneId') ?? process.env.FRONTEND_HOSTED_ZONE_ID,
      frontendHostedZoneName:
        this.node.tryGetContext('frontendHostedZoneName') ?? process.env.FRONTEND_HOSTED_ZONE_NAME,
      planeAWaf: api.planeAWaf,
      planeACloudFrontDomain: api.planeACloudFront?.distributionDomainName,
    })

    const backup = createBackup(this, {
      envName,
      cluster: database.cluster,
      dbSecurityGroup: networking.dbSecurityGroup,
    })

    const ecsServices = createEcsServices(this, {
      envName,
      cluster: compute.cluster,
      planeBSecurityGroup: networking.planeBSecurityGroup,
      planeBIngestTask: tasks.planeBIngestTask,
      b2cRefreshTask: tasks.b2cRefreshTask,
      ingestFanoutTask: tasks.ingestFanoutTask,
      goldLiveTask: tasks.goldLiveTask,
      notificationsQueueTask: tasks.notificationsQueueTask,
      opsAlertsQueueTask: tasks.opsAlertsQueueTask,
      queues,
      ingestFanoutMode,
      goldLiveMode: goldLiveQueueMode,
      notificationsMode,
      opsAlertsMode,
      b2cRefreshDesiredCount: b2cRefreshServiceEnabled ? 1 : 0,
      planeBIngestDesiredCount,
      queueWorkerDesiredCount: planeBQueueWorkerDesiredCount,
      queueWorkerMaxCount: planeBQueueWorkerMaxCount,
      queueWorkerSpotOnly: planeBQueueWorkerSpotOnly,
    })

    // Create SNS subscriptions for alert routing (Slack, PagerDuty)
    const snsSubscriptions = createSnsSubscriptions(this, {
      envName,
      slackWebhookUrl,
      pagerDutyIntegrationKey,
    })

    // Determine Plane A base URL for synthetics (CloudFront if enabled, otherwise API Gateway)
    const planeABaseUrl =
      api.planeACloudFront?.distributionDomainName
        ? `https://${api.planeACloudFront.distributionDomainName}`
        : api.planeAApi.apiEndpoint

    // Create CloudWatch Synthetics canaries
    const synthetics = createSynthetics(this, {
      envName,
      planeABaseUrl,
      alertsTopic: snsSubscriptions.criticalTopic,
    })

    // Create monitoring with SNS topics from subscriptions
    const monitoring = createMonitoring(this, {
      envName,
      queues,
      api,
      ecs: ecsServices,
      database,
      cache,
      alertsTopic: snsSubscriptions.criticalTopic,
    })

    const pipeline = createPipeline(this, {
      envName,
      connectionArn: pipelineConnectionArn,
      repoOwner: pipelineRepoOwner,
      repoName: pipelineRepoName,
      repoBranch: pipelineRepoBranch,
      enableDeploy: pipelineEnableDeploy,
      requireApproval: pipelineRequireApproval,
      backendRepository: registry.backendRepository,
      frontendBucket: frontend?.bucket,
      frontendDistribution: frontend?.distribution,
      planeACloudFrontDomain: api.planeACloudFront?.distributionDomainName,
      planeAApiEndpoint: api.planeAApi.apiEndpoint,
      publicSupabaseUrl,
      publicSupabaseAnonKey,
      publicSupabaseSecretArn: supabaseSecretArn,
      publicSupabaseUrlSecretJsonKey,
      publicSupabaseAnonKeySecretJsonKey,
    })

    createScheduledJobs(this, {
      envName,
      roles: iam,
      cluster: compute.cluster,
      b2cRefreshTask: tasks.b2cRefreshTask,
      b2cRefreshServiceEnabled,
      vpc: networking.vpc,
      planeASecurityGroup: networking.planeASecurityGroup,
      planeBSecurityGroup: networking.planeBSecurityGroup,
      planeCSecurityGroup: networking.planeCSecurityGroup,
      otelLambdaLayerArn,
      planeBDbSecretArn,
      planeBDbSsmName,
      planeCDbSecretArn,
      planeCDbSsmName,
      redisSecretArn,
      redisSsmName,
      redisUrl,
      oandaSecretArn,
      oandaSsmName,
      communicationsSecretArn,
      planeADbSecretArn,
      planeADbSsmName,
      planeADbHost,
      planeADbPort,
      planeADbName,
      quoteRefreshQueueUrl: queues.quoteRefreshQueue.queueUrl,
      quoteRefreshQueueMode,
      exportJobQueueUrl: queues.exportJobQueue.queueUrl,
      exportJobQueueMode,
      exportsBucketName: storage.exportsBucket.bucketName,
      exportsPrefix,
      auditLogsBucketName: storage.auditLogsBucket.bucketName,
      auditLogsPrefix,
      alertEvaluationQueueUrl: queues.alertEvaluationQueue.queueUrl,
      planeBDbHost,
      planeBDbPort,
      planeBDbName,
      planeCDbHost,
      planeCDbPort,
      planeCDbName,
    })

    storage.bronzeBucket.grantReadWrite(iam.planeBEcsTaskRole)
    storage.exportsBucket.grantReadWrite(iam.planeALambdaRole)
    storage.userAssetsBucket.grantReadWrite(iam.planeALambdaRole)
    storage.auditLogsBucket.grantReadWrite(iam.planeALambdaRole)
    queues.quoteRefreshQueue.grantSendMessages(iam.planeALambdaRole)
    queues.quoteRefreshQueue.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.exportJobQueue.grantSendMessages(iam.planeALambdaRole)
    queues.exportJobQueue.grantConsumeMessages(iam.planeALambdaRole)
    queues.alertEvaluationQueue.grantSendMessages(iam.planeALambdaRole)
    queues.alertEvaluationQueue.grantConsumeMessages(iam.planeALambdaRole)
    queues.ingestFanoutQueue.grantSendMessages(iam.planeBEcsTaskRole)
    queues.ingestFanoutQueue.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.ingestFanoutDlq.grantSendMessages(iam.planeBEcsTaskRole)
    queues.goldLiveQueue.grantSendMessages(iam.planeBEcsTaskRole)
    queues.goldLiveQueue.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.goldLiveDlq.grantSendMessages(iam.planeBEcsTaskRole)
    queues.notificationsQueue.grantSendMessages(iam.planeBEcsTaskRole)
    queues.notificationsQueue.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.notificationsDlq.grantSendMessages(iam.planeBEcsTaskRole)
    queues.opsAlertsQueue.grantSendMessages(iam.planeBEcsTaskRole)
    queues.opsAlertsQueue.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.opsAlertsDlq.grantSendMessages(iam.planeBEcsTaskRole)

    new CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'Remit-Scout VPC ID',
    })
    new CfnOutput(this, 'PublicSubnetIds', {
      value: networking.vpc.publicSubnets.map((subnet) => subnet.subnetId).join(','),
      description: 'Public subnet IDs',
    })
    new CfnOutput(this, 'PrivateSubnetIds', {
      value: networking.vpc.privateSubnets.map((subnet) => subnet.subnetId).join(','),
      description: 'Private subnet IDs',
    })
    new CfnOutput(this, 'PlaneASecurityGroupId', {
      value: networking.planeASecurityGroup.securityGroupId,
      description: 'Plane A security group ID',
    })
    new CfnOutput(this, 'PlaneBSecurityGroupId', {
      value: networking.planeBSecurityGroup.securityGroupId,
      description: 'Plane B security group ID',
    })
    new CfnOutput(this, 'PlaneCSecurityGroupId', {
      value: networking.planeCSecurityGroup.securityGroupId,
      description: 'Plane C security group ID',
    })
    new CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: networking.dbSecurityGroup.securityGroupId,
      description: 'Database security group ID',
    })
    new CfnOutput(this, 'RedisSecurityGroupId', {
      value: networking.redisSecurityGroup.securityGroupId,
      description: 'Redis security group ID',
    })
    new CfnOutput(this, 'AuroraClusterEndpoint', {
      value: database.cluster.clusterEndpoint.hostname,
      description: 'Aurora cluster writer endpoint',
    })
    new CfnOutput(this, 'RdsProxyEndpoint', {
      value: database.proxy.endpoint,
      description: 'RDS Proxy endpoint',
    })
    new CfnOutput(this, 'AuroraCredentialsSecretArn', {
      value: database.credentialsSecret.secretArn,
      description: 'Secrets Manager ARN for Aurora credentials',
    })
    new CfnOutput(this, 'RedisEndpoint', {
      value: cache.replicationGroup.attrPrimaryEndPointAddress,
      description: 'Redis primary endpoint address',
    })
    new CfnOutput(this, 'RedisPort', {
      value: cache.replicationGroup.attrPrimaryEndPointPort,
      description: 'Redis primary endpoint port',
    })
    new CfnOutput(this, 'BronzeBucketName', {
      value: storage.bronzeBucket.bucketName,
      description: 'Bronze S3 bucket name',
    })
    new CfnOutput(this, 'ExportsBucketName', {
      value: storage.exportsBucket.bucketName,
      description: 'Exports S3 bucket name',
    })
    new CfnOutput(this, 'UserAssetsBucketName', {
      value: storage.userAssetsBucket.bucketName,
      description: 'User assets S3 bucket name',
    })
    new CfnOutput(this, 'AuditLogsBucketName', {
      value: storage.auditLogsBucket.bucketName,
      description: 'Audit logs S3 bucket name',
    })
    new CfnOutput(this, 'QuoteRefreshQueueUrl', {
      value: queues.quoteRefreshQueue.queueUrl,
      description: 'Quote refresh SQS queue URL',
    })
    new CfnOutput(this, 'QuoteRefreshDlqUrl', {
      value: queues.quoteRefreshDlq.queueUrl,
      description: 'Quote refresh DLQ URL',
    })
    new CfnOutput(this, 'ExportJobQueueUrl', {
      value: queues.exportJobQueue.queueUrl,
      description: 'Export job queue URL',
    })
    new CfnOutput(this, 'ExportJobDlqUrl', {
      value: queues.exportJobDlq.queueUrl,
      description: 'Export job DLQ URL',
    })
    new CfnOutput(this, 'IngestFanoutQueueUrl', {
      value: queues.ingestFanoutQueue.queueUrl,
      description: 'Ingestion fanout queue URL',
    })
    new CfnOutput(this, 'IngestFanoutDlqUrl', {
      value: queues.ingestFanoutDlq.queueUrl,
      description: 'Ingestion fanout DLQ URL',
    })
    new CfnOutput(this, 'NotificationsQueueUrl', {
      value: queues.notificationsQueue.queueUrl,
      description: 'Notifications queue URL',
    })
    new CfnOutput(this, 'NotificationsDlqUrl', {
      value: queues.notificationsDlq.queueUrl,
      description: 'Notifications DLQ URL',
    })
    new CfnOutput(this, 'OpsAlertsQueueUrl', {
      value: queues.opsAlertsQueue.queueUrl,
      description: 'Ops alerts queue URL',
    })
    new CfnOutput(this, 'OpsAlertsDlqUrl', {
      value: queues.opsAlertsDlq.queueUrl,
      description: 'Ops alerts DLQ URL',
    })
    new CfnOutput(this, 'PlaneAApiUrl', {
      value: api.planeAApi.apiEndpoint,
      description: 'Plane A HTTP API endpoint',
    })
    new CfnOutput(this, 'PlaneCApiUrl', {
      value: api.planeCApi.apiEndpoint,
      description: 'Plane C HTTP API endpoint',
    })
    if (api.planeACloudFront) {
      new CfnOutput(this, 'PlaneACloudFrontDomain', {
        value: api.planeACloudFront.domainName,
        description: 'CloudFront domain for Plane A API',
      })
    }
    if (pipeline) {
      new CfnOutput(this, 'PipelineName', {
        value: pipeline.pipeline.pipelineName,
        description: 'CodePipeline name for Remit-Scout',
      })
    }
    new CfnOutput(this, 'BackupVaultName', {
      value: backup.vault.backupVaultName,
      description: 'AWS Backup vault name for database backups',
    })
    new CfnOutput(this, 'BackupAlertsTopicArn', {
      value: backup.notificationTopic.topicArn,
      description: 'SNS topic for backup/restore failure alerts',
    })
    new CfnOutput(this, 'CloudWatchDashboardName', {
      value: monitoring.dashboard.dashboardName,
      description: 'CloudWatch dashboard name',
    })
    new CfnOutput(this, 'CloudWatchAlertsTopicArn', {
      value: monitoring.alertsTopic.topicArn,
      description: 'SNS topic for CloudWatch alarms',
    })
    new CfnOutput(this, 'CriticalAlertsTopicArn', {
      value: snsSubscriptions.criticalTopic.topicArn,
      description: 'SNS topic for critical alerts',
    })
    new CfnOutput(this, 'WarningAlertsTopicArn', {
      value: snsSubscriptions.warningTopic.topicArn,
      description: 'SNS topic for warning alerts',
    })
    new CfnOutput(this, 'OpsAlertsTopicArn', {
      value: snsSubscriptions.opsTopic.topicArn,
      description: 'SNS topic for ops alerts',
    })
    if (synthetics.canaries.length > 0) {
      new CfnOutput(this, 'SyntheticsCanaryNames', {
        value: synthetics.canaries.map((c) => c.name!).join(','),
        description: 'CloudWatch Synthetics canary names',
      })
    }
  }
}
