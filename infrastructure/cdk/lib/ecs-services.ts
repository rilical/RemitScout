import { Duration, Tags } from 'aws-cdk-lib'
import { DeploymentCircuitBreaker, FargateService } from 'aws-cdk-lib/aws-ecs'
import { SubnetType, type SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import type { Cluster, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs'
import type { Construct } from 'constructs'
import { ensureEcsScalableTargetActive } from './ecs-autoscaling-guard'
import type { QueueResources } from './queues'

export type EcsServiceResources = {
  planeAService?: FargateService
  planeCService?: FargateService
  planeBIngestService?: FargateService
  b2cRefreshService?: FargateService
  fxRateRefreshService?: FargateService
  ingestFanoutTier1Service?: FargateService
  ingestFanoutTier2Service?: FargateService
  goldLiveService?: FargateService
  notificationsQueueService?: FargateService
  opsAlertsQueueService?: FargateService
  alertEvaluationService?: FargateService
  exportWorkerService?: FargateService
  agentOrchestratorService?: FargateService
  stressResponderService?: FargateService
  normalizationWorkerService?: FargateService
  queueWorkerScalableTargetResourceIds: string[]
}

export type EcsServiceOptions = {
  envName: string
  cluster: Cluster
  planeASecurityGroup: SecurityGroup
  planeCSecurityGroup: SecurityGroup
  planeBSecurityGroup: SecurityGroup
  planeATask: FargateTaskDefinition
  planeCTask: FargateTaskDefinition
  planeBIngestTask: FargateTaskDefinition
  b2cRefreshTask: FargateTaskDefinition
  fxRateRefreshTask: FargateTaskDefinition
  ingestFanoutTier1Task: FargateTaskDefinition
  ingestFanoutTier2Task: FargateTaskDefinition
  goldLiveTask: FargateTaskDefinition
  notificationsQueueTask: FargateTaskDefinition
  opsAlertsQueueTask: FargateTaskDefinition
  alertEvaluationTask: FargateTaskDefinition
  exportWorkerTask: FargateTaskDefinition
  agentOrchestratorTask: FargateTaskDefinition
  stressResponderTask: FargateTaskDefinition
  normalizationWorkerTask: FargateTaskDefinition
  queues: QueueResources
  ingestFanoutMode?: string
  quoteRefreshMode?: string
  fxRateRefreshMode?: string
  goldLiveMode?: string
  notificationsMode?: string
  opsAlertsMode?: string
  alertEvaluationMode?: string
  exportJobMode?: string
  agentFailureMode?: string
  agentStressMode?: string
  toolRequestMode?: string
  normalizationMode?: string
  b2cRefreshServiceEnabled?: boolean
  fxRateRefreshServiceEnabled?: boolean
  alertEvaluationServiceEnabled?: boolean
  exportServiceEnabled?: boolean
  agentOrchestratorServiceEnabled?: boolean
  stressResponderServiceEnabled?: boolean
  normalizationServiceEnabled?: boolean
  planeADesiredCount?: number
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
  alertEvaluationDesiredCount?: number
  exportWorkerDesiredCount?: number
  agentOrchestratorDesiredCount?: number
  stressResponderDesiredCount?: number
  normalizationWorkerDesiredCount?: number
  queueWorkerSpotOnly?: boolean
  paused?: boolean
  minimalMode?: boolean
}

export const createEcsServices = (
  scope: Construct,
  options: EcsServiceOptions,
): EcsServiceResources => {
  const isDev = options.envName === 'dev'
  const isProd = options.envName === 'prod'
  const isPaused = options.paused === true
  const b2cRefreshServiceEnabled = options.b2cRefreshServiceEnabled ?? true
  const fxRateRefreshServiceEnabled = options.fxRateRefreshServiceEnabled ?? true
  const alertEvaluationServiceEnabled = options.alertEvaluationServiceEnabled ?? false
  const exportServiceEnabled = options.exportServiceEnabled ?? false
  const agentOrchestratorServiceEnabled = options.agentOrchestratorServiceEnabled ?? false
  const stressResponderServiceEnabled = options.stressResponderServiceEnabled ?? false
  const normalizationServiceEnabled = options.normalizationServiceEnabled ?? false
  const agentFailureMode = options.agentFailureMode ?? 'off'
  const agentStressMode = options.agentStressMode ?? 'off'
  const toolRequestMode = options.toolRequestMode ?? 'off'
  const normalizationMode = options.normalizationMode ?? 'off'
  const agentOrchestratorQueueActive = agentFailureMode === 'queue' || toolRequestMode === 'queue'
  const stressResponderQueueActive = agentStressMode === 'queue'
  const normalizationQueueActive = normalizationMode === 'queue'
  const minimalMode = options.minimalMode === true

  const baseIngestDesired = isProd ? 1 : 0
  const baseQueueDesired = isProd ? 1 : 0
  const baseB2cRefreshDesired = isProd ? 1 : 0
  const baseFxRateRefreshDesired = isProd ? 1 : 0
  const planeADesired = isPaused
    ? 0
    : Math.max(0, options.planeADesiredCount ?? 1)

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
  const alertEvaluationDesired = isPaused
    ? 0
    : (options.alertEvaluationDesiredCount ?? (isProd ? 1 : 0))
  const exportWorkerDesired = isPaused
    ? 0
    : (options.exportWorkerDesiredCount ?? (isProd ? 1 : 0))
  const agentOrchestratorDesired = isPaused
    ? 0
    : (options.agentOrchestratorDesiredCount ?? (isProd ? 1 : 0))
  const stressResponderDesired = isPaused
    ? 0
    : (options.stressResponderDesiredCount ?? (isProd ? 1 : 0))
  const normalizationWorkerDesired = isPaused
    ? 0
    : (options.normalizationWorkerDesiredCount ?? (isProd ? 1 : 0))
  const minimalIngestFanoutTier2Desired = isPaused
    ? 0
    : (options.ingestFanoutTier2DesiredCount ?? 1)
  const isStaging = options.envName === 'staging'
  const spotOnly = options.queueWorkerSpotOnly ?? (isDev || isStaging)
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
  const queueWorkerScalableTargetResourceIds: string[] = []
  // Non-prod accounts often have tighter Fargate vCPU quotas.
  // Keep updates effectively in-place while satisfying ECS AZ rebalancing
  // requirement that maximumPercent must be > 100.
  // Non-prod: allow 50% overlap so tasks can start before old ones are killed,
  // avoiding thundering-herd connection storms on simultaneous restarts.
  const minHealthyPercent = isProd ? undefined : 50
  const maxHealthyPercent = isProd ? undefined : 200
  const circuitBreaker: DeploymentCircuitBreaker = {
    // In non-prod, disable the breaker entirely so transient task startup
    // failures do not hard-fail CloudFormation deploys.
    enable: isProd,
    rollback: isProd,
  }
  const tagManaged = (service: FargateService): void => {
    Tags.of(service).add('managed-by', 'ops-pause')
    Tags.of(service).add('environment', options.envName)
  }
  const registerQueueWorkerScalableTarget = (
    id: string,
    service: FargateService | undefined,
    bounds: { min: number; max: number },
  ): void => {
    if (isDev || !service) return
    const resourceId = ensureEcsScalableTargetActive(scope, id, {
      clusterName: options.cluster.clusterName,
      serviceName: service.serviceName,
      minCapacity: bounds.min,
      maxCapacity: bounds.max,
      deploymentFingerprint: service.taskDefinition.taskDefinitionArn,
    })
    queueWorkerScalableTargetResourceIds.push(resourceId)
  }

  if (minimalMode) {
    const minimalPlaneBIngestService = new FargateService(scope, 'PlaneBIngestService', {
      cluster: options.cluster,
      taskDefinition: options.planeBIngestTask,
      desiredCount: planeBIngestDesired,
      assignPublicIp: usePublicSubnets,
      vpcSubnets: { subnetType },
      securityGroups: [options.planeBSecurityGroup],
      capacityProviderStrategies: spotCapacityProviderStrategies,
      enableExecuteCommand,
      circuitBreaker,
      minHealthyPercent,
      maxHealthyPercent,
    })
    tagManaged(minimalPlaneBIngestService)

    const minimalIngestFanoutTier2Service = new FargateService(
      scope,
      'IngestFanoutTier2WorkerService',
      {
        cluster: options.cluster,
        taskDefinition: options.ingestFanoutTier2Task,
        desiredCount:
          options.ingestFanoutMode === 'queue' && !isPaused
            ? minimalIngestFanoutTier2Desired
            : 0,
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
    tagManaged(minimalIngestFanoutTier2Service)

    const shouldRunB2cRefresh =
      b2cRefreshServiceEnabled &&
      options.quoteRefreshMode === 'queue' &&
      !isPaused &&
      b2cRefreshDesired > 0
    const minimalB2cRefreshService = shouldRunB2cRefresh
      ? new FargateService(scope, 'B2cRefreshWorkerService', {
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
      : undefined
    if (minimalB2cRefreshService) {
      tagManaged(minimalB2cRefreshService)
    }

    return {
      planeBIngestService: minimalPlaneBIngestService,
      b2cRefreshService: minimalB2cRefreshService,
      ingestFanoutTier2Service: minimalIngestFanoutTier2Service,
      queueWorkerScalableTargetResourceIds,
    }
  }

  // Plane A API server — on-demand FARGATE in prod for stable availability;
  // FARGATE_SPOT in non-prod where brief interruptions are acceptable.
  const planeAService = new FargateService(scope, 'PlaneAService', {
    cluster: options.cluster,
    taskDefinition: options.planeATask,
    desiredCount: planeADesired,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeASecurityGroup],
    capacityProviderStrategies: isProd
      ? [{ capacityProvider: 'FARGATE', base: 1, weight: 1 }]
      : [{ capacityProvider: 'FARGATE_SPOT', weight: 1 }],
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })
  tagManaged(planeAService)

  // Plane C Gold publisher — on-demand FARGATE in prod for stable availability;
  // FARGATE_SPOT in non-prod where brief interruptions are acceptable.
  const planeCService = new FargateService(scope, 'PlaneCService', {
    cluster: options.cluster,
    taskDefinition: options.planeCTask,
    desiredCount: isPaused ? 0 : 1,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeCSecurityGroup],
    capacityProviderStrategies: isProd
      ? [{ capacityProvider: 'FARGATE', base: 1, weight: 1 }]
      : [{ capacityProvider: 'FARGATE_SPOT', weight: 1 }],
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })
  tagManaged(planeCService)

  const planeBIngestService = new FargateService(scope, 'PlaneBIngestService', {
    cluster: options.cluster,
    taskDefinition: options.planeBIngestTask,
    desiredCount: planeBIngestDesired,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
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
  tagManaged(b2cRefreshService)

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
  tagManaged(fxRateRefreshService)

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

  const alertEvaluationService = new FargateService(scope, 'AlertEvaluationWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.alertEvaluationTask,
    desiredCount:
      alertEvaluationServiceEnabled && options.alertEvaluationMode === 'queue' && !isPaused
        ? alertEvaluationDesired
        : 0,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })
  tagManaged(alertEvaluationService)

  const exportWorkerService = new FargateService(scope, 'ExportWorkerService', {
    cluster: options.cluster,
    taskDefinition: options.exportWorkerTask,
    desiredCount:
      exportServiceEnabled && options.exportJobMode === 'queue' && !isPaused
        ? exportWorkerDesired
        : 0,
    assignPublicIp: usePublicSubnets,
    vpcSubnets: { subnetType },
    securityGroups: [options.planeBSecurityGroup],
    capacityProviderStrategies: spotCapacityProviderStrategies,
    enableExecuteCommand,
    circuitBreaker,
    minHealthyPercent,
    maxHealthyPercent,
  })
  tagManaged(exportWorkerService)

  const agentOrchestratorService = agentOrchestratorServiceEnabled
    ? new FargateService(scope, 'AgentOrchestratorService', {
        cluster: options.cluster,
        taskDefinition: options.agentOrchestratorTask,
        desiredCount: !isPaused && agentOrchestratorQueueActive ? agentOrchestratorDesired : 0,
        assignPublicIp: usePublicSubnets,
        vpcSubnets: { subnetType },
        securityGroups: [options.planeBSecurityGroup],
        capacityProviderStrategies: [{ capacityProvider: 'FARGATE', base: 1, weight: 1 }],
        enableExecuteCommand,
        circuitBreaker,
        minHealthyPercent,
        maxHealthyPercent,
      })
    : undefined
  if (agentOrchestratorService) tagManaged(agentOrchestratorService)

  const stressResponderService = stressResponderServiceEnabled
    ? new FargateService(scope, 'StressResponderService', {
        cluster: options.cluster,
        taskDefinition: options.stressResponderTask,
        desiredCount: !isPaused && stressResponderQueueActive ? stressResponderDesired : 0,
        assignPublicIp: usePublicSubnets,
        vpcSubnets: { subnetType },
        securityGroups: [options.planeBSecurityGroup],
        capacityProviderStrategies: spotCapacityProviderStrategies,
        enableExecuteCommand,
        circuitBreaker,
        minHealthyPercent,
        maxHealthyPercent,
      })
    : undefined
  if (stressResponderService) tagManaged(stressResponderService)

  const normalizationWorkerService = normalizationServiceEnabled
    ? new FargateService(scope, 'NormalizationWorkerService', {
        cluster: options.cluster,
        taskDefinition: options.normalizationWorkerTask,
        desiredCount: !isPaused && normalizationQueueActive ? normalizationWorkerDesired : 0,
        assignPublicIp: usePublicSubnets,
        vpcSubnets: { subnetType },
        securityGroups: [options.planeBSecurityGroup],
        capacityProviderStrategies: spotCapacityProviderStrategies,
        enableExecuteCommand,
        circuitBreaker,
        minHealthyPercent,
        maxHealthyPercent,
      })
    : undefined
  if (normalizationWorkerService) tagManaged(normalizationWorkerService)

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

  // ── Plane A auto-scaling (CPU target-tracking) ────────────────────────────
  // prod:     min=1, max=4, target CPU=60%
  // non-prod: min=1, max=2, target CPU=60%
  if (!isPaused) {
    const planeAMinCapacity = isPaused ? 0 : planeADesired
    const planeAMaxCapacity = Math.max(isProd ? 4 : 2, planeADesired)
    const planeAScaling = planeAService.autoScaleTaskCount({
      minCapacity: planeAMinCapacity,
      maxCapacity: planeAMaxCapacity,
    })
    planeAScaling.scaleOnCpuUtilization('PlaneACpuScaling', {
      targetUtilizationPercent: 60,
      scaleOutCooldown: Duration.seconds(60),
      scaleInCooldown: isProd ? Duration.seconds(180) : Duration.seconds(300),
    })
  }

  // ── Plane C auto-scaling (CPU target-tracking) ────────────────────────────
  // prod:     min=1, max=2, target CPU=70%
  // non-prod: min=1, max=1 (effectively no scaling — single instance)
  if (!isPaused) {
    const planeCMinCapacity = 1
    const planeCMaxCapacity = isProd ? 2 : 1
    const planeCScaling = planeCService.autoScaleTaskCount({
      minCapacity: planeCMinCapacity,
      maxCapacity: planeCMaxCapacity,
    })
    planeCScaling.scaleOnCpuUtilization('PlaneCCpuScaling', {
      targetUtilizationPercent: 70,
      scaleOutCooldown: Duration.seconds(60),
      scaleInCooldown: isProd ? Duration.seconds(180) : Duration.seconds(300),
    })
  }

  if (!isPaused && options.quoteRefreshMode === 'queue' && b2cRefreshServiceEnabled) {
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
    registerQueueWorkerScalableTarget('B2cRefreshScalableTargetGuard', b2cRefreshService, b2cBounds)
  }

  if (!isPaused && options.fxRateRefreshMode === 'queue' && fxRateRefreshServiceEnabled) {
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
    registerQueueWorkerScalableTarget('FxRateRefreshScalableTargetGuard', fxRateRefreshService, fxBounds)
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
    registerQueueWorkerScalableTarget('IngestFanoutTier1ScalableTargetGuard', ingestFanoutTier1Service, tier1Bounds)

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
    registerQueueWorkerScalableTarget('IngestFanoutTier2ScalableTargetGuard', ingestFanoutTier2Service, tier2Bounds)
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
    registerQueueWorkerScalableTarget('GoldLiveScalableTargetGuard', goldLiveService, bounds)
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
    registerQueueWorkerScalableTarget('NotificationsScalableTargetGuard', notificationsQueueService, bounds)
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
    registerQueueWorkerScalableTarget('OpsAlertsScalableTargetGuard', opsAlertsQueueService, bounds)
  }

  if (!isPaused && alertEvaluationServiceEnabled && options.alertEvaluationMode === 'queue') {
    const bounds = resolveScaleBounds(alertEvaluationDesired)
    const scaling = alertEvaluationService.autoScaleTaskCount({
      minCapacity: bounds.min,
      maxCapacity: bounds.max,
    })
    scaling.scaleToTrackCustomMetric('AlertEvaluationQueueDepth', {
      metric: options.queues.alertEvaluationQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
    scaling.scaleToTrackCustomMetric('AlertEvaluationQueueAge', {
      metric: options.queues.alertEvaluationQueue.metricApproximateAgeOfOldestMessage(),
      targetValue: defaultQueueAgeTargetSeconds,
      scaleInCooldown,
      scaleOutCooldown,
    })
    registerQueueWorkerScalableTarget('AlertEvaluationScalableTargetGuard', alertEvaluationService, bounds)
  }

  if (!isPaused && exportServiceEnabled && options.exportJobMode === 'queue') {
    const bounds = resolveScaleBounds(exportWorkerDesired)
    const scaling = exportWorkerService.autoScaleTaskCount({
      minCapacity: bounds.min,
      maxCapacity: bounds.max,
    })
    scaling.scaleToTrackCustomMetric('ExportWorkerQueueDepth', {
      metric: options.queues.exportJobQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
    scaling.scaleToTrackCustomMetric('ExportWorkerQueueAge', {
      metric: options.queues.exportJobQueue.metricApproximateAgeOfOldestMessage(),
      targetValue: defaultQueueAgeTargetSeconds,
      scaleInCooldown,
      scaleOutCooldown,
    })
    registerQueueWorkerScalableTarget('ExportWorkerScalableTargetGuard', exportWorkerService, bounds)
  }

  if (!isPaused && agentOrchestratorServiceEnabled && agentOrchestratorQueueActive && agentOrchestratorService) {
    const bounds = resolveScaleBounds(agentOrchestratorDesired)
    const maxCapacity = Math.max(agentOrchestratorDesired, 3)
    const scaling = agentOrchestratorService.autoScaleTaskCount({
      minCapacity: bounds.min,
      maxCapacity,
    })
    scaling.scaleToTrackCustomMetric('AgentFailureQueueDepth', {
      metric: options.queues.agentFailureQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue: 10,
      scaleInCooldown,
      scaleOutCooldown,
    })
    registerQueueWorkerScalableTarget('AgentOrchestratorScalableTargetGuard', agentOrchestratorService, {
      min: bounds.min,
      max: maxCapacity,
    })
  }

  if (!isPaused && stressResponderServiceEnabled && stressResponderQueueActive && stressResponderService) {
    const bounds = resolveScaleBounds(stressResponderDesired)
    const maxCapacity = Math.max(stressResponderDesired, 3)
    const scaling = stressResponderService.autoScaleTaskCount({
      minCapacity: bounds.min,
      maxCapacity,
    })
    scaling.scaleToTrackCustomMetric('AgentStressQueueDepth', {
      metric: options.queues.agentStressQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue: 10,
      scaleInCooldown,
      scaleOutCooldown,
    })
    registerQueueWorkerScalableTarget('StressResponderScalableTargetGuard', stressResponderService, {
      min: bounds.min,
      max: maxCapacity,
    })
  }

  if (!isPaused && normalizationServiceEnabled && normalizationQueueActive && normalizationWorkerService) {
    const bounds = resolveScaleBounds(normalizationWorkerDesired)
    const maxCapacity = Math.max(normalizationWorkerDesired, scaleMax)
    const scaling = normalizationWorkerService.autoScaleTaskCount({
      minCapacity: bounds.min,
      maxCapacity,
    })
    scaling.scaleToTrackCustomMetric('NormalizationQueueDepth', {
      metric: options.queues.normalizationQueue.metricApproximateNumberOfMessagesVisible(),
      targetValue,
      scaleInCooldown,
      scaleOutCooldown,
    })
    scaling.scaleToTrackCustomMetric('NormalizationQueueAge', {
      metric: options.queues.normalizationQueue.metricApproximateAgeOfOldestMessage(),
      targetValue: defaultQueueAgeTargetSeconds,
      scaleInCooldown,
      scaleOutCooldown,
    })
    registerQueueWorkerScalableTarget('NormalizationScalableTargetGuard', normalizationWorkerService, {
      min: bounds.min,
      max: maxCapacity,
    })
  }

  return {
    planeAService,
    planeCService,
    planeBIngestService,
    b2cRefreshService,
    fxRateRefreshService,
    ingestFanoutTier1Service,
    ingestFanoutTier2Service,
    goldLiveService,
    notificationsQueueService,
    opsAlertsQueueService,
    alertEvaluationService,
    exportWorkerService,
    agentOrchestratorService,
    stressResponderService,
    normalizationWorkerService,
    queueWorkerScalableTargetResourceIds,
  }
}
