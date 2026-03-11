import assert from 'node:assert/strict'
import test from 'node:test'

import { App, Stack } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'

import { ensureEcsScalableTargetActive } from '../lib/ecs-autoscaling-guard'

test('registers an active ECS scalable target custom resource', () => {
  const app = new App()
  const stack = new Stack(app, 'AutoscalingGuardTestStack')

  ensureEcsScalableTargetActive(stack, 'QueueWorkerGuard', {
    clusterName: 'remit-scout-staging',
    serviceName: 'IngestFanoutTier2WorkerService',
    minCapacity: 1,
    maxCapacity: 6,
    deploymentFingerprint: 'td-123',
  })

  const template = Template.fromStack(stack)
  const resources = template.findResources('Custom::AWS')
  assert.equal(Object.keys(resources).length, 1)

  const resource = Object.values(resources)[0] as { Properties: Record<string, unknown> }
  const createPayload = JSON.stringify(resource.Properties.Create)
  const updatePayload = JSON.stringify(resource.Properties.Update)

  assert.match(createPayload, /ApplicationAutoScaling/)
  assert.match(createPayload, /registerScalableTarget/)
  assert.match(createPayload, /ecs:service:DesiredCount/)
  assert.match(createPayload, /service\/remit-scout-staging\/IngestFanoutTier2WorkerService/)
  assert.match(createPayload, /DynamicScalingInSuspended/)
  assert.match(createPayload, /DynamicScalingOutSuspended/)
  assert.match(createPayload, /ScheduledScalingSuspended/)
  assert.match(updatePayload, /td-123/)
})
