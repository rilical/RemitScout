import { z } from 'zod'
import type { Construct } from 'constructs'

const toOptionalBool = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase()
    if (['1', 'true', 'yes'].includes(lowered)) return true
    if (['0', 'false', 'no'].includes(lowered)) return false
  }
  return undefined
}

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const toStringList = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean)
  return []
}

const optionalBool = z.preprocess((value: unknown) => toOptionalBool(value), z.boolean().optional())
const optionalNumber = z.preprocess((value: unknown) => toOptionalNumber(value), z.number().optional())
const optionalStringList = z.preprocess((value: unknown) => toStringList(value), z.array(z.string()).optional())

const queueMode = z.enum(['off', 'queue', 'shadow'])
const cpuArchitecture = z.enum(['arm64', 'x86_64', 'x86', 'amd64'])
const providerProbeMode = z.enum(['per_provider', 'fan_in'])
const interfaceEndpointsMode = z.enum(['all', 'minimal', 'none'])

const cdkContextShape = {
  // Core
  env: z.enum(['dev', 'staging', 'prod']).optional(),
  backendImageTag: z.string().min(1).optional(),
  tagOwner: z.string().min(1).optional(),
  cpuArchitecture: cpuArchitecture.optional(),
  planeCBaseUrl: z.string().optional(),
  otelLambdaLayerArn: z.string().optional(),

  // Secret / parameter wiring
  sharedSecretArn: z.string().min(1).optional(),
  devSharedSecretArn: z.string().min(1).optional(),
  planeADbSecretArn: z.string().optional(),
  planeADbSecretJsonKey: z.string().optional(),
  planeADbSsmName: z.string().optional(),
  planeBDbSecretArn: z.string().optional(),
  planeBDbSsmName: z.string().optional(),
  planeCDbSecretArn: z.string().optional(),
  planeCDbSecretJsonKey: z.string().optional(),
  planeCDbSsmName: z.string().optional(),
  redisSecretArn: z.string().optional(),
  redisSecretJsonKey: z.string().optional(),
  redisSsmName: z.string().optional(),
  supabaseSecretArn: z.string().optional(),
  supabaseSsmName: z.string().optional(),
  stripeSecretArn: z.string().optional(),
  stripeSsmName: z.string().optional(),
  communicationsSecretArn: z.string().optional(),
  sentrySecretArn: z.string().optional(),
  sentrySecretJsonKey: z.string().optional(),
  oandaSecretArn: z.string().optional(),
  oandaSsmName: z.string().optional(),
  proxyResidentialSecretArn: z.string().optional(),
  proxyResidentialSecretJsonKey: z.string().optional(),
  proxyResidentialSsmName: z.string().optional(),
  proxyResidentialUrl: z.string().optional(),
  proxyDatacenterSecretArn: z.string().optional(),
  proxyDatacenterSecretJsonKey: z.string().optional(),
  proxyDatacenterSsmName: z.string().optional(),
  proxyDatacenterUrl: z.string().optional(),

  // Feature toggles / environment posture
  devPaused: optionalBool,
  enableDbProxy: optionalBool,
  enableBackup: optionalBool,
  enableFrontend: optionalBool,
  enableCostGuardrails: optionalBool,
  costGuardrailsCreateCur: optionalBool,
  enableGithubActionsOidc: optionalBool,
  enableCloudFront: optionalBool,
  devMinimalInfra: optionalBool,
  devNightlyPauseEnabled: optionalBool,
  devNightlyPauseTimezone: z.string().optional(),
  devNightlyPauseCron: z.string().optional(),
  enableWaf: optionalBool,
  enablePlaneAJwtAuth: optionalBool,
  enablePlaneCIamAuth: optionalBool,
  disablePlaneAExecuteEndpoint: optionalBool,
  disablePlaneCExecuteEndpoint: optionalBool,
  wafEnableBotControl: optionalBool,
  planeBB2cRefreshServiceEnabled: optionalBool,
  planeBFxRateRefreshServiceEnabled: optionalBool,
  planeBB2cQueueInSweep: optionalBool,
  planeBDisableTier1: optionalBool,
  alertEvaluationServiceEnabled: optionalBool,
  exportServiceEnabled: optionalBool,
  planeBQueueWorkerSpotOnly: optionalBool,
  publicAdsEnabled: optionalBool,
  publicPulseEnabled: optionalBool,
  pipelineEnabled: optionalBool,
  pipelineEnableDeploy: optionalBool,
  pipelineRequireApproval: optionalBool,
  devMorningResumeCron: z.string().optional(),
  providerProbeMode: providerProbeMode.optional(),
  stagingInterfaceEndpointsMode: interfaceEndpointsMode.optional(),
  prodInterfaceEndpointsMode: interfaceEndpointsMode.optional(),

  // Queue / worker mode controls
  planeBIngestFanoutMode: queueMode.optional(),
  goldLiveQueueMode: queueMode.optional(),
  planeBNotificationsMode: queueMode.optional(),
  planeBOpsAlertsMode: queueMode.optional(),
  quoteRefreshQueueMode: queueMode.optional(),
  fxRateRefreshQueueMode: queueMode.optional(),
  exportJobQueueMode: queueMode.optional(),
  planeBIngestFanoutMessageMode: z.enum(['corridor', 'provider']).optional(),
  planeBB2bObservationMode: z.string().optional(),

  // Numeric capacity / throttling knobs
  devNatGateways: optionalNumber,
  stagingNatGateways: optionalNumber,
  prodNatGateways: optionalNumber,
  costBudgetAmountUsd: optionalNumber,
  costAnomalyThresholdUsd: optionalNumber,
  planeBB2bTargetMinutes: optionalNumber,
  planeBB2bMaxQueueDepth: optionalNumber,
  planeBIngestDesiredCount: optionalNumber,
  planeBB2cRefreshDesiredCount: optionalNumber,
  planeBFxRateRefreshDesiredCount: optionalNumber,
  goldIndicesLookbackDays: optionalNumber,
  providerWeightWindowDays: optionalNumber,
  institutionalExportFormat: z.string().optional(),
  institutionalExportWriteManifest: optionalBool,
  planeBIngestFanoutTier1DesiredCount: optionalNumber,
  planeBIngestFanoutTier2DesiredCount: optionalNumber,
  goldLiveDesiredCount: optionalNumber,
  planeBNotificationsDesiredCount: optionalNumber,
  planeBOpsAlertsDesiredCount: optionalNumber,
  alertEvaluationDesiredCount: optionalNumber,
  exportWorkerDesiredCount: optionalNumber,
  planeBQueueWorkerDesiredCount: optionalNumber,
  planeBQueueWorkerMaxCount: optionalNumber,
  planeAThrottleRate: optionalNumber,
  planeAThrottleBurst: optionalNumber,
  planeCThrottleRate: optionalNumber,
  planeCThrottleBurst: optionalNumber,
  planeAB2cMaxBucketDeltaPct: optionalNumber,

  // IAM / pipeline
  githubRepoOwner: z.string().optional(),
  githubRepoName: z.string().optional(),
  pipelineRepoOwner: z.string().optional(),
  pipelineRepoName: z.string().optional(),
  pipelineRepoBranch: z.string().optional(),
  githubActionsOidcProviderArn: z.string().optional(),
  pipelineConnectionArn: z.string().optional(),

  // CORS / auth settings
  planeAJwtIssuer: z.string().optional(),
  planeAJwtAudiences: optionalStringList,
  planeAAdminEmails: optionalStringList,
  planeACorsOrigins: optionalStringList,
  planeACorsAllowedHeaders: optionalStringList,
  planeACorsAllowedMethods: optionalStringList,
  planeACorsAllowCredentials: optionalBool,

  // Storage prefixes
  bronzePrefix: z.string().optional(),
  exportsPrefix: z.string().optional(),
  userAssetsPrefix: z.string().optional(),
  auditLogsPrefix: z.string().optional(),

  // Snowflake partner access
  snowflakePartnerAccountIds: optionalStringList,
  snowflakePartnerExternalId: z.string().optional(),
  snowflakePartnerRoleName: z.string().optional(),

  // Frontend/public values
  frontendDomainName: z.string().optional(),
  frontendBaseUrl: z.string().optional(),
  frontendCertificateArn: z.string().optional(),
  frontendHostedZoneId: z.string().optional(),
  frontendHostedZoneName: z.string().optional(),
  publicSupabaseUrl: z.string().optional(),
  publicSupabaseAnonKey: z.string().optional(),
  publicGa4MeasurementId: z.string().optional(),
  publicMetaPixelId: z.string().optional(),
  publicSupabaseUrlSecretJsonKey: z.string().optional(),
  publicSupabaseAnonKeySecretJsonKey: z.string().optional(),

  // WAF/network controls
  wafAllowListIps: optionalStringList,
  wafBlockListIps: optionalStringList,
  wafStripeWebhookAllowListIps: optionalStringList,
  wafAdminAllowListIps: optionalStringList,

  // Notifications/ops integration
  costAlertEmails: optionalStringList,
  sesIdentityArns: optionalStringList,
  snsTopicArns: optionalStringList,
  slackWebhookUrl: z.string().optional(),
  slackWorkspaceId: z.string().optional(),
  slackCriticalChannelId: z.string().optional(),
  slackWarningChannelId: z.string().optional(),
  slackOpsChannelId: z.string().optional(),
  pagerDutyIntegrationKey: z.string().optional(),
  opsPauseRuleAllowlist: optionalStringList,
  opsResumeRuleAllowlist: optionalStringList,
  purgeQueuesOnResume: optionalBool,
  purgeQueueAllowlist: optionalStringList,

  // Route53 custom domains (optional)
  planeADomainName: z.string().optional(),
  planeACertificateArn: z.string().optional(),
  planeAHostedZoneId: z.string().optional(),
  planeAHostedZoneName: z.string().optional(),
} satisfies Record<string, z.ZodTypeAny>

export const cdkContextSchema = z.object(cdkContextShape).strict()

export type CdkContextConfig = z.infer<typeof cdkContextSchema>

const isCdkReservedContextKey = (key: string): boolean => (
  key.startsWith('@') ||
  key.startsWith('aws:') ||
  key.startsWith('availability-zones:')
)

const normalizeContext = (node: Construct['node']): Record<string, unknown> => {
  const all = node.getAllContext() as Record<string, unknown>
  const filtered: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(all)) {
    if (isCdkReservedContextKey(key)) continue
    filtered[key] = value
  }
  return filtered
}

export const loadCdkContextConfig = (node: Construct['node']): CdkContextConfig => {
  const raw = normalizeContext(node)
  return cdkContextSchema.parse(raw)
}
