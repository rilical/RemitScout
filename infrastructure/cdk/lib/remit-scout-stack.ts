import { Stack, type StackProps, Tags, CfnOutput, Duration, Annotations } from 'aws-cdk-lib'
import { Alarm, ComparisonOperator, Metric, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch'
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions'
import { AccountPrincipal, CompositePrincipal, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Architecture } from 'aws-cdk-lib/aws-lambda'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions'
import { CpuArchitecture } from 'aws-cdk-lib/aws-ecs'
import { CfnSchedule } from 'aws-cdk-lib/aws-scheduler'
import { Rule } from 'aws-cdk-lib/aws-events'
import { SnsTopic } from 'aws-cdk-lib/aws-events-targets'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import type { Construct } from 'constructs'

import { createApi } from './api'
import { loadCdkContextConfig } from './config-schema'
import { EdgeNestedStack } from './stacks/edge-nested-stack'
import { FoundationNestedStack } from './stacks/foundation-nested-stack'
import { OpsNestedStack } from './stacks/ops-nested-stack'
import { RuntimeNestedStack } from './stacks/runtime-nested-stack'
import { createNetworking } from './vpc'

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

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const toList = (value: string | string[] | undefined): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

type ProviderProbeMode = 'per_provider' | 'fan_in'
type InterfaceEndpointMode = 'all' | 'minimal' | 'none'
type RedisAuthMode = 'legacy' | 'required'

const toProviderProbeMode = (value: unknown): ProviderProbeMode | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === 'per_provider' || normalized === 'fan_in') {
    return normalized
  }
  return undefined
}

const toInterfaceEndpointMode = (value: unknown): InterfaceEndpointMode | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === 'all' || normalized === 'minimal' || normalized === 'none') {
    return normalized
  }
  return undefined
}

const toRedisAuthMode = (value: unknown): RedisAuthMode | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === 'legacy' || normalized === 'required') {
    return normalized
  }
  return undefined
}

const normalizeOrigin = (value?: string): string => {
  if (!value) return ''
  try {
    return new URL(value).origin
  } catch {
    return value.replace(/\/$/, '')
  }
}

const resolveArchitecture = (value?: string): { cpu: CpuArchitecture; lambda: Architecture } => {
  const raw = (value ?? '').toLowerCase()
  const useX86 = raw === 'x86_64' || raw === 'x86' || raw === 'amd64'
  return {
    cpu: useX86 ? CpuArchitecture.X86_64 : CpuArchitecture.ARM64,
    lambda: useX86 ? Architecture.X86_64 : Architecture.ARM_64,
  }
}

export type RemitScoutStackProps = StackProps & {
  envName?: string
}

export class RemitScoutStack extends Stack {
  constructor(scope: Construct, id: string, props: RemitScoutStackProps) {
    super(scope, id, props)

    const envName = props.envName ?? 'dev'
    // Parse and validate CDK context early so typos/types fail fast during `cdk synth`.
    const cdkContext = loadCdkContextConfig(this.node)
    Tags.of(this).add('project', 'remit-scout')
    Tags.of(this).add('service', 'remit-scout')
    Tags.of(this).add('environment', envName)
    const architectureValue =
      this.node.tryGetContext('cpuArchitecture') ?? process.env.CPU_ARCHITECTURE
    const { cpu: cpuArchitecture, lambda: lambdaArchitecture } =
      resolveArchitecture(architectureValue)
    const ownerTag =
      this.node.tryGetContext('tagOwner') ??
      process.env.TAG_OWNER
    if (ownerTag) {
      Tags.of(this).add('owner', ownerTag)
    }

    const imageTag = String(
      this.node.tryGetContext('backendImageTag') ??
      process.env.BACKEND_IMAGE_TAG ??
      'latest',
    ).trim()
    if (!imageTag) {
      throw new Error('backendImageTag/BACKEND_IMAGE_TAG cannot be empty.')
    }
    if (envName !== 'dev' && imageTag.toLowerCase() === 'latest') {
      throw new Error(
        'backendImageTag must be immutable in staging/prod. Use a release tag or digest, not "latest".',
      )
    }
    const devSharedSecretArn =
      this.node.tryGetContext('devSharedSecretArn') ??
      process.env.DEV_SHARED_SECRET_ARN
    const sharedSecretArn =
      process.env.SHARED_SECRET_ARN ??
      this.node.tryGetContext('sharedSecretArn') ??
      (envName === 'dev' ? devSharedSecretArn : undefined)
    if (!sharedSecretArn) {
      throw new Error('sharedSecretArn context or SHARED_SECRET_ARN env var required')
    }
    const contextSesIdentityArns = cdkContext.sesIdentityArns ?? []
    const contextSnsTopicArns = cdkContext.snsTopicArns ?? []
    const sesIdentityArns =
      contextSesIdentityArns.length > 0
        ? contextSesIdentityArns
        : toList(process.env.SES_IDENTITY_ARNS)
    const snsTopicArns =
      contextSnsTopicArns.length > 0
        ? contextSnsTopicArns
        : toList(process.env.SNS_TOPIC_ARNS)
    if (envName !== 'dev') {
      if (sesIdentityArns.length === 0) {
        throw new Error('sesIdentityArns context or SES_IDENTITY_ARNS env var required for staging/prod')
      }
      if (snsTopicArns.length === 0) {
        throw new Error('snsTopicArns context or SNS_TOPIC_ARNS env var required for staging/prod')
      }
    }
    const enableDbProxy =
      toOptionalBool(
        this.node.tryGetContext('enableDbProxy') ??
          process.env.ENABLE_DB_PROXY,
      ) ?? envName !== 'dev'
    const prodDatabaseInstances = envName === 'prod'
      ? toOptionalNumber(
          this.node.tryGetContext('prodDatabaseInstances') ??
            process.env.PROD_DATABASE_INSTANCES,
        )
      : undefined
    if (envName === 'prod' && prodDatabaseInstances !== undefined && prodDatabaseInstances < 1) {
      throw new Error('prodDatabaseInstances must be >= 1 in prod.')
    }
    const prodRedisNodeType = envName === 'prod'
      ? toOptionalString(
          this.node.tryGetContext('prodRedisNodeType') ??
            process.env.PROD_REDIS_NODE_TYPE,
        )
      : undefined
    const prodRedisReplicasPerNodeGroup = envName === 'prod'
      ? toOptionalNumber(
          this.node.tryGetContext('prodRedisReplicasPerNodeGroup') ??
            process.env.PROD_REDIS_REPLICAS_PER_NODE_GROUP,
        )
      : undefined
    if (
      envName === 'prod'
      && prodRedisReplicasPerNodeGroup !== undefined
      && prodRedisReplicasPerNodeGroup < 0
    ) {
      throw new Error('prodRedisReplicasPerNodeGroup must be >= 0 in prod.')
    }
    const prodRedisAutomaticFailoverEnabled = envName === 'prod'
      ? toOptionalBool(
          this.node.tryGetContext('prodRedisAutomaticFailoverEnabled') ??
            process.env.PROD_REDIS_AUTOMATIC_FAILOVER_ENABLED,
        )
      : undefined
    const prodRedisMultiAzEnabled = envName === 'prod'
      ? toOptionalBool(
          this.node.tryGetContext('prodRedisMultiAzEnabled') ??
            process.env.PROD_REDIS_MULTI_AZ_ENABLED,
        )
      : undefined
    const resolvedProdRedisNodeType = envName === 'prod'
      ? (prodRedisNodeType ?? 'cache.t4g.small')
      : undefined
    const resolvedProdRedisReplicasPerNodeGroup = envName === 'prod'
      ? (prodRedisReplicasPerNodeGroup ?? 1)
      : undefined
    const resolvedProdRedisAutomaticFailover = envName === 'prod'
      ? (prodRedisAutomaticFailoverEnabled ?? ((resolvedProdRedisReplicasPerNodeGroup ?? 0) > 0))
      : undefined
    const resolvedProdRedisMultiAz = envName === 'prod'
      ? (prodRedisMultiAzEnabled ?? ((resolvedProdRedisReplicasPerNodeGroup ?? 0) > 0))
      : undefined
    if (
      envName === 'prod'
      && (resolvedProdRedisReplicasPerNodeGroup ?? 0) === 0
      && (resolvedProdRedisAutomaticFailover || resolvedProdRedisMultiAz)
    ) {
      throw new Error(
        'prodRedisAutomaticFailoverEnabled/prodRedisMultiAzEnabled require prodRedisReplicasPerNodeGroup > 0.',
      )
    }
    if (envName === 'prod' && resolvedProdRedisMultiAz && !resolvedProdRedisAutomaticFailover) {
      throw new Error(
        'prodRedisMultiAzEnabled requires prodRedisAutomaticFailoverEnabled in prod.',
      )
    }
    const redisAuthMode =
      toRedisAuthMode(
        this.node.tryGetContext('redisAuthMode') ??
          process.env.REDIS_AUTH_MODE,
      ) ?? (envName === 'dev' ? 'legacy' : 'required')
    if ((envName === 'staging' || envName === 'prod') && redisAuthMode !== 'required') {
      throw new Error(
        `redisAuthMode must be "required" in ${envName}. Enable Redis AUTH token before deploy.`,
      )
    }
    const enableBackup =
      toOptionalBool(
        this.node.tryGetContext('enableBackup') ??
          process.env.ENABLE_BACKUP,
      ) ?? envName !== 'dev'
    const enableFrontend =
      toOptionalBool(
        this.node.tryGetContext('enableFrontend') ??
          process.env.ENABLE_FRONTEND,
      ) ?? envName !== 'dev'
    const enableCostGuardrails =
      toOptionalBool(
        this.node.tryGetContext('enableCostGuardrails') ??
          process.env.ENABLE_COST_GUARDRAILS,
      ) ?? true
    const enableComplianceServices =
      toOptionalBool(
        this.node.tryGetContext('enableComplianceServices') ??
          process.env.ENABLE_COMPLIANCE_SERVICES,
      ) ?? envName !== 'dev'
    const enableMonitoring =
      toOptionalBool(
        this.node.tryGetContext('enableMonitoring') ??
          process.env.ENABLE_MONITORING,
      ) ?? (envName !== 'dev')
    const enableSynthetics =
      toOptionalBool(
        this.node.tryGetContext('enableSynthetics') ??
          process.env.ENABLE_SYNTHETICS,
      ) ?? (envName !== 'dev')
    const pinpointEnabled =
      toOptionalBool(
        cdkContext.pinpointEnabled ??
          process.env.PINPOINT_ENABLED,
      ) ?? envName !== 'dev'
    const devMinimalInfra =
      toOptionalBool(
        this.node.tryGetContext('devMinimalInfra') ??
          process.env.DEV_MINIMAL_INFRA,
      ) ?? false
    const minimalInfra =
      toOptionalBool(
        this.node.tryGetContext('minimalInfra') ??
          process.env.MINIMAL_INFRA,
      ) ?? false
    const importExistingBackendRepository =
      toOptionalBool(
        this.node.tryGetContext('importExistingBackendRepository') ??
          process.env.IMPORT_EXISTING_BACKEND_REPOSITORY,
      ) ?? false
    const costAlertEmailsRaw =
      this.node.tryGetContext('costAlertEmails') ??
      process.env.COST_ALERT_EMAILS
    const costAlertEmails = toList(costAlertEmailsRaw)
    const costAlertEmailsExplicitlyConfigured = costAlertEmailsRaw !== undefined
    const costAlertEmailsExplicitlyEmpty =
      costAlertEmailsExplicitlyConfigured && costAlertEmails.length === 0
    if (enableCostGuardrails && envName !== 'dev' && costAlertEmailsExplicitlyEmpty) {
      throw new Error(
        'costAlertEmails cannot be explicitly empty when cost guardrails are enabled in staging/prod.',
      )
    }
    const resolvedCostAlertEmails =
      costAlertEmails.length > 0 ? costAlertEmails : ['alerts@remit-scout.com']
    const costBudgetAmountUsd = toOptionalNumber(
      this.node.tryGetContext('costBudgetAmountUsd') ??
        process.env.COST_BUDGET_AMOUNT_USD,
    )
    const costAnomalyThresholdUsd = toOptionalNumber(
      this.node.tryGetContext('costAnomalyThresholdUsd') ??
        process.env.COST_ANOMALY_THRESHOLD_USD,
    )
    const costGuardrailsCreateCur =
      toOptionalBool(
        this.node.tryGetContext('costGuardrailsCreateCur') ??
          process.env.COST_GUARDRAILS_CREATE_CUR,
      ) ?? envName === 'prod'

    const enableGithubActionsOidc =
      toOptionalBool(
        this.node.tryGetContext('enableGithubActionsOidc') ??
          process.env.ENABLE_GITHUB_ACTIONS_OIDC,
      ) ?? false
    const githubRepoOwner =
      this.node.tryGetContext('githubRepoOwner') ??
      this.node.tryGetContext('pipelineRepoOwner') ??
      process.env.GITHUB_REPO_OWNER ??
      'rilical'
    const githubRepoName =
      this.node.tryGetContext('githubRepoName') ??
      this.node.tryGetContext('pipelineRepoName') ??
      process.env.GITHUB_REPO_NAME ??
      'remit-scout-v2'
    const githubActionsOidcProviderArn =
      this.node.tryGetContext('githubActionsOidcProviderArn') ??
      process.env.GITHUB_ACTIONS_OIDC_PROVIDER_ARN

    const devNatGateways = envName === 'dev'
      ? toOptionalNumber(
          this.node.tryGetContext('devNatGateways') ??
            process.env.DEV_NAT_GATEWAYS,
        )
      : undefined
    const stagingNatGateways = envName === 'staging'
      ? toOptionalNumber(
          this.node.tryGetContext('stagingNatGateways') ??
            process.env.STAGING_NAT_GATEWAYS,
        )
      : undefined
    const prodNatGateways = envName === 'prod'
      ? toOptionalNumber(
          this.node.tryGetContext('prodNatGateways') ??
            process.env.PROD_NAT_GATEWAYS,
        )
      : undefined
    const natGateways = envName === 'dev'
      ? devNatGateways
      : envName === 'staging'
        ? stagingNatGateways
        : envName === 'prod'
          ? prodNatGateways
          : undefined
    if (envName !== 'dev' && typeof natGateways === 'number' && natGateways < 1) {
      throw new Error('stagingNatGateways/prodNatGateways must be >= 1 in non-dev environments.')
    }
    const stagingInterfaceEndpointsMode = envName === 'staging'
      ? toInterfaceEndpointMode(
          this.node.tryGetContext('stagingInterfaceEndpointsMode') ??
            process.env.STAGING_INTERFACE_ENDPOINTS_MODE,
        )
      : undefined
    const defaultStagingInterfaceEndpointAllowlist = [
      'ecr.api',
      'ecr.dkr',
      'logs',
      'secretsmanager',
      'sqs',
    ]
    const stagingInterfaceEndpointAllowlist = envName === 'staging'
      ? toList(
          this.node.tryGetContext('stagingInterfaceEndpointAllowlist') ??
            process.env.STAGING_INTERFACE_ENDPOINT_ALLOWLIST,
        )
      : []
    const resolvedStagingInterfaceEndpointAllowlist = envName === 'staging'
      ? (stagingInterfaceEndpointAllowlist.length > 0
        ? stagingInterfaceEndpointAllowlist
        : defaultStagingInterfaceEndpointAllowlist)
      : []
    const prodInterfaceEndpointsMode = envName === 'prod'
      ? toInterfaceEndpointMode(
          this.node.tryGetContext('prodInterfaceEndpointsMode') ??
            process.env.PROD_INTERFACE_ENDPOINTS_MODE,
        )
      : undefined
    const interfaceEndpointMode: InterfaceEndpointMode = envName === 'staging'
      ? (stagingInterfaceEndpointsMode ?? 'all')
      : envName === 'prod'
        ? (prodInterfaceEndpointsMode ?? 'all')
        : 'none'
    const providerProbeMode =
      toProviderProbeMode(
        this.node.tryGetContext('providerProbeMode') ??
          process.env.PROVIDER_PROBE_MODE,
      ) ?? 'per_provider'
    if (envName === 'prod' && providerProbeMode === 'fan_in') {
      Annotations.of(this).addWarning(
        'providerProbeMode=fan_in enabled in prod. Roll out via staging evidence before keeping this mode in production.',
      )
    }
    if ((envName === 'staging' || envName === 'prod') && interfaceEndpointMode !== 'all') {
      Annotations.of(this).addWarning(
        `Interface endpoint mode '${interfaceEndpointMode}' is enabled for ${envName}. Verify NAT data and endpoint connectivity before promotion.`,
      )
    }

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

    const networking = createNetworking(this, {
      envName,
      natGateways,
      interfaceEndpointMode,
      interfaceEndpointAllowlist:
        envName === 'staging' ? resolvedStagingInterfaceEndpointAllowlist : undefined,
    })

    const foundationStack = new FoundationNestedStack(this, 'Foundation', {
      envName,
      networking,
      importExistingBackendRepository,
      redisAuthMode,
      sharedSecretArn,
      sesIdentityArns,
      snsTopicArns,
      enableDbProxy,
      prodDatabaseInstances,
      prodRedisNodeType: resolvedProdRedisNodeType,
      prodRedisReplicasPerNodeGroup: resolvedProdRedisReplicasPerNodeGroup,
      prodRedisAutomaticFailoverEnabled: resolvedProdRedisAutomaticFailover,
      prodRedisMultiAzEnabled: resolvedProdRedisMultiAz,
      enableGithubActionsOidc,
      githubRepoOwner: String(githubRepoOwner),
      githubRepoName: String(githubRepoName),
      githubActionsOidcProviderArn: githubActionsOidcProviderArn
        ? String(githubActionsOidcProviderArn)
        : undefined,
      exportsPrefix,
      pinpointEnabled,
      pinpointFromAddress:
        process.env.NEWSLETTER_EMAIL_FROM ||
        process.env.SES_FROM_ADDRESS ||
        'no-reply@remit-scout.com',
    })

    const {
      iam,
      registry,
      database,
      cache,
      storage,
      queues,
      pinpoint,
      redisUrl,
    } = foundationStack.resources

    let snowflakePartnerRole: Role | undefined

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
	    // Migrations should run with a privileged user (or RDS master secret) to avoid runtime-user DDL permissions.
	    // Runtime Plane B workers can still use a restricted DB user via PLANE_B_DB_SECRET_ARN.
	    const planeBDbMigratorSecretArn =
	      this.node.tryGetContext('planeBDbMigratorSecretArn') ??
	      process.env.PLANE_B_DB_MIGRATOR_SECRET_ARN ??
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
    let redisSecretArn =
      this.node.tryGetContext('redisSecretArn') ??
      process.env.REDIS_SECRET_ARN
    const redisSecretJsonKey =
      this.node.tryGetContext('redisSecretJsonKey') ??
      process.env.REDIS_SECRET_JSON_KEY
    const redisSsmName =
      this.node.tryGetContext('redisSsmName') ??
      process.env.REDIS_SSM_NAME
    const supabaseSecretArn =
      this.node.tryGetContext('supabaseSecretArn') ??
      process.env.SUPABASE_SECRET_ARN ??
      sharedSecretArn
    const supabaseSsmName =
      this.node.tryGetContext('supabaseSsmName') ??
      process.env.SUPABASE_SSM_NAME
    const stripeSecretArn =
      this.node.tryGetContext('stripeSecretArn') ??
      process.env.STRIPE_SECRET_ARN ??
      sharedSecretArn
    const stripeSsmName =
      this.node.tryGetContext('stripeSsmName') ??
      process.env.STRIPE_SSM_NAME
    const communicationsSecretArn =
      this.node.tryGetContext('communicationsSecretArn') ??
      process.env.COMMUNICATIONS_SECRET_ARN
    const sentrySecretArn =
      this.node.tryGetContext('sentrySecretArn') ??
      process.env.SENTRY_SECRET_ARN
    const sentrySecretJsonKey =
      this.node.tryGetContext('sentrySecretJsonKey') ??
      process.env.SENTRY_SECRET_JSON_KEY
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
      (envName === 'prod' || envName === 'staging' || envName === 'dev' ? 'queue' : 'off')
    const goldLiveQueueMode =
      this.node.tryGetContext('goldLiveQueueMode') ??
      process.env.GOLD_LIVE_QUEUE_MODE ??
      (envName === 'prod' || envName === 'staging' || envName === 'dev' ? 'queue' : 'off')
    const notificationsMode =
      this.node.tryGetContext('planeBNotificationsMode') ??
      process.env.PLANE_B_NOTIFICATIONS_QUEUE_MODE ??
      (envName === 'prod' || envName === 'staging' || envName === 'dev' ? 'queue' : 'off')
    const opsAlertsMode =
      this.node.tryGetContext('planeBOpsAlertsMode') ??
      process.env.PLANE_B_OPS_ALERT_QUEUE_MODE ??
      (envName === 'prod' || envName === 'staging' || envName === 'dev' ? 'queue' : 'off')
    const b2cRefreshServiceEnabled = toOptionalBool(
      this.node.tryGetContext('planeBB2cRefreshServiceEnabled') ??
        process.env.PLANE_B_B2C_REFRESH_SERVICE_ENABLED,
    ) ?? (envName === 'prod' || envName === 'staging' || envName === 'dev')
    const fxRateRefreshServiceEnabled = toOptionalBool(
      this.node.tryGetContext('planeBFxRateRefreshServiceEnabled') ??
        process.env.PLANE_B_FX_RATE_REFRESH_SERVICE_ENABLED,
    ) ?? (envName === 'prod' || envName === 'staging' || envName === 'dev')
    const b2cQueueInSweep =
      this.node.tryGetContext('planeBB2cQueueInSweep') ??
      process.env.PLANE_B_B2C_QUEUE_IN_SWEEP ??
      (b2cRefreshServiceEnabled ? '0' : (envName === 'dev' ? '0' : undefined))
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
      (envName === 'dev' ? '100000' : undefined)
    const planeBIngestFanoutMessageMode =
      this.node.tryGetContext('planeBIngestFanoutMessageMode') ??
      process.env.PLANE_B_INGEST_FANOUT_MESSAGE_MODE ??
      (envName === 'dev' ? 'provider' : undefined)
    const quoteRefreshQueueMode =
      this.node.tryGetContext('quoteRefreshQueueMode') ??
      process.env.QUOTE_REFRESH_QUEUE_MODE ??
      (envName === 'prod' || envName === 'staging' || envName === 'dev' ? 'queue' : 'off')
    const fxRateRefreshQueueMode =
      this.node.tryGetContext('fxRateRefreshQueueMode') ??
      process.env.FX_RATE_REFRESH_QUEUE_MODE ??
      (envName === 'prod' || envName === 'staging' || envName === 'dev' ? 'queue' : 'off')
    const exportJobQueueMode =
      this.node.tryGetContext('exportJobQueueMode') ??
      process.env.EXPORT_JOB_QUEUE_MODE ??
      (envName === 'prod' || envName === 'staging' || envName === 'dev' ? 'queue' : 'off')
    const agentFailureQueueMode =
      this.node.tryGetContext('agentFailureQueueMode') ??
      process.env.AGENT_FAILURE_QUEUE_MODE ??
      (envName === 'prod' || envName === 'staging' || envName === 'dev' ? 'queue' : 'off')
    const agentStressQueueMode =
      this.node.tryGetContext('agentStressQueueMode') ??
      process.env.AGENT_STRESS_QUEUE_MODE ??
      (envName === 'prod' || envName === 'staging' || envName === 'dev' ? 'queue' : 'off')
    const toolRequestQueueMode =
      this.node.tryGetContext('toolRequestQueueMode') ??
      process.env.TOOL_REQUEST_QUEUE_MODE ??
      (envName === 'prod' || envName === 'staging' || envName === 'dev' ? 'queue' : 'off')
    const normalizationQueueMode =
      this.node.tryGetContext('normalizationQueueMode') ??
      process.env.NORMALIZATION_QUEUE_MODE ??
      (envName === 'prod' || envName === 'staging' || envName === 'dev' ? 'queue' : 'off')
    const agentLlmConnectorRaw =
      this.node.tryGetContext('agentLlmConnector') ??
      process.env.AGENT_LLM_CONNECTOR ??
      process.env.AGENT_LLM_PROVIDER
    const agentLlmConnector =
      String(agentLlmConnectorRaw || '').trim().toLowerCase() === 'anthropic'
        ? 'anthropic'
        : 'bedrock'
    const agentLlmModel =
      this.node.tryGetContext('agentLlmModel') ??
      process.env.AGENT_LLM_MODEL ??
      process.env.AGENT_BEDROCK_MODEL_ID ??
      (agentLlmConnector === 'bedrock'
        ? 'anthropic.claude-sonnet-4-20250514-v1:0'
        : 'claude-sonnet-4-20250514')
    const agentLlmMaxTokens =
      this.node.tryGetContext('agentLlmMaxTokens') ??
      process.env.AGENT_LLM_MAX_TOKENS ??
      '2048'
    const agentLlmTemperature =
      this.node.tryGetContext('agentLlmTemperature') ??
      process.env.AGENT_LLM_TEMPERATURE ??
      '0.2'
    const agentLlmPromptVersion =
      this.node.tryGetContext('agentLlmPromptVersion') ??
      process.env.AGENT_LLM_PROMPT_VERSION ??
      'v1'
    const agentTelemetryDims =
      this.node.tryGetContext('agentTelemetryDims') ??
      process.env.AGENT_TELEMETRY_DIMS
    const agentAnthropicApiKeySecretArn =
      this.node.tryGetContext('agentAnthropicApiKeySecretArn') ??
      process.env.AGENT_ANTHROPIC_API_KEY_SECRET_ARN
    const agentBedrockRegion =
      this.node.tryGetContext('agentBedrockRegion') ??
      process.env.AGENT_BEDROCK_REGION ??
      process.env.AWS_REGION
    const agentBedrockModelId =
      this.node.tryGetContext('agentBedrockModelId') ??
      process.env.AGENT_BEDROCK_MODEL_ID ??
      process.env.AGENT_LLM_MODEL
    const agentBedrockMaxTokens =
      this.node.tryGetContext('agentBedrockMaxTokens') ??
      process.env.AGENT_BEDROCK_MAX_TOKENS
    const agentBedrockSecretArn =
      this.node.tryGetContext('agentBedrockSecretArn') ??
      process.env.AGENT_BEDROCK_SECRET_ARN
    const planeADesiredCount = toOptionalNumber(
      this.node.tryGetContext('planeADesiredCount') ??
        process.env.PLANE_A_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : envName === 'dev' ? 1 : undefined)
    if (envName !== 'dev' && planeADesiredCount !== undefined && planeADesiredCount < 1) {
      throw new Error('planeADesiredCount must be >= 1 outside dev.')
    }
    const planeBIngestDesiredCount = toOptionalNumber(
      this.node.tryGetContext('planeBIngestDesiredCount') ??
        process.env.PLANE_B_INGEST_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : envName === 'dev' ? 1 : undefined)
    const b2cRefreshDesiredCount = toOptionalNumber(
      this.node.tryGetContext('planeBB2cRefreshDesiredCount') ??
        process.env.PLANE_B_B2C_REFRESH_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : envName === 'dev' ? 1 : undefined)
    const fxRateRefreshDesiredCount = toOptionalNumber(
      this.node.tryGetContext('planeBFxRateRefreshDesiredCount') ??
        process.env.PLANE_B_FX_RATE_REFRESH_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : envName === 'dev' ? 1 : undefined)
    const goldIndicesLookbackDays =
      this.node.tryGetContext('goldIndicesLookbackDays') ??
      process.env.GOLD_INDICES_LOOKBACK_DAYS ??
      (envName === 'dev' ? '3' : undefined)
    const goldIndicesMinProviders =
      this.node.tryGetContext('goldIndicesMinProviders') ??
      process.env.GOLD_INDICES_MIN_PROVIDERS ??
      (envName === 'staging' ? '2' : undefined)
    const providerWeightWindowDays =
      this.node.tryGetContext('providerWeightWindowDays') ??
      process.env.PROVIDER_WEIGHT_WINDOW_DAYS ??
      (envName === 'dev' ? '7' : undefined)
    const institutionalExportFormat =
      this.node.tryGetContext('institutionalExportFormat') ??
      process.env.INSTITUTIONAL_EXPORT_FORMAT
    const institutionalExportWriteManifest = toOptionalBool(
      this.node.tryGetContext('institutionalExportWriteManifest') ??
        process.env.INSTITUTIONAL_EXPORT_WRITE_MANIFEST,
    )
    const snowflakePartnerAccountIds = toList(
      this.node.tryGetContext('snowflakePartnerAccountIds') ??
        process.env.SNOWFLAKE_PARTNER_ACCOUNT_IDS,
    )
    const snowflakePartnerExternalId =
      this.node.tryGetContext('snowflakePartnerExternalId') ??
      process.env.SNOWFLAKE_PARTNER_EXTERNAL_ID
    const snowflakePartnerRoleName =
      this.node.tryGetContext('snowflakePartnerRoleName') ??
      process.env.SNOWFLAKE_PARTNER_ROLE_NAME
    if (snowflakePartnerAccountIds.length > 0) {
      if (!snowflakePartnerExternalId) {
        Annotations.of(this).addWarning('snowflakePartnerAccountIds configured without snowflakePartnerExternalId; skipping partner role.')
      } else {
        const principals = snowflakePartnerAccountIds.map((accountId) => new AccountPrincipal(accountId))
        const principal = principals.length === 1
          ? principals[0]
          : new CompositePrincipal(...principals)
        const assumedBy = principal.withConditions({
          StringEquals: {
            'sts:ExternalId': snowflakePartnerExternalId,
          },
        })

        const role = new Role(this, 'SnowflakePartnerRole', {
          roleName: snowflakePartnerRoleName || `remit-scout-${envName}-snowflake-partner`,
          assumedBy,
        })

        const allowedPrefixes = ['indices/', 'parquet/']
        role.addToPolicy(new PolicyStatement({
          actions: ['s3:GetObject', 's3:GetObjectVersion'],
          resources: allowedPrefixes.map((prefix) => storage.exportsBucket.arnForObjects(`${prefix}*`)),
        }))
        role.addToPolicy(new PolicyStatement({
          actions: ['s3:GetBucketLocation', 's3:ListBucket'],
          resources: [storage.exportsBucket.bucketArn],
          conditions: {
            StringLike: {
              's3:prefix': allowedPrefixes.map((prefix) => `${prefix}*`),
            },
          },
        }))

        storage.exportsBucket.addToResourcePolicy(new PolicyStatement({
          principals: [role],
          actions: ['s3:GetObject', 's3:GetObjectVersion'],
          resources: allowedPrefixes.map((prefix) => storage.exportsBucket.arnForObjects(`${prefix}*`)),
        }))
        storage.exportsBucket.addToResourcePolicy(new PolicyStatement({
          principals: [role],
          actions: ['s3:GetBucketLocation', 's3:ListBucket'],
          resources: [storage.exportsBucket.bucketArn],
          conditions: {
            StringLike: {
              's3:prefix': allowedPrefixes.map((prefix) => `${prefix}*`),
            },
          },
        }))

        snowflakePartnerRole = role
      }
    }
    const planeBDisableTier1 = toOptionalBool(
      this.node.tryGetContext('planeBDisableTier1') ??
        process.env.PLANE_B_DISABLE_TIER1,
    ) ?? (envName === 'dev')
    const ingestFanoutTier1DesiredCount = toOptionalNumber(
      this.node.tryGetContext('planeBIngestFanoutTier1DesiredCount') ??
        process.env.PLANE_B_INGEST_FANOUT_TIER1_DESIRED_COUNT,
    ) ??
      (planeBDisableTier1
        ? 0
        : (envName === 'prod' ? 1 : envName === 'staging' ? 1 : envName === 'dev' ? 1 : undefined))
    const ingestFanoutTier2DesiredCount = toOptionalNumber(
      this.node.tryGetContext('planeBIngestFanoutTier2DesiredCount') ??
        process.env.PLANE_B_INGEST_FANOUT_TIER2_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : envName === 'dev' ? 1 : undefined)
    const goldLiveDesiredCount = toOptionalNumber(
      this.node.tryGetContext('goldLiveDesiredCount') ??
        process.env.GOLD_LIVE_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : envName === 'dev' ? 1 : undefined)
    const notificationsDesiredCount = toOptionalNumber(
      this.node.tryGetContext('planeBNotificationsDesiredCount') ??
        process.env.PLANE_B_NOTIFICATIONS_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : envName === 'dev' ? 1 : undefined)
    const opsAlertsDesiredCount = toOptionalNumber(
      this.node.tryGetContext('planeBOpsAlertsDesiredCount') ??
        process.env.PLANE_B_OPS_ALERTS_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : envName === 'dev' ? 1 : undefined)
    const alertEvaluationServiceEnabled = toOptionalBool(
      this.node.tryGetContext('alertEvaluationServiceEnabled') ??
        process.env.ALERT_EVALUATION_SERVICE_ENABLED,
    ) ?? (envName === 'prod' || envName === 'staging')
    const alertEvaluationDesiredCount = toOptionalNumber(
      this.node.tryGetContext('alertEvaluationDesiredCount') ??
        process.env.ALERT_EVALUATION_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : 0)
    const exportServiceEnabled = toOptionalBool(
      this.node.tryGetContext('exportServiceEnabled') ??
        process.env.EXPORT_SERVICE_ENABLED,
    ) ?? (envName === 'prod' || envName === 'staging')
    const exportWorkerDesiredCount = toOptionalNumber(
      this.node.tryGetContext('exportWorkerDesiredCount') ??
        process.env.EXPORT_WORKER_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : 0)
    const agentOrchestratorServiceEnabled = toOptionalBool(
      this.node.tryGetContext('agentOrchestratorServiceEnabled') ??
        process.env.AGENT_ORCHESTRATOR_SERVICE_ENABLED,
    ) ?? (envName === 'prod')
    const stressResponderServiceEnabled = toOptionalBool(
      this.node.tryGetContext('stressResponderServiceEnabled') ??
        process.env.STRESS_RESPONDER_SERVICE_ENABLED,
    ) ?? (envName === 'prod' || envName === 'staging')
    const normalizationServiceEnabled = toOptionalBool(
      this.node.tryGetContext('normalizationServiceEnabled') ??
        process.env.NORMALIZATION_SERVICE_ENABLED,
    ) ?? (envName === 'prod' || envName === 'staging')
    const agentOrchestratorDesiredCount = toOptionalNumber(
      this.node.tryGetContext('agentOrchestratorDesiredCount') ??
        process.env.AGENT_ORCHESTRATOR_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : 0)
    const stressResponderDesiredCount = toOptionalNumber(
      this.node.tryGetContext('stressResponderDesiredCount') ??
        process.env.STRESS_RESPONDER_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : 0)
    const normalizationWorkerDesiredCount = toOptionalNumber(
      this.node.tryGetContext('normalizationWorkerDesiredCount') ??
        process.env.NORMALIZATION_WORKER_DESIRED_COUNT,
    ) ?? (envName === 'prod' ? 1 : envName === 'staging' ? 1 : 0)
    const rawPlaneBQueueWorkerDesiredCount = toOptionalNumber(
      this.node.tryGetContext('planeBQueueWorkerDesiredCount') ??
        process.env.PLANE_B_QUEUE_WORKER_DESIRED_COUNT,
    ) ?? (envName === 'staging' ? 1 : envName === 'dev' ? 1 : undefined)
    const planeBQueueWorkerDesiredCount = rawPlaneBQueueWorkerDesiredCount
    const requestedPlaneBDbPoolMax =
      toOptionalNumber(
        this.node.tryGetContext('planeBDbPoolMax') ??
          process.env.PLANE_B_DB_POOL_MAX,
      ) ?? (envName === 'prod' || envName === 'staging' ? 8 : 2)
    const requestedPlaneBDbPoolMin =
      toOptionalNumber(
        this.node.tryGetContext('planeBDbPoolMin') ??
          process.env.PLANE_B_DB_POOL_MIN,
      ) ?? 0
    // Guardrail: dev can easily crashloop/scale and exhaust Aurora connections. Cap pool sizes.
    const planeBDbPoolMax = envName === 'dev'
      ? Math.min(requestedPlaneBDbPoolMax, 2)
      : requestedPlaneBDbPoolMax
    const planeBDbPoolMin = Math.min(requestedPlaneBDbPoolMin, planeBDbPoolMax)
    if (planeBDbPoolMax < 1 || planeBDbPoolMin < 0 || planeBDbPoolMin > planeBDbPoolMax) {
      throw new Error(
        'Invalid Plane B DB pool sizing. Ensure PLANE_B_DB_POOL_MAX >= PLANE_B_DB_POOL_MIN and both are valid integers.',
      )
    }

    const shouldRequireQuoteRefreshQueue = quoteRefreshQueueMode !== 'off' && b2cRefreshServiceEnabled
    const shouldRequireFxRateRefreshQueue =
      fxRateRefreshQueueMode !== 'off' && fxRateRefreshServiceEnabled
    const shouldRequireExportJobQueue = exportJobQueueMode !== 'off' && exportServiceEnabled
    const shouldRequireIngestFanoutQueue = ingestFanoutMode !== 'off'
    const shouldRequireNotificationsQueue = notificationsMode !== 'off'
    const shouldRequireOpsAlertsQueue = opsAlertsMode !== 'off'
    const shouldRequireGoldLiveQueue = goldLiveQueueMode !== 'off'
    const shouldRequireAlertEvaluationQueue = alertEvaluationServiceEnabled
    const shouldRequireAgentFailureQueue = agentOrchestratorServiceEnabled && agentFailureQueueMode !== 'off'
    const shouldRequireAgentStressQueue = stressResponderServiceEnabled && agentStressQueueMode !== 'off'
    const shouldRequireToolRequestQueue = agentOrchestratorServiceEnabled && toolRequestQueueMode !== 'off'
    const shouldRequireNormalizationQueue = normalizationServiceEnabled && normalizationQueueMode !== 'off'

    const queueWorkerRequiredConfig: Array<[string, string | undefined]> = []
    if (shouldRequireQuoteRefreshQueue) {
      queueWorkerRequiredConfig.push(['QUOTE_REFRESH_QUEUE_URL', queues.quoteRefreshQueue?.queueUrl])
    }
    if (shouldRequireFxRateRefreshQueue) {
      queueWorkerRequiredConfig.push(['FX_RATE_REFRESH_QUEUE_URL', queues.fxRateRefreshQueue?.queueUrl])
    }
    if (shouldRequireExportJobQueue) {
      queueWorkerRequiredConfig.push(['EXPORT_JOB_QUEUE_URL', queues.exportJobQueue?.queueUrl])
      queueWorkerRequiredConfig.push(['EXPORTS_S3_BUCKET', storage.exportsBucket?.bucketName])
    }
    if (shouldRequireIngestFanoutQueue) {
      queueWorkerRequiredConfig.push([
        'PLANE_B_INGEST_FANOUT_QUEUE_URL',
        queues.ingestFanoutQueue?.queueUrl,
      ])
      queueWorkerRequiredConfig.push([
        'PLANE_B_INGEST_FANOUT_TIER2_QUEUE_URL',
        queues.ingestFanoutTier2Queue?.queueUrl,
      ])
    }
    if (shouldRequireNotificationsQueue) {
      queueWorkerRequiredConfig.push([
        'PLANE_B_NOTIFICATIONS_QUEUE_URL',
        queues.notificationsQueue?.queueUrl,
      ])
    }
    if (shouldRequireOpsAlertsQueue) {
      queueWorkerRequiredConfig.push([
        'PLANE_B_OPS_ALERT_QUEUE_URL',
        queues.opsAlertsQueue?.queueUrl,
      ])
    }
    if (shouldRequireGoldLiveQueue) {
      queueWorkerRequiredConfig.push(['GOLD_LIVE_QUEUE_URL', queues.goldLiveQueue?.queueUrl])
    }
    if (shouldRequireAlertEvaluationQueue) {
      queueWorkerRequiredConfig.push([
        'ALERT_EVALUATION_QUEUE_URL',
        queues.alertEvaluationQueue?.queueUrl,
      ])
    }
    if (shouldRequireAgentFailureQueue) {
      queueWorkerRequiredConfig.push([
        'AGENT_FAILURE_QUEUE_URL',
        queues.agentFailureQueue?.queueUrl,
      ])
    }
    if (shouldRequireAgentStressQueue) {
      queueWorkerRequiredConfig.push([
        'AGENT_STRESS_QUEUE_URL',
        queues.agentStressQueue?.queueUrl,
      ])
    }
    if (shouldRequireToolRequestQueue) {
      queueWorkerRequiredConfig.push([
        'TOOL_REQUEST_QUEUE_URL',
        queues.toolRequestQueue?.queueUrl,
      ])
    }
    if (shouldRequireNormalizationQueue) {
      queueWorkerRequiredConfig.push([
        'NORMALIZATION_QUEUE_URL',
        queues.normalizationQueue?.queueUrl,
      ])
    }
    const missingQueueWorkerConfig = queueWorkerRequiredConfig
      .filter(([, value]) => !value || !value.trim())
      .map(([name]) => name)
    if (missingQueueWorkerConfig.length > 0) {
      throw new Error(
        `Missing required worker runtime configuration: ${missingQueueWorkerConfig.join(', ')}.`
          + ' Ensure required queues/buckets/secrets are in place before deploy.',
      )
    }
    const requiresAgentLlmConfig = agentOrchestratorServiceEnabled || stressResponderServiceEnabled
    if (requiresAgentLlmConfig) {
      const missingAgentLlmConfig: string[] = []
      if (!agentLlmConnector) {
        missingAgentLlmConfig.push('AGENT_LLM_CONNECTOR')
      }
      if (!agentLlmModel) {
        missingAgentLlmConfig.push('AGENT_LLM_MODEL')
      }
      if (!agentLlmPromptVersion) {
        missingAgentLlmConfig.push('AGENT_LLM_PROMPT_VERSION')
      }
      if (agentLlmConnector === 'bedrock') {
        if (!agentBedrockRegion) {
          missingAgentLlmConfig.push('AGENT_BEDROCK_REGION')
        }
        if (!agentBedrockModelId && !agentLlmModel) {
          missingAgentLlmConfig.push('AGENT_BEDROCK_MODEL_ID')
        }
      }
      if (
        agentLlmConnector === 'anthropic'
        && (envName === 'staging' || envName === 'prod')
        && !agentAnthropicApiKeySecretArn
      ) {
        missingAgentLlmConfig.push('AGENT_ANTHROPIC_API_KEY_SECRET_ARN')
      }
      if (missingAgentLlmConfig.length > 0) {
        throw new Error(
          `Missing required agent LLM runtime configuration: ${missingAgentLlmConfig.join(', ')}.`,
        )
      }
    }
    const planeBQueueWorkerMaxCount = toOptionalNumber(
      this.node.tryGetContext('planeBQueueWorkerMaxCount') ??
        process.env.PLANE_B_QUEUE_WORKER_MAX,
    ) ?? (envName === 'prod' ? 20 : envName === 'dev' ? 1 : 10)
    const planeBQueueWorkerSpotOnly = toOptionalBool(
      this.node.tryGetContext('planeBQueueWorkerSpotOnly') ??
        process.env.PLANE_B_QUEUE_WORKER_SPOT_ONLY,
    ) ?? (envName === 'dev' ? false : undefined)
    const planeCBaseUrl =
      this.node.tryGetContext('planeCBaseUrl') ??
      process.env.PLANE_C_BASE_URL
    const enableCloudFront = toOptionalBool(
      this.node.tryGetContext('enableCloudFront') ??
        process.env.ENABLE_CLOUDFRONT,
    ) ?? (envName !== 'dev')
    const enableWaf = toOptionalBool(
      this.node.tryGetContext('enableWaf') ??
        process.env.ENABLE_WAF,
    ) ?? (envName !== 'dev')
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
    const planeAAdminEmailsRaw = toList(
      this.node.tryGetContext('planeAAdminEmails') ??
      process.env.PLANE_A_ADMIN_EMAILS,
    )
    const planeAAdminEmails =
      planeAAdminEmailsRaw.length > 0
        ? planeAAdminEmailsRaw
        : envName === 'dev'
          ? ['admin@example.com']
          : []
    if ((envName === 'staging' || envName === 'prod') && planeAAdminEmails.length === 0) {
      throw new Error('PLANE_A_ADMIN_EMAILS is required in staging and production.')
    }
    const planeAB2cMaxBucketDeltaPct =
      toOptionalNumber(
        this.node.tryGetContext('planeAB2cMaxBucketDeltaPct') ??
        process.env.PLANE_A_B2C_MAX_BUCKET_DELTA_PCT,
      ) ?? (envName === 'prod' ? 0.2 : 0.25)
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
    const planeAAdminRevocationFailClosed = cdkContext.planeAAdminRevocationFailClosed
      ?? toOptionalBool(process.env.PLANE_A_ADMIN_REVOCATION_FAIL_CLOSED)
      ?? envName !== 'dev'
    const frontendDomainName =
      this.node.tryGetContext('frontendDomainName') ??
      process.env.FRONTEND_DOMAIN_NAME
    const frontendBaseUrl =
      this.node.tryGetContext('frontendBaseUrl') ??
      process.env.FRONTEND_BASE_URL ??
      process.env.PUBLIC_SITE_URL ??
      (frontendDomainName ? `https://${frontendDomainName}` : undefined)
    const normalizedFrontendOrigin = normalizeOrigin(frontendBaseUrl)
    const defaultDevCorsOrigins = envName === 'dev'
      ? ['http://localhost:3000', 'http://127.0.0.1:3000']
      : []
    const planeACorsOrigins = (() => {
      if (planeACorsOriginsRaw.length > 0) {
        return planeACorsOriginsRaw
      }
      const combined = [
        ...(normalizedFrontendOrigin ? [normalizedFrontendOrigin] : []),
        ...defaultDevCorsOrigins,
      ]
      return Array.from(new Set(combined.filter(Boolean)))
    })()
    const publicSupabaseUrl =
      this.node.tryGetContext('publicSupabaseUrl') ??
      process.env.PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_URL
    const publicSupabaseAnonKey =
      this.node.tryGetContext('publicSupabaseAnonKey') ??
      process.env.PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY
    const publicGa4MeasurementId =
      this.node.tryGetContext('publicGa4MeasurementId') ??
      process.env.PUBLIC_GA4_MEASUREMENT_ID ??
      process.env.GA4_MEASUREMENT_ID
    const publicMetaPixelId =
      this.node.tryGetContext('publicMetaPixelId') ??
      process.env.PUBLIC_META_PIXEL_ID ??
      process.env.META_PIXEL_ID
    const publicAdsEnabled =
      this.node.tryGetContext('publicAdsEnabled') ??
      process.env.PUBLIC_ADS_ENABLED
    const publicPulseEnabled =
      this.node.tryGetContext('publicPulseEnabled') ??
      process.env.PUBLIC_PULSE_ENABLED ??
      process.env.NUXT_PUBLIC_PULSE_ENABLED
    const publicNewRelicBrowserEnabled =
      this.node.tryGetContext('publicNewRelicBrowserEnabled') ??
      process.env.PUBLIC_NEW_RELIC_BROWSER_ENABLED ??
      process.env.NEW_RELIC_BROWSER_ENABLED
    const publicNewRelicAccountId =
      this.node.tryGetContext('publicNewRelicAccountId') ??
      process.env.PUBLIC_NEW_RELIC_ACCOUNT_ID
    const publicNewRelicTrustKey =
      this.node.tryGetContext('publicNewRelicTrustKey') ??
      process.env.PUBLIC_NEW_RELIC_TRUST_KEY
    const publicNewRelicAgentId =
      this.node.tryGetContext('publicNewRelicAgentId') ??
      process.env.PUBLIC_NEW_RELIC_AGENT_ID
    const publicNewRelicApplicationId =
      this.node.tryGetContext('publicNewRelicApplicationId') ??
      process.env.PUBLIC_NEW_RELIC_APPLICATION_ID
    const publicNewRelicLicenseKey =
      this.node.tryGetContext('publicNewRelicLicenseKey') ??
      process.env.PUBLIC_NEW_RELIC_LICENSE_KEY
    const publicNewRelicBeacon =
      this.node.tryGetContext('publicNewRelicBeacon') ??
      process.env.PUBLIC_NEW_RELIC_BEACON
    const publicNewRelicErrorBeacon =
      this.node.tryGetContext('publicNewRelicErrorBeacon') ??
      process.env.PUBLIC_NEW_RELIC_ERROR_BEACON
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
    const planeCInternalApiTokenSecretJsonKey =
      process.env.PLANE_C_INTERNAL_API_TOKEN_SECRET_JSON_KEY
    const planeAJwtSecretJsonKey =
      this.node.tryGetContext('planeAJwtSecretJsonKey') ??
      process.env.PLANE_A_JWT_SECRET_JSON_KEY ??
      'PLANE_A_JWT_SECRET'
    const disablePlaneAExecuteEndpoint = toOptionalBool(
      this.node.tryGetContext('disablePlaneAExecuteEndpoint') ??
        process.env.PLANE_A_DISABLE_EXECUTE_ENDPOINT,
    ) ?? false
    const disablePlaneCExecuteEndpoint = toOptionalBool(
      this.node.tryGetContext('disablePlaneCExecuteEndpoint') ??
        process.env.PLANE_C_DISABLE_EXECUTE_ENDPOINT,
    ) ?? (envName !== 'dev' && Boolean(planeCBaseUrl))
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
    const wafStripeWebhookAllowListIps = (() => {
      const raw =
        this.node.tryGetContext('wafStripeWebhookAllowListIps') ??
        process.env.WAF_STRIPE_WEBHOOK_ALLOWLIST_IPS
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        return raw.split(',').map((value) => value.trim()).filter(Boolean)
      }
      return []
    })()
    const wafAdminAllowListIps = (() => {
      const raw =
        this.node.tryGetContext('wafAdminAllowListIps') ??
        process.env.WAF_ADMIN_ALLOWLIST_IPS ??
        process.env.WAF_ALLOWLIST_IPS
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        return raw.split(',').map((value) => value.trim()).filter(Boolean)
      }
      return []
    })()
    const planeAAdminIpAllowlist = (() => {
      const raw = process.env.ADMIN_IP_ALLOWLIST
      if (typeof raw === 'string' && raw.trim()) {
        return raw.split(',').map((value) => value.trim()).filter(Boolean)
      }
      return wafAdminAllowListIps
    })()
    if ((envName === 'staging' || envName === 'prod') && planeAAdminIpAllowlist.length === 0) {
      throw new Error(
        'ADMIN_IP_ALLOWLIST, WAF_ADMIN_ALLOWLIST_IPS, or WAF_ALLOWLIST_IPS is required for staging/prod deployments.',
      )
    }
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
      process.env.ALERT_SLACK_WEBHOOK_URL ??
      process.env.SLACK_WEBHOOK_URL
    const slackWorkspaceId =
      this.node.tryGetContext('slackWorkspaceId') ??
      process.env.SLACK_WORKSPACE_ID
    const slackCriticalChannelId =
      this.node.tryGetContext('slackCriticalChannelId') ??
      process.env.SLACK_CRITICAL_CHANNEL_ID
    const slackWarningChannelId =
      this.node.tryGetContext('slackWarningChannelId') ??
      process.env.SLACK_WARNING_CHANNEL_ID
    const slackOpsChannelId =
      this.node.tryGetContext('slackOpsChannelId') ??
      process.env.SLACK_OPS_CHANNEL_ID
    const pagerDutyIntegrationKey =
      this.node.tryGetContext('pagerDutyIntegrationKey') ??
      process.env.PAGERDUTY_INTEGRATION_KEY
    const betterUptimeWebhookSsmParamName =
      this.node.tryGetContext('betterUptimeWebhookSsmParamName') ??
      process.env.BETTERUPTIME_WEBHOOK_SSM_PARAM ??
      (envName === 'prod' ? '/remitscout/prod/betteruptime_webhook' : undefined)
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
    const pipelineEnabled =
      toOptionalBool(
        this.node.tryGetContext('pipelineEnabled') ??
          process.env.PIPELINE_ENABLED,
      ) ?? envName !== 'dev'
    const pipelineEnableDeploy =
      toOptionalBool(
        this.node.tryGetContext('pipelineEnableDeploy') ??
          process.env.PIPELINE_ENABLE_DEPLOY,
      ) ?? envName !== 'dev'
    const pipelineRequireApproval =
      toOptionalBool(
        this.node.tryGetContext('pipelineRequireApproval') ??
          process.env.PIPELINE_REQUIRE_APPROVAL,
      ) ?? envName !== 'dev'
    const devPaused = envName === 'dev'
      ? (toOptionalBool(
          this.node.tryGetContext('devPaused') ??
            process.env.DEV_PAUSED,
        ) ?? false)
      : false
    const opsPauseAllowlist = toList(
      this.node.tryGetContext('opsPauseRuleAllowlist') ??
        process.env.OPS_PAUSE_RULE_ALLOWLIST,
    )
    const opsResumeAllowlist = toList(
      this.node.tryGetContext('opsResumeRuleAllowlist') ??
        process.env.OPS_RESUME_RULE_ALLOWLIST,
    )
    const purgeQueuesOnResume =
      toOptionalBool(
        this.node.tryGetContext('purgeQueuesOnResume') ??
          process.env.PURGE_QUEUES_ON_RESUME,
      ) ?? (envName === 'dev' || envName === 'staging')
    const purgeQueueAllowlist = toList(
      this.node.tryGetContext('purgeQueueAllowlist') ??
        process.env.PURGE_QUEUE_ALLOWLIST,
    )
    const hardStopEnabled = envName !== 'prod'
    const minimalMode = minimalInfra || (envName === 'dev' && devMinimalInfra)

    const devNightlyPauseEnabled = envName === 'dev'
      ? (toOptionalBool(
          this.node.tryGetContext('devNightlyPauseEnabled') ??
            process.env.DEV_NIGHTLY_PAUSE_ENABLED,
        ) ?? false)
      : false
    const devNightlyPauseCron =
      this.node.tryGetContext('devNightlyPauseCron') ??
      process.env.DEV_NIGHTLY_PAUSE_CRON ??
      'cron(0 0 * * ? *)'
    const devMorningResumeCron =
      this.node.tryGetContext('devMorningResumeCron') ??
      process.env.DEV_MORNING_RESUME_CRON ??
      'cron(0 8 ? * MON-FRI *)'
    const devNightlyPauseTimezone =
      this.node.tryGetContext('devNightlyPauseTimezone') ??
      process.env.DEV_NIGHTLY_PAUSE_TIMEZONE ??
      'America/New_York'
    const stagingBusinessHoursEnabled = envName === 'staging'
      ? (toOptionalBool(
          this.node.tryGetContext('stagingBusinessHoursEnabled') ??
            process.env.STAGING_BUSINESS_HOURS_ENABLED,
        ) ?? false)
      : false
    const stagingPauseCron =
      this.node.tryGetContext('stagingPauseCron') ??
      process.env.STAGING_PAUSE_CRON ??
      'cron(0 20 ? * MON-FRI *)'
    const stagingResumeCron =
      this.node.tryGetContext('stagingResumeCron') ??
      process.env.STAGING_RESUME_CRON ??
      'cron(0 8 ? * MON-FRI *)'
    const stagingTimezone =
      this.node.tryGetContext('stagingTimezone') ??
      process.env.STAGING_TIMEZONE ??
      'America/New_York'

    // OpsPause resume behavior:
    // - prod: keep a minimal allowlist by default
    // - dev: enable all rules by default (closer to prod behavior for readiness tests)
    // - dev minimal infra: keep resume low-noise/low-cost
    const resolvedOpsResumeAllowlist = opsResumeAllowlist.length > 0
      ? opsResumeAllowlist
      : (opsPauseAllowlist.length > 0
        ? opsPauseAllowlist
      : (envName === 'prod'
        ? ['telemetry-analytics', 'session-cleanup', 'audit-log-cleanup']
        : (envName === 'dev'
          ? (minimalMode
            ? [
                'alert-evaluation-worker',
                'alert-evaluation-weekly',
              ]
            : [])
          : [])))
    const defaultPurgeQueueAllowlist = [
      'ingest-fanout',
      'ingest-fanout-tier2',
      'gold-live',
      'quote-refresh',
      'fx-rate-refresh',
    ]
    const resolvedPurgeQueueAllowlist = purgeQueueAllowlist.length > 0
      ? purgeQueueAllowlist
      : defaultPurgeQueueAllowlist
    const dedupedPurgeQueueAllowlist = [...new Set(
      resolvedPurgeQueueAllowlist.map((suffix) => suffix.trim()).filter(Boolean),
    )]
    const purgeQueueTargetsBySuffix = {
      'ingest-fanout': {
        url: queues.ingestFanoutQueue.queueUrl,
        arn: queues.ingestFanoutQueue.queueArn,
      },
      'ingest-fanout-tier2': {
        url: queues.ingestFanoutTier2Queue.queueUrl,
        arn: queues.ingestFanoutTier2Queue.queueArn,
      },
      'gold-live': {
        url: queues.goldLiveQueue.queueUrl,
        arn: queues.goldLiveQueue.queueArn,
      },
      'quote-refresh': {
        url: queues.quoteRefreshQueue.queueUrl,
        arn: queues.quoteRefreshQueue.queueArn,
      },
      'fx-rate-refresh': {
        url: queues.fxRateRefreshQueue.queueUrl,
        arn: queues.fxRateRefreshQueue.queueArn,
      },
    } as const
    const unknownPurgeQueueSuffixes = dedupedPurgeQueueAllowlist.filter(
      (suffix) => !(suffix in purgeQueueTargetsBySuffix),
    )
    if (unknownPurgeQueueSuffixes.length > 0) {
      throw new Error(
        `Unknown purgeQueueAllowlist values: ${unknownPurgeQueueSuffixes.join(', ')}.`,
      )
    }
    const resolvedPurgeQueueUrls = dedupedPurgeQueueAllowlist.map(
      (suffix) => purgeQueueTargetsBySuffix[suffix as keyof typeof purgeQueueTargetsBySuffix].url,
    )
    const resolvedPurgeQueueArns = dedupedPurgeQueueAllowlist.map(
      (suffix) => purgeQueueTargetsBySuffix[suffix as keyof typeof purgeQueueTargetsBySuffix].arn,
    )

    const planeADbHost = database.proxy?.endpoint ?? database.cluster.clusterEndpoint.hostname
    const planeADbPort = '5432'
    const planeADbName = 'remit_scout'
    const planeBDbHost = database.proxy?.endpoint ?? database.cluster.clusterEndpoint.hostname
    const planeBDbPort = '5432'
    const planeBDbName = 'remit_scout'
    const planeCDbHost = database.proxy?.endpoint ?? database.cluster.clusterEndpoint.hostname
    const planeCDbPort = '5432'
    const planeCDbName = 'remit_scout'
    const planeADbConnectionRoute = database.proxy ? 'proxy' : 'direct'
    const planeBDbConnectionRoute = database.proxy ? 'proxy' : 'direct'
    const planeCDbConnectionRoute = database.proxy ? 'proxy' : 'direct'
    const planeADbTimeoutPolicy =
      planeADbConnectionRoute === 'proxy' ? 'proxy-guarded' : 'server-statement-timeout'
    const planeBDbTimeoutPolicy =
      planeBDbConnectionRoute === 'proxy' ? 'proxy-guarded' : 'server-statement-timeout'
    const planeCDbTimeoutPolicy =
      planeCDbConnectionRoute === 'proxy' ? 'proxy-guarded' : 'server-statement-timeout'

    const runtimeStack = new RuntimeNestedStack(this, 'Runtime', {
      envName,
      imageTag,
      minimalMode,
      paused: devPaused,
      cpuArchitecture,
      foundation: foundationStack.resources,
      taskOptions: {
        planeBDbSecretArn,
        planeBDbMigratorSecretArn,
        planeBDbSsmName,
        redisSecretArn,
        redisSecretJsonKey,
        redisSsmName,
        redisUrl,
        planeBDbHost,
        planeBDbPort,
        planeBDbName,
        alertsSlackWebhookUrl: slackWebhookUrl,
        planeCDbSecretArn,
        planeCDbSsmName,
        planeCDbHost,
        planeCDbPort,
        planeCDbName,
        sentrySecretArn,
        sentrySecretJsonKey,
        sharedSecretArn,
        planeAJwtSecretJsonKey,
        quoteRefreshQueueUrl: queues.quoteRefreshQueue.queueUrl,
        quoteRefreshDlqUrl: queues.quoteRefreshDlq.queueUrl,
        quoteRefreshQueueMode,
        fxRateRefreshQueueUrl: queues.fxRateRefreshQueue.queueUrl,
        fxRateRefreshDlqUrl: queues.fxRateRefreshDlq.queueUrl,
        fxRateRefreshQueueMode,
        ingestFanoutQueueTier1Url: queues.ingestFanoutQueue.queueUrl,
        ingestFanoutQueueTier2Url: queues.ingestFanoutTier2Queue.queueUrl,
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
        planeADbSecretArn,
        planeADbSsmName,
        planeADbHost,
        planeADbPort,
        planeADbName,
        alertEvaluationQueueUrl: queues.alertEvaluationQueue.queueUrl,
        agentFailureQueueUrl: queues.agentFailureQueue.queueUrl,
        agentStressQueueUrl: queues.agentStressQueue.queueUrl,
        toolRequestQueueUrl: queues.toolRequestQueue.queueUrl,
        normalizationQueueUrl: queues.normalizationQueue.queueUrl,
        agentFailureQueueMode,
        agentStressQueueMode,
        toolRequestQueueMode,
        normalizationQueueMode,
        agentLlmConnector,
        agentLlmModel,
        agentLlmMaxTokens,
        agentLlmTemperature,
        agentLlmPromptVersion,
        agentTelemetryDims,
        agentAnthropicApiKeySecretArn,
        agentBedrockRegion,
        agentBedrockModelId,
        agentBedrockMaxTokens,
        agentBedrockSecretArn,
        exportJobQueueUrl: queues.exportJobQueue.queueUrl,
        exportJobQueueMode,
        exportsBucketName: storage.exportsBucket.bucketName,
        exportsPrefix,
        supabaseSecretArn,
        supabaseSsmName,
        communicationsSecretArn,
        b2cQueueInSweep,
        b2cRefreshLoopEnabled: b2cRefreshServiceEnabled,
        fxRateRefreshLoopEnabled: fxRateRefreshServiceEnabled,
        planeBB2bTargetMinutes,
        planeBB2bObservationMode,
        planeBB2bMaxQueueDepth,
        planeBIngestFanoutMessageMode,
        goldIndicesMinProviders,
        planeBDisableTier1: planeBDisableTier1 ? '1' : undefined,
        ingestFanoutMode,
        notificationsMode,
        opsAlertsMode,
        planeBDbPoolMax: String(planeBDbPoolMax),
        planeBDbPoolMin: String(planeBDbPoolMin),
      },
      serviceOptions: {
        ingestFanoutMode,
        quoteRefreshMode: quoteRefreshQueueMode,
        fxRateRefreshMode: fxRateRefreshQueueMode,
        goldLiveMode: goldLiveQueueMode,
        notificationsMode,
        opsAlertsMode,
        alertEvaluationMode: alertEvaluationServiceEnabled ? 'queue' : 'off',
        exportJobMode: exportJobQueueMode,
        agentFailureMode: agentFailureQueueMode,
        agentStressMode: agentStressQueueMode,
        toolRequestMode: toolRequestQueueMode,
        normalizationMode: normalizationQueueMode,
        b2cRefreshServiceEnabled,
        fxRateRefreshServiceEnabled,
        alertEvaluationServiceEnabled,
        exportServiceEnabled,
        agentOrchestratorServiceEnabled,
        stressResponderServiceEnabled,
        normalizationServiceEnabled,
        planeADesiredCount,
        b2cRefreshDesiredCount: b2cRefreshServiceEnabled ? (b2cRefreshDesiredCount ?? 0) : 0,
        fxRateRefreshDesiredCount: fxRateRefreshServiceEnabled ? (fxRateRefreshDesiredCount ?? 0) : 0,
        planeBIngestDesiredCount,
        queueWorkerDesiredCount: planeBQueueWorkerDesiredCount,
        queueWorkerMaxCount: planeBQueueWorkerMaxCount,
        ingestFanoutTier1DesiredCount,
        ingestFanoutTier2DesiredCount,
        goldLiveDesiredCount,
        notificationsDesiredCount,
        opsAlertsDesiredCount,
        alertEvaluationDesiredCount: alertEvaluationServiceEnabled ? (alertEvaluationDesiredCount ?? 0) : 0,
        exportWorkerDesiredCount: exportServiceEnabled ? (exportWorkerDesiredCount ?? 0) : 0,
        agentOrchestratorDesiredCount: agentOrchestratorServiceEnabled ? (agentOrchestratorDesiredCount ?? 0) : 0,
        stressResponderDesiredCount: stressResponderServiceEnabled ? (stressResponderDesiredCount ?? 0) : 0,
        normalizationWorkerDesiredCount: normalizationServiceEnabled ? (normalizationWorkerDesiredCount ?? 0) : 0,
        queueWorkerSpotOnly: planeBQueueWorkerSpotOnly,
      },
    })
    const { compute, tasks, ecsServices } = runtimeStack.resources

    const api = createApi(this, {
      envName,
      vpc: networking.vpc,
      roles: foundationStack.resources.iam,
      planeASecurityGroup: networking.planeASecurityGroup,
      planeCSecurityGroup: networking.planeCSecurityGroup,
      lambdaArchitecture,
      quoteRefreshQueueUrl: queues.quoteRefreshQueue.queueUrl,
      quoteRefreshQueueMode,
      fxRateRefreshQueueUrl: queues.fxRateRefreshQueue.queueUrl,
      fxRateRefreshQueueMode,
      exportJobQueueUrl: queues.exportJobQueue.queueUrl,
      exportJobQueueMode,
      exportsBucketName: storage.exportsBucket.bucketName,
      exportsPrefix,
      ingestFanoutQueueUrl: queues.ingestFanoutQueue.queueUrl,
      ingestFanoutTier1QueueUrl: queues.ingestFanoutQueue.queueUrl,
      ingestFanoutTier2QueueUrl: queues.ingestFanoutTier2Queue.queueUrl,
      notificationsQueueUrl: queues.notificationsQueue.queueUrl,
      opsAlertsQueueUrl: queues.opsAlertsQueue.queueUrl,
      goldLiveQueueUrl: queues.goldLiveQueue.queueUrl,
      goldLiveQueueMode,
      alertEvaluationQueueUrl: queues.alertEvaluationQueue.queueUrl,
      userAssetsBucketName: storage.userAssetsBucket.bucketName,
      userAssetsPrefix,
      bronzeBucketName: storage.bronzeBucket.bucketName,
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
      sentrySecretArn,
      sentrySecretJsonKey,
      sharedSecretArn,
      planeAJwtSecretJsonKey,
      planeCInternalApiTokenSecretJsonKey,
      planeAAdminEmails,
      planeAAdminIpAllowlist,
      planeAB2cMaxBucketDeltaPct,
      planeBDisableTier1: planeBDisableTier1 ? '1' : undefined,
      planeACorsOrigins,
      planeACorsAllowedHeaders,
      planeACorsAllowedMethods,
      planeACorsAllowCredentials,
      planeAAdminRevocationFailClosed,
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
      cloudFrontAccessLogsBucket: storage.storageAccessLogsBucket,
      enablePlaneAJwtAuth,
      planeAJwtIssuer,
      planeAJwtAudiences,
      enablePlaneCIamAuth,
      disablePlaneAExecuteEndpoint,
      disablePlaneCExecuteEndpoint,
      wafAllowListIps,
      wafBlockListIps,
      wafStripeWebhookAllowListIps,
      wafAdminAllowListIps,
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

    const edgeStack = new EdgeNestedStack(this, 'Edge', {
      envName,
      api,
      defaultFrontendBaseUrl: frontendBaseUrl,
      pinpointAppId: pinpoint?.pinpointAppId ?? undefined,
      frontendOptions: {
        frontendDomainName,
        frontendCertificateArn:
          this.node.tryGetContext('frontendCertificateArn') ?? process.env.FRONTEND_CERT_ARN,
        frontendHostedZoneId:
          this.node.tryGetContext('frontendHostedZoneId') ?? process.env.FRONTEND_HOSTED_ZONE_ID,
        frontendHostedZoneName:
          this.node.tryGetContext('frontendHostedZoneName') ?? process.env.FRONTEND_HOSTED_ZONE_NAME,
        enableFrontend,
      },
    })
    const { frontend } = edgeStack.resources

    const costGuardrailTopic =
      envName === 'dev' && enableCostGuardrails
        ? new Topic(this, 'DevCostGuardrailTopic', {
            topicName: `remit-scout-${envName}-cost-guardrail`,
          })
        : undefined

    if (costGuardrailTopic) {
      const costPublishCondition = {
        StringEquals: { 'AWS:SourceOwner': this.account },
      }
      costGuardrailTopic.addToResourcePolicy(
        new PolicyStatement({
          principals: [new ServicePrincipal('budgets.amazonaws.com')],
          actions: ['sns:Publish'],
          resources: [costGuardrailTopic.topicArn],
          conditions: costPublishCondition,
        }),
      )
      costGuardrailTopic.addToResourcePolicy(
        new PolicyStatement({
          principals: [new ServicePrincipal('costalerts.amazonaws.com')],
          actions: ['sns:Publish'],
          resources: [costGuardrailTopic.topicArn],
          conditions: costPublishCondition,
        }),
      )
    }

    const queueWorkerBaseline = planeBQueueWorkerDesiredCount ?? 0
    const ingestFanoutTier1Baseline =
      ingestFanoutMode === 'queue' ? (ingestFanoutTier1DesiredCount ?? queueWorkerBaseline) : 0
    const ingestFanoutTier2Baseline =
      ingestFanoutMode === 'queue'
        ? (ingestFanoutTier2DesiredCount ?? Math.max(0, ingestFanoutTier1Baseline - 1))
        : 0
    const goldLiveBaseline =
      goldLiveQueueMode === 'queue' ? (goldLiveDesiredCount ?? queueWorkerBaseline) : 0
    const notificationsBaseline =
      notificationsMode === 'queue' ? (notificationsDesiredCount ?? queueWorkerBaseline) : 0
    const opsAlertsBaseline =
      opsAlertsMode === 'queue' ? (opsAlertsDesiredCount ?? queueWorkerBaseline) : 0
    const b2cRefreshBaseline = b2cRefreshServiceEnabled ? (b2cRefreshDesiredCount ?? 0) : 0
    const fxRateRefreshBaseline = fxRateRefreshServiceEnabled ? (fxRateRefreshDesiredCount ?? 0) : 0
    const alertEvaluationBaseline = alertEvaluationServiceEnabled ? (alertEvaluationDesiredCount ?? 0) : 0
    const exportWorkerBaseline = exportServiceEnabled ? (exportWorkerDesiredCount ?? 0) : 0
    const agentOrchestratorBaseline =
      agentOrchestratorServiceEnabled
      && (agentFailureQueueMode === 'queue' || toolRequestQueueMode === 'queue')
        ? (agentOrchestratorDesiredCount ?? 0)
        : 0
    const stressResponderBaseline =
      stressResponderServiceEnabled && agentStressQueueMode === 'queue'
        ? (stressResponderDesiredCount ?? 0)
        : 0
    const normalizationWorkerBaseline =
      normalizationServiceEnabled && normalizationQueueMode === 'queue'
        ? (normalizationWorkerDesiredCount ?? 0)
        : 0
    const planeBIngestBaseline = planeBIngestDesiredCount ?? 0

    const managedEcsServiceNames: string[] = []
    const managedEcsBaselines: Record<string, number> = {}

    const addManagedService = (service: { serviceName: string } | undefined, baseline: number): void => {
      if (!service) return
      managedEcsServiceNames.push(service.serviceName)
      managedEcsBaselines[service.serviceName] = baseline
    }

    addManagedService(ecsServices.planeBIngestService, planeBIngestBaseline)
    addManagedService(ecsServices.b2cRefreshService, b2cRefreshBaseline)
    addManagedService(ecsServices.fxRateRefreshService, fxRateRefreshBaseline)
    addManagedService(ecsServices.ingestFanoutTier1Service, ingestFanoutTier1Baseline)
    addManagedService(ecsServices.ingestFanoutTier2Service, ingestFanoutTier2Baseline)
    addManagedService(ecsServices.goldLiveService, goldLiveBaseline)
    addManagedService(ecsServices.notificationsQueueService, notificationsBaseline)
    addManagedService(ecsServices.opsAlertsQueueService, opsAlertsBaseline)
    addManagedService(ecsServices.alertEvaluationService, alertEvaluationBaseline)
    addManagedService(ecsServices.exportWorkerService, exportWorkerBaseline)
    addManagedService(ecsServices.agentOrchestratorService, agentOrchestratorBaseline)
    addManagedService(ecsServices.stressResponderService, stressResponderBaseline)
    addManagedService(ecsServices.normalizationWorkerService, normalizationWorkerBaseline)

    const opsStack = new OpsNestedStack(this, 'Ops', {
      envName,
      minimalMode,
      enableSynthetics,
      enableMonitoring,
      enableComplianceServices,
      pipelineEnabled,
      foundation: foundationStack.resources,
      runtime: runtimeStack.resources,
      edge: edgeStack.resources,
      snsOptions: {
        slackWorkspaceId,
        slackCriticalChannelId,
        slackWarningChannelId,
        slackOpsChannelId,
        slackWebhookUrl,
        pagerDutyIntegrationKey,
        betterUptimeWebhookSsmParamName,
      },
      backupOptions: {
        enabled: enableBackup,
      },
      costGuardrailsOptions: {
        enabled: enableCostGuardrails,
        costAlertEmails: resolvedCostAlertEmails,
        costAlertSnsTopicArn: costGuardrailTopic?.topicArn,
        monthlyBudgetAmountUsd: costBudgetAmountUsd,
        anomalyThresholdUsd: costAnomalyThresholdUsd,
        createCur: costGuardrailsCreateCur,
      },
      pipelineOptions: {
        connectionArn: pipelineConnectionArn,
        repoOwner: pipelineRepoOwner,
        repoName: pipelineRepoName,
        repoBranch: pipelineRepoBranch,
        enableDeploy: pipelineEnableDeploy,
        requireApproval: pipelineRequireApproval,
        publicSupabaseUrl,
        publicSupabaseAnonKey,
        publicSupabaseSecretArn: supabaseSecretArn,
        publicSupabaseUrlSecretJsonKey,
        publicSupabaseAnonKeySecretJsonKey,
        publicGa4MeasurementId,
        publicMetaPixelId,
        publicAdsEnabled,
        publicPulseEnabled,
        publicNewRelicBrowserEnabled,
        publicNewRelicAccountId,
        publicNewRelicTrustKey,
        publicNewRelicAgentId,
        publicNewRelicApplicationId,
        publicNewRelicLicenseKey,
        publicNewRelicBeacon,
        publicNewRelicErrorBeacon,
        devPaused,
      },
      scheduledJobsOptions: {
        lambdaArchitecture,
        b2cRefreshServiceEnabled,
        b2cRefreshDesiredCount,
        fxRateRefreshServiceEnabled,
        fxRateRefreshDesiredCount,
        goldIndicesLookbackDays,
        goldIndicesMinProviders,
        providerWeightWindowDays,
        institutionalExportFormat,
        institutionalExportWriteManifest,
        paused: devPaused,
        otelLambdaLayerArn,
        sentrySecretArn,
        sentrySecretJsonKey,
        planeBDbSecretArn,
        planeBDbSsmName,
        proxyResidentialSecretArn,
        proxyResidentialSsmName,
        proxyResidentialUrl,
        proxyDatacenterSecretArn,
        proxyDatacenterSsmName,
        proxyDatacenterUrl,
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
        alertEvaluationServiceEnabled,
        exportServiceEnabled,
        minimalMode,
        planeBDbHost,
        planeBDbPort,
        planeBDbName,
        planeCDbHost,
        planeCDbPort,
        planeCDbName,
        providerProbeMode,
      },
      opsPauseOptions: {
        ecsServiceNames: managedEcsServiceNames,
        ecsBaselineDesired: managedEcsBaselines,
        eventRulePrefix: `remit-scout-${envName}-`,
        eventRuleAllowlist: opsPauseAllowlist,
        eventRuleResumeAllowlist: resolvedOpsResumeAllowlist,
        hardStopEnabled,
        dbClusterIdentifier: database.cluster.clusterIdentifier,
        redisReplicationGroupId: cache.replicationGroup.ref,
        redisSubnetGroupName: cache.subnetGroup.cacheSubnetGroupName ?? cache.subnetGroup.ref,
        redisSecurityGroupIds: [networking.redisSecurityGroup.securityGroupId],
        redisNodeType: envName === 'prod'
          ? (resolvedProdRedisNodeType ?? 'cache.t4g.small')
          : 'cache.t4g.micro',
        redisEngineVersion: '7.1',
        redisNumNodeGroups: 1,
        redisReplicasPerNodeGroup: envName === 'prod'
          ? (resolvedProdRedisReplicasPerNodeGroup ?? 1)
          : 0,
        redisAutomaticFailover: envName === 'prod'
          ? Boolean(resolvedProdRedisAutomaticFailover ?? true)
          : false,
        redisMultiAz: envName === 'prod'
          ? Boolean(resolvedProdRedisMultiAz ?? true)
          : false,
        redisTransitEncryption: true,
        redisAtRestEncryption: true,
        redisAutoMinorVersionUpgrade: true,
        purgeQueuesOnResume,
        purgeQueueUrls: purgeQueuesOnResume ? resolvedPurgeQueueUrls : [],
        purgeQueueArns: purgeQueuesOnResume ? resolvedPurgeQueueArns : [],
        sharedSecretArn,
        planeAJwtSecretJsonKey,
      },
    })
    const {
      snsSubscriptions,
      backup,
      costGuardrails,
      monitoring,
      synthetics,
      pipeline,
      opsPause,
    } = opsStack.resources

    if (monitoring) {
      const exportsRequestMetrics = [
        { id: 'ExportsIndicesMetrics', label: 'Indices' },
        { id: 'ExportsParquetMetrics', label: 'Parquet' },
      ]
      for (const metricInfo of exportsRequestMetrics) {
        const requestMetric = new Metric({
          namespace: 'AWS/S3',
          metricName: 'AllRequests',
          statistic: 'Sum',
          period: Duration.minutes(5),
          dimensionsMap: {
            BucketName: storage.exportsBucket.bucketName,
            FilterId: metricInfo.id,
          },
        })

        const requestSpikeAlarm = new Alarm(this, `ExportsRequestSpike${metricInfo.label}`, {
          alarmName: `remit-scout-${envName}-exports-${metricInfo.label.toLowerCase()}-request-spike`,
          metric: requestMetric,
          threshold: envName === 'prod' ? 10000 : 20000,
          evaluationPeriods: 1,
          comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          treatMissingData: TreatMissingData.NOT_BREACHING,
        })
        requestSpikeAlarm.addAlarmAction(new SnsAction(snsSubscriptions.opsTopic))
      }

      if (snowflakePartnerRole) {
        const assumeRoleFailureRule = new Rule(this, 'SnowflakeAssumeRoleFailureRule', {
          ruleName: `remit-scout-${envName}-snowflake-assume-role-failure`,
          description: 'Alerts on failed STS AssumeRole for Snowflake partner role.',
          eventPattern: {
            source: ['aws.sts'],
            detailType: ['AWS API Call via CloudTrail'],
            detail: {
              eventSource: ['sts.amazonaws.com'],
              eventName: ['AssumeRole'],
              errorCode: [{ exists: true }],
              requestParameters: {
                roleArn: [snowflakePartnerRole.roleArn],
              },
            },
          },
        })
        assumeRoleFailureRule.addTarget(new SnsTopic(snsSubscriptions.opsTopic))
      }
    }

    if (envName === 'staging' || envName === 'prod') {
      const scheduledTaskFamilyRules = [
        'b2b-sweep-scheduler',
        'b2c-refresh-worker',
        'fx-rate-refresh-worker',
        'export-worker',
      ]
      const failedTaskStartRule = new Rule(this, 'ScheduledTaskFailedToStartRule', {
        ruleName: `remit-scout-${envName}-scheduled-task-failed-to-start`,
        description: 'Detects ECS scheduled task startup failures (TaskFailedToStart).',
        eventPattern: {
          source: ['aws.ecs'],
          detailType: ['ECS Task State Change'],
          detail: {
            clusterArn: [runtimeStack.resources.compute.cluster.clusterArn],
            lastStatus: ['STOPPED'],
            stopCode: ['TaskFailedToStart'],
            startedBy: scheduledTaskFamilyRules.map((ruleSuffix) => ({
              prefix: `events-rule/remit-scout-${envName}-${ruleSuffix}`,
            })),
          },
        },
      })
      failedTaskStartRule.addTarget(new SnsTopic(snsSubscriptions.opsTopic))

      const failedTaskStartAlarm = new Alarm(this, 'ScheduledTaskFailedToStartAlarm', {
        alarmName: `remit-scout-${envName}-scheduled-task-failed-to-start`,
        metric: new Metric({
          namespace: 'AWS/Events',
          metricName: 'MatchedEvents',
          dimensionsMap: {
            RuleName: failedTaskStartRule.ruleName,
          },
          statistic: 'Sum',
          period: Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Scheduled ECS task startup failure detected in the last 5 minutes.',
      })
      failedTaskStartAlarm.addAlarmAction(new SnsAction(snsSubscriptions.opsTopic))
    }

    if (envName === 'dev' && devNightlyPauseEnabled) {
      const nightlyPauseDlq = new Queue(this, 'DevNightlyPauseSchedulerDlq', {
        queueName: `remit-scout-${envName}-nightly-pause-scheduler-dlq`,
        retentionPeriod: Duration.days(14),
      })

      const schedulerInvokeRole = new Role(this, 'DevNightlyPauseSchedulerRole', {
        assumedBy: new ServicePrincipal('scheduler.amazonaws.com'),
      })
      opsPause.controllerFunction.grantInvoke(schedulerInvokeRole)
      nightlyPauseDlq.grantSendMessages(schedulerInvokeRole)

      new CfnSchedule(this, 'DevNightlyPauseSchedule', {
        name: `remit-scout-${envName}-nightly-pause`,
        scheduleExpression: devNightlyPauseCron,
        scheduleExpressionTimezone: devNightlyPauseTimezone,
        flexibleTimeWindow: { mode: 'OFF' },
        state: 'ENABLED',
        target: {
          arn: opsPause.controllerFunction.functionArn,
          roleArn: schedulerInvokeRole.roleArn,
          input: JSON.stringify({ paused: true }),
          deadLetterConfig: { arn: nightlyPauseDlq.queueArn },
          retryPolicy: {
            maximumRetryAttempts: 2,
            maximumEventAgeInSeconds: 60 * 60,
          },
        },
      })

      new CfnSchedule(this, 'DevMorningResumeSchedule', {
        name: `remit-scout-${envName}-morning-resume`,
        scheduleExpression: devMorningResumeCron,
        scheduleExpressionTimezone: devNightlyPauseTimezone,
        flexibleTimeWindow: { mode: 'OFF' },
        state: 'ENABLED',
        target: {
          arn: opsPause.controllerFunction.functionArn,
          roleArn: schedulerInvokeRole.roleArn,
          input: JSON.stringify({ paused: false }),
          deadLetterConfig: { arn: nightlyPauseDlq.queueArn },
          retryPolicy: {
            maximumRetryAttempts: 2,
            maximumEventAgeInSeconds: 60 * 60,
          },
        },
      })

      const dlqAlarm = new Alarm(this, 'DevNightlyPauseSchedulerDlqAlarm', {
        alarmName: `remit-scout-${envName}-nightly-pause-scheduler-dlq`,
        metric: nightlyPauseDlq.metricApproximateNumberOfMessagesVisible({
          period: Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      })
      dlqAlarm.addAlarmAction(new SnsAction(snsSubscriptions.opsTopic))

      if (costGuardrailTopic) {
        costGuardrailTopic.addSubscription(new LambdaSubscription(opsPause.controllerFunction))
      }
    }

    if (envName === 'staging' && stagingBusinessHoursEnabled) {
      const businessHoursDlq = new Queue(this, 'StagingBusinessHoursSchedulerDlq', {
        queueName: `remit-scout-${envName}-business-hours-scheduler-dlq`,
        retentionPeriod: Duration.days(14),
      })

      const schedulerInvokeRole = new Role(this, 'StagingBusinessHoursSchedulerRole', {
        assumedBy: new ServicePrincipal('scheduler.amazonaws.com'),
      })
      opsPause.controllerFunction.grantInvoke(schedulerInvokeRole)
      businessHoursDlq.grantSendMessages(schedulerInvokeRole)

      new CfnSchedule(this, 'StagingBusinessHoursPauseSchedule', {
        name: `remit-scout-${envName}-business-hours-pause`,
        scheduleExpression: stagingPauseCron,
        scheduleExpressionTimezone: stagingTimezone,
        flexibleTimeWindow: { mode: 'OFF' },
        state: 'ENABLED',
        target: {
          arn: opsPause.controllerFunction.functionArn,
          roleArn: schedulerInvokeRole.roleArn,
          input: JSON.stringify({ paused: true }),
          deadLetterConfig: { arn: businessHoursDlq.queueArn },
          retryPolicy: {
            maximumRetryAttempts: 2,
            maximumEventAgeInSeconds: 60 * 60,
          },
        },
      })

      new CfnSchedule(this, 'StagingBusinessHoursResumeSchedule', {
        name: `remit-scout-${envName}-business-hours-resume`,
        scheduleExpression: stagingResumeCron,
        scheduleExpressionTimezone: stagingTimezone,
        flexibleTimeWindow: { mode: 'OFF' },
        state: 'ENABLED',
        target: {
          arn: opsPause.controllerFunction.functionArn,
          roleArn: schedulerInvokeRole.roleArn,
          input: JSON.stringify({ paused: false }),
          deadLetterConfig: { arn: businessHoursDlq.queueArn },
          retryPolicy: {
            maximumRetryAttempts: 2,
            maximumEventAgeInSeconds: 60 * 60,
          },
        },
      })

      const dlqAlarm = new Alarm(this, 'StagingBusinessHoursSchedulerDlqAlarm', {
        alarmName: `remit-scout-${envName}-business-hours-scheduler-dlq`,
        metric: businessHoursDlq.metricApproximateNumberOfMessagesVisible({
          period: Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      })
      dlqAlarm.addAlarmAction(new SnsAction(snsSubscriptions.opsTopic))
    }

    storage.bronzeBucket.grantReadWrite(iam.planeBEcsTaskRole)
    storage.exportsBucket.grantReadWrite(iam.planeALambdaRole)
    storage.exportsBucket.grantReadWrite(iam.planeBEcsTaskRole)
    storage.exportsBucket.grantWrite(iam.planeCLambdaRole, 'indices/*')
    storage.exportsBucket.grantWrite(iam.planeCLambdaRole, 'parquet/*')
    storage.userAssetsBucket.grantReadWrite(iam.planeALambdaRole)
    storage.auditLogsBucket.grantReadWrite(iam.planeALambdaRole)
    queues.quoteRefreshQueue.grantSendMessages(iam.planeALambdaRole)
    queues.quoteRefreshQueue.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.quoteRefreshDlq.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.quoteRefreshDlq.grantSendMessages(iam.planeBEcsTaskRole)
    queues.fxRateRefreshQueue.grantSendMessages(iam.planeALambdaRole)
    queues.fxRateRefreshQueue.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.fxRateRefreshDlq.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.fxRateRefreshDlq.grantSendMessages(iam.planeBEcsTaskRole)
    queues.exportJobQueue.grantSendMessages(iam.planeALambdaRole)
    queues.exportJobQueue.grantConsumeMessages(iam.planeALambdaRole)
    queues.exportJobQueue.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.exportJobDlq.grantSendMessages(iam.planeALambdaRole)
    queues.exportJobDlq.grantSendMessages(iam.planeBEcsTaskRole)
    queues.alertEvaluationQueue.grantSendMessages(iam.planeALambdaRole)
    queues.alertEvaluationQueue.grantConsumeMessages(iam.planeALambdaRole)
    queues.alertEvaluationQueue.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.alertEvaluationDlq.grantSendMessages(iam.planeALambdaRole)
    queues.alertEvaluationDlq.grantSendMessages(iam.planeBEcsTaskRole)
    queues.ingestFanoutQueue.grantSendMessages(iam.planeBEcsTaskRole)
    queues.ingestFanoutQueue.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.ingestFanoutDlq.grantSendMessages(iam.planeBEcsTaskRole)
    queues.ingestFanoutTier2Queue.grantSendMessages(iam.planeBEcsTaskRole)
    queues.ingestFanoutTier2Queue.grantConsumeMessages(iam.planeBEcsTaskRole)
    queues.ingestFanoutTier2Dlq.grantSendMessages(iam.planeBEcsTaskRole)
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
    new CfnOutput(this, 'NatGatewayCount', {
      value: String(natGateways ?? (envName === 'prod' ? 2 : 1)),
      description: 'Configured NAT gateway count for this environment',
    })
    new CfnOutput(this, 'InterfaceEndpointMode', {
      value: interfaceEndpointMode,
      description: 'VPC interface endpoint mode (all|minimal|none)',
    })
    if (envName === 'staging') {
      new CfnOutput(this, 'StagingInterfaceEndpointAllowlist', {
        value: resolvedStagingInterfaceEndpointAllowlist.join(','),
        description: 'Staging interface endpoint allowlist',
      })
    }
    new CfnOutput(this, 'ProviderProbeMode', {
      value: providerProbeMode,
      description: 'Provider probe scheduler mode (per_provider|fan_in)',
    })
    new CfnOutput(this, 'PublicSubnetIds', {
      value: networking.vpc.publicSubnets.map((subnet) => subnet.subnetId).join(','),
      description: 'Public subnet IDs',
    })
    if (networking.vpc.privateSubnets.length > 0) {
      new CfnOutput(this, 'PrivateSubnetIds', {
        value: networking.vpc.privateSubnets.map((subnet) => subnet.subnetId).join(','),
        description: 'Private subnet IDs',
      })
    }
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
    if (database.proxy) {
      new CfnOutput(this, 'RdsProxyEndpoint', {
        value: database.proxy.endpoint,
        description: 'RDS Proxy endpoint',
      })
    }
    new CfnOutput(this, 'PlaneADbConnectionRoute', {
      value: planeADbConnectionRoute,
      description: 'Plane A database connection route (proxy/direct)',
    })
    new CfnOutput(this, 'PlaneBDbConnectionRoute', {
      value: planeBDbConnectionRoute,
      description: 'Plane B database connection route (proxy/direct)',
    })
    new CfnOutput(this, 'PlaneCDbConnectionRoute', {
      value: planeCDbConnectionRoute,
      description: 'Plane C database connection route (proxy/direct)',
    })
    new CfnOutput(this, 'PlaneADbStatementTimeoutPolicy', {
      value: planeADbTimeoutPolicy,
      description: 'Plane A DB statement timeout policy',
    })
    new CfnOutput(this, 'PlaneBDbStatementTimeoutPolicy', {
      value: planeBDbTimeoutPolicy,
      description: 'Plane B DB statement timeout policy',
    })
    new CfnOutput(this, 'PlaneCDbStatementTimeoutPolicy', {
      value: planeCDbTimeoutPolicy,
      description: 'Plane C DB statement timeout policy',
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
    if (frontend) {
      const frontendUrl = frontendDomainName
        ? `https://${frontendDomainName}`
        : `https://${frontend.distribution.distributionDomainName}`
      new CfnOutput(this, 'FrontendBucketName', {
        value: frontend.bucket.bucketName,
        description: 'Frontend S3 Bucket Name',
      })
      new CfnOutput(this, 'FrontendDistributionId', {
        value: frontend.distribution.distributionId,
        description: 'Frontend CloudFront Distribution ID',
      })
      new CfnOutput(this, 'FrontendDistributionDomain', {
        value: frontend.distribution.distributionDomainName,
        description: 'Frontend CloudFront Distribution Domain',
      })
      new CfnOutput(this, 'FrontendUrl', {
        value: frontendUrl,
        description: 'Frontend URL',
      })
    }
    if (pinpoint) {
      new CfnOutput(this, 'PinpointAppId', {
        value: pinpoint.pinpointAppId,
        description: 'Amazon Pinpoint application ID for newsletter campaigns',
      })
    }
    if (snowflakePartnerRole) {
      new CfnOutput(this, 'SnowflakePartnerRoleArn', {
        value: snowflakePartnerRole.roleArn,
        description: 'IAM role ARN for Snowflake partner access',
      })
    }
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
    new CfnOutput(this, 'FxRateRefreshQueueUrl', {
      value: queues.fxRateRefreshQueue.queueUrl,
      description: 'FX rate refresh SQS queue URL',
    })
    new CfnOutput(this, 'FxRateRefreshDlqUrl', {
      value: queues.fxRateRefreshDlq.queueUrl,
      description: 'FX rate refresh DLQ URL',
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
    new CfnOutput(this, 'IngestFanoutTier2QueueUrl', {
      value: queues.ingestFanoutTier2Queue.queueUrl,
      description: 'Tier 2 ingestion fanout queue URL',
    })
    new CfnOutput(this, 'IngestFanoutTier2DlqUrl', {
      value: queues.ingestFanoutTier2Dlq.queueUrl,
      description: 'Tier 2 ingestion fanout DLQ URL',
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
    new CfnOutput(this, 'DbMigrateTaskDefinitionArn', {
      value: tasks.dbMigrateTask.taskDefinitionArn,
      description: 'ECS task definition ARN for database migrations',
    })
    new CfnOutput(this, 'PlaneAApiUrl', {
      value: api.planeAApi.apiEndpoint,
      description: 'Plane A HTTP API endpoint',
    })
    new CfnOutput(this, 'PlaneCApiUrl', {
      value: planeCBaseUrl ?? api.planeCApi.apiEndpoint,
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
    if (backup) {
      new CfnOutput(this, 'BackupVaultName', {
        value: backup.vault.backupVaultName,
        description: 'AWS Backup vault name for database backups',
      })
      new CfnOutput(this, 'BackupAlertsTopicArn', {
        value: backup.notificationTopic.topicArn,
        description: 'SNS topic for backup/restore failure alerts',
      })
    }
    if (costGuardrails) {
      if (costGuardrails.curBucket) {
        new CfnOutput(this, 'CurBucketName', {
          value: costGuardrails.curBucket.bucketName,
          description: 'S3 bucket for Cost and Usage Reports',
        })
      }
      if (costGuardrails.curReport) {
        new CfnOutput(this, 'CurReportName', {
          value: costGuardrails.curReport.reportName,
          description: 'Cost and Usage Report name',
        })
      }
    }
    if (monitoring) {
      new CfnOutput(this, 'CloudWatchDashboardName', {
        value: monitoring.dashboard.dashboardName,
        description: 'CloudWatch dashboard name',
      })
      new CfnOutput(this, 'CloudWatchAlertsTopicArn', {
        value: monitoring.criticalTopic.topicArn,
        description: 'SNS topic for CloudWatch alarms',
      })
    }
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
    if (synthetics?.canaries.length) {
      new CfnOutput(this, 'SyntheticsCanaryNames', {
        value: synthetics.canaries.map((c) => c.name!).join(','),
        description: 'CloudWatch Synthetics canary names',
      })
    }
  }
}
