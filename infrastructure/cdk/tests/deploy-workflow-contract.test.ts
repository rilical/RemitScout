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

test('staging deploy uses the canonical staging profile for both lean and parity modes', () => {
  assert.match(
    deployWorkflow,
    /case "\$\{REQUESTED_STAGING_MODE:-lean\}" in[\s\S]*lean\)[\s\S]*profile_name="staging"[\s\S]*parity\)[\s\S]*profile_name="staging"/,
  )
  assert.doesNotMatch(deployWorkflow, /profile_name="staging-lean"|profile_name="staging-parity"/)
})

test('deploy workflow does not require undefined runtimeMode or costProfile context keys', () => {
  assert.doesNotMatch(deployWorkflow, /actual_runtime_mode|actual_cost_profile/)
})

test('staging launch-user entitlement smoke matches the documented gate', () => {
  assert.match(
    deployWorkflow,
    /Authenticated Watchlist\/Alerts Smoke \(staging\)[\s\S]*SMOKE_EXPECTED_EMAIL: omar@remit-scout\.com[\s\S]*SMOKE_EXPECTED_APP_ROLE: super_admin[\s\S]*SMOKE_EXPECTED_EFFECTIVE_PLAN_CODE: enterprise[\s\S]*SMOKE_EXPECT_ENTERPRISE_ENTITLEMENTS: '1'/,
  )
  assert.doesNotMatch(
    deployWorkflow,
    /Authenticated Watchlist\/Alerts Smoke \(staging\)[\s\S]*SMOKE_EXPECTED_IS_ADMIN/,
  )
})

test('launch-user seeding prefers the public Supabase URL fallback in deploy workflows', () => {
  assert.match(
    deployWorkflow,
    /Seed Launch Users \(staging\)[\s\S]*SUPABASE_URL: \$\{\{ vars\.PUBLIC_SUPABASE_URL \|\| vars\.SUPABASE_URL \|\| secrets\.SUPABASE_URL \}\}/,
  )
  assert.match(
    deployWorkflow,
    /Seed Launch Users \(prod\)[\s\S]*SUPABASE_URL: \$\{\{ vars\.PUBLIC_SUPABASE_URL \|\| vars\.SUPABASE_URL \|\| secrets\.SUPABASE_URL \}\}/,
  )
})

test('deploy workflow avoids head-induced pipefail when resolving GitHub Actions run ids', () => {
  assert.doesNotMatch(deployWorkflow, /gh run list[\s\S]*\|\s*head -n1/)
})
