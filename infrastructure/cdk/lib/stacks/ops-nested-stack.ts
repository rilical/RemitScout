import { NestedStack } from 'aws-cdk-lib'
import type { Construct } from 'constructs'

import { createBackup } from '../backup'
import { createCostGuardrails } from '../budgets'
import { createComplianceServices } from '../compliance'
import { createMonitoring } from '../monitoring'
import { createOpsPause } from '../ops-pause'
import { createPipeline } from '../pipeline'
import { createScheduledJobs } from '../scheduled-jobs'
import { createSnsSubscriptions } from '../sns-subscriptions'
import { createSynthetics } from '../synthetics'
import type { OpsNestedStackProps, OpsResources } from './contracts'

export class OpsNestedStack extends NestedStack {
  public readonly resources: OpsResources

  constructor(scope: Construct, id: string, props: OpsNestedStackProps) {
    super(scope, id, props)

    const snsSubscriptions = createSnsSubscriptions(this, {
      envName: props.envName,
      ...props.snsOptions,
    })

    if (props.enableComplianceServices) {
      createComplianceServices(this, {
        envName: props.envName,
        criticalTopic: snsSubscriptions.criticalTopic,
      })
    }

    const planeABaseUrl =
      props.edge.api.planeACloudFront?.distributionDomainName
        ? `https://${props.edge.api.planeACloudFront.distributionDomainName}`
        : props.edge.api.planeAApi.apiEndpoint

    const synthetics = !props.minimalMode && props.envName !== 'dev' && props.enableSynthetics
      ? createSynthetics(this, {
          envName: props.envName,
          planeABaseUrl,
          alertsTopic: snsSubscriptions.criticalTopic,
        })
      : undefined

    const monitoring = !props.minimalMode && props.envName !== 'dev' && props.enableMonitoring
      ? createMonitoring(this, {
          envName: props.envName,
          queues: props.foundation.queues,
          api: props.edge.api,
          ecs: props.runtime.ecsServices,
          database: props.foundation.database,
          cache: props.foundation.cache,
          criticalTopic: snsSubscriptions.criticalTopic,
          warningTopic: snsSubscriptions.warningTopic,
          opsTopic: snsSubscriptions.opsTopic,
        })
      : undefined

    const backup = createBackup(this, {
      envName: props.envName,
      cluster: props.foundation.database.cluster,
      dbSecurityGroup: props.foundation.networking.dbSecurityGroup,
      ...props.backupOptions,
    })

    const costGuardrails = createCostGuardrails(this, {
      envName: props.envName,
      ...props.costGuardrailsOptions,
    })

    const pipeline = props.pipelineEnabled
      ? createPipeline(this, {
          envName: props.envName,
          backendRepository: props.foundation.registry.backendRepository,
          frontendBucket: props.edge.frontend?.bucket,
          frontendDistribution: props.edge.frontend?.distribution,
          planeACloudFrontDomain: props.edge.api.planeACloudFront?.distributionDomainName,
          planeAApiEndpoint: props.edge.api.planeAApi.apiEndpoint,
          ...props.pipelineOptions,
        })
      : null

    createScheduledJobs(this, {
      envName: props.envName,
      vpc: props.foundation.networking.vpc,
      roles: props.foundation.iam,
      cluster: props.runtime.compute.cluster,
      b2cRefreshTask: props.runtime.tasks.b2cRefreshTask,
      fxRateRefreshTask: props.runtime.tasks.fxRateRefreshTask,
      b2bSweepSchedulerTask: props.runtime.tasks.b2bSweepSchedulerTask,
      agentOrchestratorTask: props.runtime.tasks.agentOrchestratorTask,
      stressResponderTask: props.runtime.tasks.stressResponderTask,
      discoveryTask: props.runtime.tasks.discoveryTask,
      planeASecurityGroup: props.foundation.networking.planeASecurityGroup,
      planeBSecurityGroup: props.foundation.networking.planeBSecurityGroup,
      planeCSecurityGroup: props.foundation.networking.planeCSecurityGroup,
      ...props.scheduledJobsOptions,
    })

    const opsPause = createOpsPause(this, {
      envName: props.envName,
      clusterName: props.runtime.compute.cluster.clusterName,
      role: props.foundation.iam.opsPauseLambdaRole,
      ...props.opsPauseOptions,
    })

    this.resources = {
      snsSubscriptions,
      backup,
      costGuardrails,
      monitoring,
      synthetics,
      pipeline,
      opsPause,
    }
  }
}
