import assert from 'node:assert/strict'
import test from 'node:test'

import { buildNotificationEvidence } from './sync-notifications-workflows.mjs'

const workflowWithPolicy = (name, policyNeedle) => ({
  name,
  issuesFilter: {
    predicates: [
      {
        attribute: 'accumulations.policyName',
        operator: 'CONTAINS',
        values: [policyNeedle],
      },
    ],
  },
})

test('buildNotificationEvidence records both required mirror policy names when workflows are configured', () => {
  const payload = buildNotificationEvidence(
    {
      workflows: [
        workflowWithPolicy('Remit-Scout STAGING Incident Workflow', 'STAGING'),
        workflowWithPolicy('Remit-Scout PROD Incident Workflow', 'PROD'),
      ],
    },
    {
      requireMirrorPolicies: true,
      generatedAt: '2026-03-24T02:45:00.000Z',
    },
  )

  assert.deepEqual(payload.verification, {
    passed: true,
    mirrorPoliciesRequired: true,
  })
  assert.deepEqual(payload.workflows.staging.matchedPolicyNames, ['Remit-Scout STAGING CloudWatch Mirror'])
  assert.deepEqual(payload.workflows.prod.matchedPolicyNames, ['Remit-Scout PROD CloudWatch Mirror'])
})

test('buildNotificationEvidence fails verification when either workflow loses its mirror policy filter', () => {
  const payload = buildNotificationEvidence(
    {
      workflows: [workflowWithPolicy('Remit-Scout STAGING Incident Workflow', 'STAGING')],
    },
    {
      requireMirrorPolicies: true,
      generatedAt: '2026-03-24T02:45:00.000Z',
    },
  )

  assert.equal(payload.verification.passed, false)
  assert.deepEqual(payload.workflows.staging.matchedPolicyNames, ['Remit-Scout STAGING CloudWatch Mirror'])
  assert.deepEqual(payload.workflows.prod.matchedPolicyNames, [])
})
