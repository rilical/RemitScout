import { Duration, Tags } from 'aws-cdk-lib'
import { DeploymentCircuitBreaker, FargateService } from 'aws-cdk-lib/aws-ecs'
import { SubnetType, type SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import type { Cluster, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs'
import type { Construct } from 'constructs'
import type { QueueResources } from './queues'

export type EcsServiceResources = {
  planeBIngestService: FargateService
  b2cRefreshService: FargateService
  fxRateRefreshService: FargateService
  ingestFanoutTier1Service: FargateService
  ingestFanoutTier2Service: FargateService
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
  fxRateRefreshTask: FargateTaskDefinition
  ingestFanoutTier1Task: FargateTaskDefinition
  ingestFanoutTier2Task: FargateTaskDefinition
  goldLiveTask: FargateTaskDefinition
  notificationsQueueTask: FargateTaskDefinition
  opsAlertsQueueTask: FargateTaskDefinition
  queues: QueueResources
  ingestFanoutMode?: string
  quoteRefreshMode?: string
  fxRateRefreshMode?: string
  goldLiveMode?: string
  notificationsMode?: string
  opsAlertsMode?: string
  planeBIngestDesiredCount?: number
  queueWorkerDesiredCount?: number
  queueWorkerMaxCount?: number
  b2cRefreshDesiredCount?: number
  fxRateRefreshDesiredCount?: number
  ingestFanoutTier1DesiredCount?: number
  ingestFanoutTier2DesiredCount?: number
  goldLiveDesiredCount?: number
  notificationsDesiredCount?: number
  opsAlertsDesiredCount?: number
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
  const baseFxRateRefreshDesired = isProd ? 1 : 0

  const planeBIngestDesired = isPaused
    ? 0
    : (options.planeBIngestDesiredCount ?? baseIngestDesired)
  const queueWorkerDesired = isPaused
    ? 0
    : (options.queueWorkerDesiredCount ?? baseQueueDesired)
  const b2cRefreshDesired = isPaused
    ? 0
    : (options.b2cRefreshDesiredCount ?? baseB2cRefreshDesired)
  const fxRateRefreshDesired = isPaused
    ? 0
    : (options.fxRateRefreshDesiredCount ?? baseFxRateRefreshDesired)
  const ingestFanoutTier1Desired = isPaused
    ? 0
    : (options.ingestFanoutTier1DesiredCount ?? queueWorkerDesired)
  const ingestFanoutTier2Desired = isPaused
    ? 0
    : (options.ingestFanoutTier2DesiredCount ?? Math.max(0, ingestFanoutTier1Desired - 1))
  const goldLiveDesired = isPaused
    ? 0
    : (options.goldLiveDesiredCount ?? queueWorkerDesired)
  const notificationsDesired = isPaused
    ? 0
    : (options.notificationsDesiredCount ?? queueWorkerDesired)
  const opsAlertsDesired = isPaused
    ? 0
    : (options.opsAlertsDesiredCount ?? queueWorkerDesired)

  const spotOnly = options.queueWorkerSpotOnly ?? isDev
  const spotCapacityProviderStrategies = spotOnly
    ? [{ capacityProvider: 'FARGATE_SPOT', weight: 1 }]
    : isProd
      ? [
          { capacityProvider: 'FARGATE', base: 1, weight: 1 },
          { capacityProvider: 'FARGATE_SPOT', weight: 2 },
        ]
      : [{ capacityProvider: 'FARGATE', base: 1, weight: 1 }]

  const enableExecuteCommand = !isProd
  const usePublicSubnets = isDev
  const subnetType = usePublicSubnets ? SubnetType.PUBLIC : SubnetType.PRIVATE_WITH_EGRESS
  const minHealthyPercent = isDev ? 0 : undefined
  const maxHealthyPercent = isDev ? 200 : undefined

  const circuitBreaker: DeploymentCircuitBreaker = {
    enable: true,
    rollback: true,
  }

  const tagManaged = (service: FargateService): void => {
    Tags.of(service).add('managed-by', 'ops-pause')
    Tags.of(service).add('environment', options.envName)
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
  tagManaged(planeBIngestService)

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

  const fxRateRefreshService = new FargateService(scope, 'FxRateRefreshWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.fxRateRefreshTask,
    desiredCount: fxRateRefreshDesired,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })
  tagManaged(b2cRefreshService)

  const ingestFanoutTier1Service = new FargateService(scope, 'IngestFanoutTier1WorkerService', {
    cluster: options.cluster,
    taskDefinition: options.ingestFanoutTier1Task,
    desiredCount:
      options.ingestFanoutMode === 'queue' && !isPaused ? ingestFanoutTier1Desired : 0,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })
  tagManaged(ingestFanoutTier1Service)

  const ingestFanoutTier2Service = new FargateService(scope, 'IngestFanoutTier2WorkerService', {
    cluster: options.cluster,
    taskDefinition: options.ingestFanoutTier2Task,
    desiredCount:
      options.ingestFanoutMode === 'queue' && !isPaused ? ingestFanoutTier2Desired : 0,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })
  tagManaged(ingestFanoutTier2Service)

  const goldLiveService = new FargateService(scope, 'GoldLiveWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.goldLiveTask,
    desiredCount:
      options.goldLiveMode === 'queue' && !isPaused ? goldLiveDesired : 0,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })
  tagManaged(goldLiveService)

  const notificationsQueueService = new FargateService(
    scope,
    'NotificationsQueueWorkerService',
    {
      cluster: options.cluster,
      taskDefinition: options.notificationsQueueTask,
      desiredCount:
        options.notificationsMode === 'queue' && !isPaused ? notificationsDesired : 0,
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
  tagManaged(notificationsQueueService)

  const opsAlertsQueueService = new FargateService(scope, 'OpsAlertsQueueWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.opsAlertsQueueTask,
    desiredCount:
      options.opsAlertsMode === 'queue' && !isPaused ? opsAlertsDesired : 0,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })
  tagManaged(opsAlertsQueueService)

  const scaleMax = options.queueWorkerMaxCount ?? (isDev ? 5 : 10)
  const targetValue = isProd ? 25 : 20
  const resolveScaleBounds = (desired: number) => {
    if (isPaused) {
      return { min: 0, max: 0 }
    }
    const minCapacity = isDev ? 0 : (desired > 0 ? Math.max(1, desired) : 0)
    return {
      min: minCapacity,
      max: Math.max(desired, scaleMax),
    }
  }
  const scaleInCooldown = isDev ? Duration.minutes(5) : Duration.minutes(3)
  const scaleOutCooldown = isDev ? Duration.minutes(2) : Duration.minutes(1)
  const defaultQueueAgeTargetSeconds = isProd ? 120 : 300

  if (!isPaused && options.quoteRefreshMode === 'queue') {
    const b2cBounds = resolveScaleBounds(b2cRefreshDesired)
    const b2cScaling = b2cRefreshService.autoScaleTaskCount({
      minCapacity: b2cBounds.min,
      maxCapacity: b2cBounds.max,
    })
    b2cScaling.scaleToTrackCustomMetric('B2cRefreshQueueDepth', {
      metric: options.queues.quoteRefreshQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
    b2cScaling.scaleToTrackCustomMetric('B2cRefreshQueueAge', {
      metric: options.queues.quoteRefreshQueue.metricApproximateAgeOfOldestMessage(),
      targetValue: defaultQueueAgeTargetSeconds,
      scaleInCooldown,
      scaleOutCooldown,
    })
  }

  if (!isPaused && options.fxRateRefreshMode === 'queue') {
    const fxBounds = resolveScaleBounds(fxRateRefreshDesired)
    const fxScaling = fxRateRefreshService.autoScaleTaskCount({
      minCapacity: fxBounds.min,
      maxCapacity: fxBounds.max,
    })
    fxScaling.scaleToTrackCustomMetric('FxRateRefreshQueueDepth', {
      metric: options.queues.fxRateRefreshQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
    fxScaling.scaleToTrackCustomMetric('FxRateRefreshQueueAge', {
      metric: options.queues.fxRateRefreshQueue.metricApproximateAgeOfOldestMessage(),
      targetValue: defaultQueueAgeTargetSeconds,
      scaleInCooldown,
      scaleOutCooldown,
    })
  }

  if (!isPaused && options.ingestFanoutMode === 'queue') {
    const ingestFanoutAgeTargetSeconds = isProd ? 300 : 600
    const tier1Bounds = resolveScaleBounds(ingestFanoutTier1Desired)
    const tier1Scaling = ingestFanoutTier1Service.autoScaleTaskCount({
      minCapacity: tier1Bounds.min,
      maxCapacity: tier1Bounds.max,
    })
    tier1Scaling.scaleToTrackCustomMetric('IngestFanoutTier1QueueDepth', {
      metric: options.queues.ingestFanoutQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
    tier1Scaling.scaleToTrackCustomMetric('IngestFanoutTier1QueueAge', {
      metric: options.queues.ingestFanoutQueue.metricApproximateAgeOfOldestMessage(),
      targetValue: ingestFanoutAgeTargetSeconds,
      scaleInCooldown,
      scaleOutCooldown,
    })

    const tier2Bounds = resolveScaleBounds(ingestFanoutTier2Desired)
    const tier2Scaling = ingestFanoutTier2Service.autoScaleTaskCount({
      minCapacity: tier2Bounds.min,
      maxCapacity: tier2Bounds.max,
    })
    tier2Scaling.scaleToTrackCustomMetric('IngestFanoutTier2QueueDepth', {
      metric: options.queues.ingestFanoutTier2Queue.metricApproximateNumberOfMessagesVisible(),
      targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
    tier2Scaling.scaleToTrackCustomMetric('IngestFanoutTier2QueueAge', {
      metric: options.queues.ingestFanoutTier2Queue.metricApproximateAgeOfOldestMessage(),
      targetValue: ingestFanoutAgeTargetSeconds,
      scaleInCooldown,
      scaleOutCooldown,
    })
  }

  if (!isPaused && options.goldLiveMode === 'queue') {
    const bounds = resolveScaleBounds(goldLiveDesired)
    const scaling = goldLiveService.autoScaleTaskCount({
      minCapacity: bounds.min,
      maxCapacity: bounds.max,
    })
    scaling.scaleToTrackCustomMetric('GoldLiveQueueDepth', {
      metric: options.queues.goldLiveQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
    scaling.scaleToTrackCustomMetric('GoldLiveQueueAge', {
      metric: options.queues.goldLiveQueue.metricApproximateAgeOfOldestMessage(),
      targetValue: defaultQueueAgeTargetSeconds,
      scaleInCooldown,
      scaleOutCooldown,
    })
  }

  if (!isPaused && options.notificationsMode === 'queue') {
    const bounds = resolveScaleBounds(notificationsDesired)
    const scaling = notificationsQueueService.autoScaleTaskCount({
      minCapacity: bounds.min,
      maxCapacity: bounds.max,
    })
    scaling.scaleToTrackCustomMetric('NotificationsQueueDepth', {
      metric: options.queues.notificationsQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
    scaling.scaleToTrackCustomMetric('NotificationsQueueAge', {
      metric: options.queues.notificationsQueue.metricApproximateAgeOfOldestMessage(),
      targetValue: defaultQueueAgeTargetSeconds,
      scaleInCooldown,
      scaleOutCooldown,
    })
  }

  if (!isPaused && options.opsAlertsMode === 'queue') {
    const bounds = resolveScaleBounds(opsAlertsDesired)
    const scaling = opsAlertsQueueService.autoScaleTaskCount({
      minCapacity: bounds.min,
      maxCapacity: bounds.max,
    })
    scaling.scaleToTrackCustomMetric('OpsAlertsQueueDepth', {
      metric: options.queues.opsAlertsQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
    scaling.scaleToTrackCustomMetric('OpsAlertsQueueAge', {
      metric: options.queues.opsAlertsQueue.metricApproximateAgeOfOldestMessage(),
      targetValue: defaultQueueAgeTargetSeconds,
      scaleInCooldown,
      scaleOutCooldown,
    })
  }

  return {
    planeBIngestService,
    b2cRefreshService,
    fxRateRefreshService,
    ingestFanoutTier1Service,
    ingestFanoutTier2Service,
    goldLiveService,
    notificationsQueueService,
    opsAlertsQueueService,
  }
}
