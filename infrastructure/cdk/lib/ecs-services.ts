import { Duration } from 'aws-cdk-lib'
import { FargateService } from 'aws-cdk-lib/aws-ecs'
import { SubnetType, type SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import type { Cluster, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs'
import type { Construct } from 'constructs'
import type { QueueResources } from './queues'

export type EcsServiceResources = {
  planeBIngestService: FargateService
  ingestFanoutService: FargateService
  notificationsQueueService: FargateService
  opsAlertsQueueService: FargateService
}

export type EcsServiceOptions = {
  envName: string
  cluster: Cluster
  planeBSecurityGroup: SecurityGroup
  planeBIngestTask: FargateTaskDefinition
  ingestFanoutTask: FargateTaskDefinition
  notificationsQueueTask: FargateTaskDefinition
  opsAlertsQueueTask: FargateTaskDefinition
  queues: QueueResources
  ingestFanoutMode?: string
  notificationsMode?: string
  opsAlertsMode?: string
}

export const createEcsServices = (
  scope: Construct,
  options: EcsServiceOptions,
): EcsServiceResources => {
  const planeBIngestService = new FargateService(scope, 'PlaneBIngestService', {
    cluster: options.cluster,
    taskDefinition: options.planeBIngestTask,
    desiredCount: options.envName === 'prod' ? 1 : 0,
    assignPublicIp: false,
    vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    securityGroups: [options.planeBSecurityGroup],
  })

  const ingestFanoutService = new FargateService(scope, 'IngestFanoutWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.ingestFanoutTask,
    desiredCount:
      options.envName === 'prod' && options.ingestFanoutMode === 'queue' ? 1 : 0,
    assignPublicIp: false,
    vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    securityGroups: [options.planeBSecurityGroup],
  })

  const notificationsQueueService = new FargateService(
    scope,
    'NotificationsQueueWorkerService',
    {
      cluster: options.cluster,
      taskDefinition: options.notificationsQueueTask,
      desiredCount:
        options.envName === 'prod' && options.notificationsMode === 'queue' ? 1 : 0,
      assignPublicIp: false,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [options.planeBSecurityGroup],
    },
  )

  const opsAlertsQueueService = new FargateService(scope, 'OpsAlertsQueueWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.opsAlertsQueueTask,
    desiredCount:
      options.envName === 'prod' && options.opsAlertsMode === 'queue' ? 1 : 0,
    assignPublicIp: false,
    vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    securityGroups: [options.planeBSecurityGroup],
  })

  const scaleDefaults = {
    min: options.envName === 'prod' ? 1 : 0,
    max: options.envName === 'prod' ? 5 : 2,
    targetValue: options.envName === 'prod' ? 50 : 10,
  }

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
    ingestFanoutService,
    notificationsQueueService,
    opsAlertsQueueService,
  }
}
