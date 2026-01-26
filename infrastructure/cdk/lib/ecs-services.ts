import { Duration } from 'aws-cdk-lib'
import { DeploymentCircuitBreaker, FargateService } from 'aws-cdk-lib/aws-ecs'
import { SubnetType, type SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import type { Cluster, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs'
import type { Construct } from 'constructs'
import type { QueueResources } from './queues'

export type EcsServiceResources = {
  planeBIngestService: FargateService
  b2cRefreshService: FargateService
  ingestFanoutService: FargateService
  goldLiveService: FargateService
  notificationsQueueService: FargateService
  opsAlertsQueueService: FargateService
}

export type EcsServiceOptions = {
  envName: string
  cluster: Cluster
  planeBSecurityGroup: SecurityGroup
  planeBIngestTask: FargateTaskDefinition
  b2cRefreshTask: FargateTaskDefinition
  ingestFanoutTask: FargateTaskDefinition
  goldLiveTask: FargateTaskDefinition
  notificationsQueueTask: FargateTaskDefinition
  opsAlertsQueueTask: FargateTaskDefinition
  queues: QueueResources
  ingestFanoutMode?: string
  goldLiveMode?: string
  notificationsMode?: string
  opsAlertsMode?: string
  planeBIngestDesiredCount?: number
  queueWorkerDesiredCount?: number
  queueWorkerMaxCount?: number
  b2cRefreshDesiredCount?: number
  queueWorkerSpotOnly?: boolean
  paused?: boolean
}

export const createEcsServices = (
  scope: Construct,
  options: EcsServiceOptions,
): EcsServiceResources => {
  const isDev = options.envName === 'dev'
  const isProd = options.envName === 'prod'
  const isPaused = options.paused === true

  const baseIngestDesired = isProd ? 1 : 0
  const baseQueueDesired = isProd ? 1 : 0
  const baseB2cRefreshDesired = isProd ? 1 : 0

  const planeBIngestDesired = isPaused
    ? 0
    : (options.planeBIngestDesiredCount ?? baseIngestDesired)
  const queueWorkerDesired = isPaused
    ? 0
    : (options.queueWorkerDesiredCount ?? baseQueueDesired)
  const b2cRefreshDesired = isPaused
    ? 0
    : (options.b2cRefreshDesiredCount ?? baseB2cRefreshDesired)

  const spotOnly = options.queueWorkerSpotOnly ?? isDev
  const spotCapacityProviderStrategies = spotOnly
    ? [{ capacityProvider: 'FARGATE_SPOT', weight: 1 }]
    : isProd
      ? [
          { capacityProvider: 'FARGATE', base: 1, weight: 1 },
          { capacityProvider: 'FARGATE_SPOT', weight: 2 },
        ]
      : [{ capacityProvider: 'FARGATE_SPOT', weight: 1 }]

  const enableExecuteCommand = !isProd
  const usePublicSubnets = isDev
  const subnetType = usePublicSubnets ? SubnetType.PUBLIC : SubnetType.PRIVATE_WITH_EGRESS
  const minHealthyPercent = isDev ? 0 : undefined
  const maxHealthyPercent = isDev ? 200 : undefined

  const circuitBreaker: DeploymentCircuitBreaker = {
    enable: true,
    rollback: true,
  }

  const planeBIngestService = new FargateService(scope, 'PlaneBIngestService', {
    cluster: options.cluster,
    taskDefinition: options.planeBIngestTask,
    desiredCount: planeBIngestDesired,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })

  const b2cRefreshService = new FargateService(scope, 'B2cRefreshWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.b2cRefreshTask,
    desiredCount: b2cRefreshDesired,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })

  const ingestFanoutService = new FargateService(scope, 'IngestFanoutWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.ingestFanoutTask,
    desiredCount:
      options.ingestFanoutMode === 'queue' && !isPaused ? queueWorkerDesired : 0,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })

  const goldLiveService = new FargateService(scope, 'GoldLiveWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.goldLiveTask,
    desiredCount:
      options.goldLiveMode === 'queue' && !isPaused ? queueWorkerDesired : 0,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })

  const notificationsQueueService = new FargateService(
    scope,
    'NotificationsQueueWorkerService',
    {
      cluster: options.cluster,
      taskDefinition: options.notificationsQueueTask,
      desiredCount:
        options.notificationsMode === 'queue' && !isPaused ? queueWorkerDesired : 0,
      assignPublicIp: usePublicSubnets,
      vpcSubnets: { subnetType },
      securityGroups: [options.planeBSecurityGroup],
      capacityProviderStrategies: spotCapacityProviderStrategies,
      enableExecuteCommand,
      circuitBreaker,
      minHealthyPercent,
      maxHealthyPercent,
    },
  )

  const opsAlertsQueueService = new FargateService(scope, 'OpsAlertsQueueWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.opsAlertsQueueTask,
    desiredCount:
      options.opsAlertsMode === 'queue' && !isPaused ? queueWorkerDesired : 0,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })

  const scaleMax = options.queueWorkerMaxCount ?? (isDev ? 5 : 10)
  const scaleDefaults = isPaused
    ? { min: 0, max: 0, targetValue: isProd ? 25 : 20 }
    : {
        min: isDev ? 0 : (isProd ? 2 : 1),
        max: Math.max(queueWorkerDesired, scaleMax),
        targetValue: isProd ? 25 : 20,
      }
  const scaleInCooldown = isDev ? Duration.minutes(5) : Duration.minutes(3)
  const scaleOutCooldown = isDev ? Duration.minutes(2) : Duration.minutes(1)

  if (!isPaused && options.ingestFanoutMode === 'queue') {
    const scaling = ingestFanoutService.autoScaleTaskCount({
      minCapacity: scaleDefaults.min,
      maxCapacity: scaleDefaults.max,
    })
    scaling.scaleToTrackCustomMetric('IngestFanoutQueueDepth', {
      metric: options.queues.ingestFanoutQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue: scaleDefaults.targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
  }

  if (!isPaused && options.goldLiveMode === 'queue') {
    const scaling = goldLiveService.autoScaleTaskCount({
      minCapacity: scaleDefaults.min,
      maxCapacity: scaleDefaults.max,
    })
    scaling.scaleToTrackCustomMetric('GoldLiveQueueDepth', {
      metric: options.queues.goldLiveQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue: scaleDefaults.targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
  }

  if (!isPaused && options.notificationsMode === 'queue') {
    const scaling = notificationsQueueService.autoScaleTaskCount({
      minCapacity: scaleDefaults.min,
      maxCapacity: scaleDefaults.max,
    })
    scaling.scaleToTrackCustomMetric('NotificationsQueueDepth', {
      metric: options.queues.notificationsQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue: scaleDefaults.targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
  }

  if (!isPaused && options.opsAlertsMode === 'queue') {
    const scaling = opsAlertsQueueService.autoScaleTaskCount({
      minCapacity: scaleDefaults.min,
      maxCapacity: scaleDefaults.max,
    })
    scaling.scaleToTrackCustomMetric('OpsAlertsQueueDepth', {
      metric: options.queues.opsAlertsQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue: scaleDefaults.targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
  }

  return {
    planeBIngestService,
    b2cRefreshService,
    ingestFanoutService,
    goldLiveService,
    notificationsQueueService,
    opsAlertsQueueService,
  }
}
