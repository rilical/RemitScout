import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const deployWorkflowPath = path.join(repoRoot, '.github', 'workflows', 'deploy.yml')
const deployWorkflow = fs.readFileSync(deployWorkflowPath, 'utf8')

test('staging deploy refreshes AWS credentials with a long session before CDK deploy', () => {
  assert.match(
    deployWorkflow,
    /Refresh AWS credentials before CDK deploy \(staging, long session\)[\s\S]*role-duration-seconds: 21600[\s\S]*Refresh AWS credentials before CDK deploy \(staging, standard session fallback\)[\s\S]*role-duration-seconds: 10800/,
  )
})

test('staging deploy hard-fails stuck CDK deploys and prints ECS rollout diagnostics', () => {
  assert.match(
    deployWorkflow,
    /CDK Deploy \(staging\)[\s\S]*timeout --preserve-status --kill-after=60s[\s\S]*Staging CDK deploy timed out after[\s\S]*aws ecs list-services[\s\S]*ECS rollout diagnostics:/,
  )
})
