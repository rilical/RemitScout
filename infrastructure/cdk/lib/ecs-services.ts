import { Duration } from 'aws-cdk-lib'
import { FargateService } from 'aws-cdk-lib/aws-ecs'
import { SubnetType, type SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import type { Cluster, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs'
import type { Construct } from 'constructs'
import type { QueueResources } from './queues'

export type EcsServiceResources = {
  planeBIngestService: FargateService
  b2cRefreshService: FargateService
  ingestFanoutService: FargateService
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
  notificationsQueueTask: FargateTaskDefinition
  opsAlertsQueueTask: FargateTaskDefinition
  queues: QueueResources
  ingestFanoutMode?: string
  notificationsMode?: string
  opsAlertsMode?: string
  planeBIngestDesiredCount?: number
  queueWorkerDesiredCount?: number
  queueWorkerMaxCount?: number
  b2cRefreshDesiredCount?: number
  queueWorkerSpotOnly?: boolean
}

export const createEcsServices = (
  scope: Construct,
  options: EcsServiceOptions,
): EcsServiceResources => {
  const baseIngestDesired = options.envName === 'prod' ? 1 : 0
  const baseQueueDesired = options.envName === 'prod' ? 1 : 0
  const baseB2cRefreshDesired = options.envName === 'prod' ? 1 : 0
  const planeBIngestDesired =
    options.planeBIngestDesiredCount ?? baseIngestDesired
  const queueWorkerDesired =
    options.queueWorkerDesiredCount ?? baseQueueDesired
  const b2cRefreshDesired =
    options.b2cRefreshDesiredCount ?? baseB2cRefreshDesired
  const spotOnly = options.queueWorkerSpotOnly ?? false
  const spotCapacityProviderStrategies = spotOnly
    ? [{ capacityProvider: 'FARGATE_SPOT', weight: 1 }]
    : options.envName === 'prod'
      ? [
          { capacityProvider: 'FARGATE', base: 1, weight: 1 },
          { capacityProvider: 'FARGATE_SPOT', weight: 2 },
        ]
      : [
          { capacityProvider: 'FARGATE', base: 1, weight: 1 },
          { capacityProvider: 'FARGATE_SPOT', weight: 1 },
        ]
  const enableExecuteCommand = options.envName !== 'prod'

  const planeBIngestService = new FargateService(scope, 'PlaneBIngestService', {
    cluster: options.cluster,
    taskDefinition: options.planeBIngestTask,
    desiredCount: planeBIngestDesired,
    assignPublicIp: false,
    vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    securityGroups: [options.planeBSecurityGroup],
    enableExecuteCommand,
  })

  const b2cRefreshService = new FargateService(scope, 'B2cRefreshWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.b2cRefreshTask,
    desiredCount: b2cRefreshDesired,
    assignPublicIp: false,
    vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
    enableExecuteCommand,
  })

  const ingestFanoutService = new FargateService(scope, 'IngestFanoutWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.ingestFanoutTask,
    desiredCount:
      options.ingestFanoutMode === 'queue' ? queueWorkerDesired : 0,
    assignPublicIp: false,
    vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
    enableExecuteCommand,
  })

  const notificationsQueueService = new FargateService(
    scope,
    'NotificationsQueueWorkerService',
    {
      cluster: options.cluster,
      taskDefinition: options.notificationsQueueTask,
      desiredCount:
        options.notificationsMode === 'queue' ? queueWorkerDesired : 0,
      assignPublicIp: false,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [options.planeBSecurityGroup],
      capacityProviderStrategies: spotCapacityProviderStrategies,
      enableExecuteCommand,
    },
  )

  const opsAlertsQueueService = new FargateService(scope, 'OpsAlertsQueueWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.opsAlertsQueueTask,
    desiredCount:
      options.opsAlertsMode === 'queue' ? queueWorkerDesired : 0,
    assignPublicIp: false,
    vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    securityGroups: [options.planeBSecurityGroup],
    enableExecuteCommand,
  })

  const scaleMax = options.queueWorkerMaxCount ?? (options.envName === 'prod' ? 5 : 10)
  const scaleDefaults = {
    min: queueWorkerDesired,
    max: Math.max(queueWorkerDesired, scaleMax),
    targetValue: options.envName === 'prod' ? 50 : 10,
  }
  const queueAgeTargetSeconds = options.envName === 'prod' ? 900 : 1800

  if (options.ingestFanoutMode === 'queue') {
    const scaling = ingestFanoutService.autoScaleTaskCount({
      minCapacity: scaleDefaults.min,
      maxCapacity: scaleDefaults.max,
    })
    scaling.scaleToTrackCustomMetric('IngestFanoutQueueDepth', {
      metric: options.queues.ingestFanoutQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue: scaleDefaults.targetValue,
      scaleInCooldown: Duration.minutes(2),
      scaleOutCooldown: Duration.minutes(1),
    })
    scaling.scaleToTrackCustomMetric('IngestFanoutQueueAge', {
      metric: options.queues.ingestFanoutQueue.metricApproximateAgeOfOldestMessage(),
      targetValue: queueAgeTargetSeconds,
      scaleInCooldown: Duration.minutes(5),
      scaleOutCooldown: Duration.minutes(2),
    })
  }

  if (options.notificationsMode === 'queue') {
    const scaling = notificationsQueueService.autoScaleTaskCount({
      minCapacity: scaleDefaults.min,
      maxCapacity: scaleDefaults.max,
    })
    scaling.scaleToTrackCustomMetric('NotificationsQueueDepth', {
      metric: options.queues.notificationsQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue: scaleDefaults.targetValue,
      scaleInCooldown: Duration.minutes(2),
      scaleOutCooldown: Duration.minutes(1),
    })
  }

  if (options.opsAlertsMode === 'queue') {
    const scaling = opsAlertsQueueService.autoScaleTaskCount({
      minCapacity: scaleDefaults.min,
      maxCapacity: scaleDefaults.max,
    })
    scaling.scaleToTrackCustomMetric('OpsAlertsQueueDepth', {
      metric: options.queues.opsAlertsQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue: scaleDefaults.targetValue,
      scaleInCooldown: Duration.minutes(2),
      scaleOutCooldown: Duration.minutes(1),
    })
  }

  return {
    planeBIngestService,
    b2cRefreshService,
    ingestFanoutService,
    notificationsQueueService,
    opsAlertsQueueService,
  }
}
