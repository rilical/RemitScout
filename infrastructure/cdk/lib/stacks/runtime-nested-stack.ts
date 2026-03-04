import { NestedStack } from 'aws-cdk-lib'
import { Role } from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'

import { createCompute } from '../compute'
import { createEcsServices } from '../ecs-services'
import { createEcsTasks } from '../ecs-tasks'
import type { RuntimeNestedStackProps, RuntimeResources } from './contracts'

export class RuntimeNestedStack extends NestedStack {
  public readonly resources: RuntimeResources

  constructor(scope: Construct, id: string, props: RuntimeNestedStackProps) {
    super(scope, id, props)

    const compute = createCompute(this, {
      envName: props.envName,
      vpc: props.foundation.networking.vpc,
      roles: props.foundation.iam,
    })

    const immutableTaskExecutionRole = Role.fromRoleArn(
      this,
      'PlaneBEcsTaskExecutionRoleRef',
      props.foundation.iam.planeBEcsTaskExecutionRole.roleArn,
      { mutable: false },
    )
    const immutableTaskRole = Role.fromRoleArn(
      this,
      'PlaneBEcsTaskRoleRef',
      props.foundation.iam.planeBEcsTaskRole.roleArn,
      { mutable: false },
    )

    const tasks = createEcsTasks(this, {
      envName: props.envName,
      minimalMode: props.minimalMode,
      cpuArchitecture: props.cpuArchitecture,
      backendRepository: props.foundation.registry.backendRepository,
      imageTag: props.imageTag,
      roles: {
        ...props.foundation.iam,
        planeBEcsTaskExecutionRole: immutableTaskExecutionRole,
        planeBEcsTaskRole: immutableTaskRole,
      },
      ...props.taskOptions,
    })

    const ecsServices = createEcsServices(this, {
      envName: props.envName,
      cluster: compute.cluster,
      planeASecurityGroup: props.foundation.networking.planeASecurityGroup,
      planeCSecurityGroup: props.foundation.networking.planeCSecurityGroup,
      planeBSecurityGroup: props.foundation.networking.planeBSecurityGroup,
      planeATask: tasks.planeATask,
      planeCTask: tasks.planeCTask,
      planeBIngestTask: tasks.planeBIngestTask,
      b2cRefreshTask: tasks.b2cRefreshTask,
      fxRateRefreshTask: tasks.fxRateRefreshTask,
      ingestFanoutTier1Task: tasks.ingestFanoutTier1Task,
      ingestFanoutTier2Task: tasks.ingestFanoutTier2Task,
      goldLiveTask: tasks.goldLiveTask,
      notificationsQueueTask: tasks.notificationsQueueTask,
      opsAlertsQueueTask: tasks.opsAlertsQueueTask,
      alertEvaluationTask: tasks.alertEvaluationTask,
      exportWorkerTask: tasks.exportWorkerTask,
      agentOrchestratorTask: tasks.agentOrchestratorTask,
      stressResponderTask: tasks.stressResponderTask,
      normalizationWorkerTask: tasks.normalizationWorkerTask,
      queues: props.foundation.queues,
      paused: props.paused,
      minimalMode: props.minimalMode,
      ...props.serviceOptions,
    })

    this.resources = {
      compute,
      tasks,
      ecsServices,
    }
  }
}
