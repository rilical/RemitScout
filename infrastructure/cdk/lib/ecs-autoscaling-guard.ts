import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources'
import type { Construct } from 'constructs'

export type EcsScalableTargetGuardOptions = {
  clusterName: string
  serviceName: string
  minCapacity: number
  maxCapacity: number
  deploymentFingerprint: string
}

export const buildScalableTargetResourceId = (
  clusterName: string,
  serviceName: string,
): string => `service/${clusterName}/${serviceName}`

export const ensureEcsScalableTargetActive = (
  scope: Construct,
  id: string,
  options: EcsScalableTargetGuardOptions,
): string => {
  const resourceId = buildScalableTargetResourceId(options.clusterName, options.serviceName)
  const registerCall = {
    service: 'ApplicationAutoScaling',
    action: 'registerScalableTarget',
    parameters: {
      ServiceNamespace: 'ecs',
      ScalableDimension: 'ecs:service:DesiredCount',
      ResourceId: resourceId,
      MinCapacity: options.minCapacity,
      MaxCapacity: options.maxCapacity,
      SuspendedState: {
        DynamicScalingInSuspended: false,
        DynamicScalingOutSuspended: false,
        ScheduledScalingSuspended: false,
      },
    },
    physicalResourceId: PhysicalResourceId.of(
      `${resourceId}:${options.minCapacity}:${options.maxCapacity}:${options.deploymentFingerprint}`,
    ),
  }

  new AwsCustomResource(scope, id, {
    onCreate: registerCall,
    onUpdate: registerCall,
    installLatestAwsSdk: false,
    policy: AwsCustomResourcePolicy.fromSdkCalls({
      resources: AwsCustomResourcePolicy.ANY_RESOURCE,
    }),
  })

  return resourceId
}
