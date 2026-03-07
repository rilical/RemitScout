import type { NestedStackProps } from 'aws-cdk-lib'
import type { CpuArchitecture } from 'aws-cdk-lib/aws-ecs'
import type { Architecture } from 'aws-cdk-lib/aws-lambda'

import type { ApiResources } from '../api'
import type { BackupOptions, BackupResources } from '../backup'
import type { CostGuardrailsOptions, CostGuardrailsResources } from '../budgets'
import type { CacheResources } from '../cache'
import type { ComputeResources } from '../compute'
import type { DatabaseResources } from '../database'
import type { EcsServiceOptions, EcsServiceResources } from '../ecs-services'
import type { EcsTaskOptions, EcsTaskResources } from '../ecs-tasks'
import type { FrontendOptions, FrontendResources } from '../frontend'
import type { IamResources } from '../iam'
import type { MonitoringResources } from '../monitoring'
import type { OpsPauseOptions, OpsPauseResources } from '../ops-pause'
import type { PipelineOptions, PipelineResources } from '../pipeline'
import type { PinpointResources } from '../pinpoint'
import type { QueueResources } from '../queues'
import type { RegistryResources } from '../registry'
import type { ScheduledJobsOptions } from '../scheduled-jobs'
import type { SnsSubscriptionOptions, SnsSubscriptionResources } from '../sns-subscriptions'
import type { StorageResources } from '../storage'
import type { SyntheticsResources } from '../synthetics'
import type { NetworkingResources } from '../vpc'

export type FoundationResources = {
  networking: NetworkingResources
  iam: IamResources
  registry: RegistryResources
  database: DatabaseResources
  cache: CacheResources
  storage: StorageResources
  queues: QueueResources
  pinpoint: PinpointResources | null
  redisUrl: string
}

export type FoundationNestedStackProps = NestedStackProps & {
  envName: string
  networking: NetworkingResources
  importExistingBackendRepository?: boolean
  redisAuthMode?: 'legacy' | 'required'
  sharedSecretArn: string
  sesIdentityArns: string[]
  snsTopicArns: string[]
  enableDbProxy: boolean
  enableGithubActionsOidc: boolean
  githubRepoOwner: string
  githubRepoName: string
  githubActionsOidcProviderArn?: string
  exportsPrefix: string
  pinpointEnabled: boolean
  pinpointFromAddress?: string
}

export type RuntimeNestedStackProps = NestedStackProps & {
  envName: string
  imageTag: string
  minimalMode: boolean
  paused: boolean
  cpuArchitecture: CpuArchitecture
  newRelicAwsMetricStreamEnabled?: boolean
  newRelicAwsLogForwardingEnabled?: boolean
  foundation: FoundationResources
  taskOptions: Omit<
    EcsTaskOptions,
    'envName' | 'minimalMode' | 'backendRepository' | 'imageTag' | 'roles' | 'cpuArchitecture'
  >
  serviceOptions: Omit<
    EcsServiceOptions,
    | 'envName'
    | 'cluster'
    | 'planeASecurityGroup'
    | 'planeCSecurityGroup'
    | 'planeBSecurityGroup'
    | 'planeATask'
    | 'planeCTask'
    | 'planeBIngestTask'
    | 'b2cRefreshTask'
    | 'fxRateRefreshTask'
    | 'ingestFanoutTier1Task'
    | 'ingestFanoutTier2Task'
    | 'goldLiveTask'
    | 'notificationsQueueTask'
    | 'opsAlertsQueueTask'
    | 'alertEvaluationTask'
    | 'exportWorkerTask'
    | 'agentOrchestratorTask'
    | 'stressResponderTask'
    | 'normalizationWorkerTask'
    | 'queues'
    | 'paused'
    | 'minimalMode'
  >
}

export type RuntimeResources = {
  compute: ComputeResources
  tasks: EcsTaskResources
  ecsServices: EcsServiceResources
}

export type EdgeNestedStackProps = NestedStackProps & {
  envName: string
  api: ApiResources
  frontendOptions: Omit<FrontendOptions, 'envName' | 'planeAWaf' | 'planeACloudFrontDomain'>
  defaultFrontendBaseUrl?: string
  pinpointAppId?: string
}

export type EdgeResources = {
  api: ApiResources
  frontend: FrontendResources | null
}

export type OpsNestedStackProps = NestedStackProps & {
  envName: string
  minimalMode: boolean
  enableSynthetics: boolean
  enableMonitoring: boolean
  enableComplianceServices: boolean
  pipelineEnabled: boolean
  foundation: FoundationResources
  runtime: RuntimeResources
  edge: EdgeResources
  snsOptions: Omit<SnsSubscriptionOptions, 'envName'>
  backupOptions: Omit<BackupOptions, 'envName' | 'cluster' | 'dbSecurityGroup'>
  costGuardrailsOptions: Omit<CostGuardrailsOptions, 'envName'>
  pipelineOptions: Omit<
    PipelineOptions,
    | 'envName'
    | 'backendRepository'
    | 'frontendBucket'
    | 'frontendDistribution'
    | 'planeACloudFrontDomain'
    | 'planeAApiEndpoint'
  >
  scheduledJobsOptions: Omit<
    ScheduledJobsOptions,
    | 'envName'
    | 'vpc'
    | 'roles'
    | 'cluster'
    | 'b2cRefreshTask'
    | 'fxRateRefreshTask'
    | 'b2bSweepSchedulerTask'
    | 'agentOrchestratorTask'
    | 'stressResponderTask'
    | 'normalizationWorkerTask'
    | 'discoveryTask'
    | 'planeASecurityGroup'
    | 'planeBSecurityGroup'
    | 'planeCSecurityGroup'
  >
  opsPauseOptions: Omit<OpsPauseOptions, 'envName' | 'clusterName' | 'role'>
}

export type OpsResources = {
  snsSubscriptions: SnsSubscriptionResources
  backup: BackupResources | null
  costGuardrails: CostGuardrailsResources | null
  monitoring?: MonitoringResources
  synthetics?: SyntheticsResources
  pipeline: PipelineResources | null
  opsPause: OpsPauseResources
}

export type ResolvedArchitecture = {
  cpu: CpuArchitecture
  lambda: Architecture
}
