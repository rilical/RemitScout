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

test('staging deploy treats non-allowlisted admin runner IPs as deploy advisories while keeping readiness strict', () => {
  assert.match(
    deployWorkflow,
    /Verify runner IP is allowlisted for staging admin smoke[\s\S]*id: admin_runner_check[\s\S]*echo "allowlisted=false" >> "\$GITHUB_OUTPUT"[\s\S]*Staging deploy can continue, but privileged admin proof is skipped and go-live readiness remains pending\./,
  )
  assert.match(
    deployWorkflow,
    /Admin surface smoke \(staging\)[\s\S]*if: steps\.admin_runner_check\.outputs\.allowlisted == 'true'/,
  )
  assert.match(
    deployWorkflow,
    /Admin UI smoke[\s\S]*if: steps\.admin_runner_check\.outputs\.allowlisted == 'true'/,
  )
  assert.match(
    deployWorkflow,
    /Staging Go-live Readiness Gate[\s\S]*if: steps\.admin_runner_check\.outputs\.allowlisted == 'true'/,
  )
})

test('staging deploy keeps span verification advisory in lean mode and hard in parity mode', () => {
  assert.match(
    deployWorkflow,
    /New Relic observability gate \(staging\)[\s\S]*STAGING_MODE: \$\{\{\s*inputs\.staging_mode \|\| 'lean'\s*\}\}[\s\S]*require_spans=1[\s\S]*if \[ "\$\{STAGING_MODE:-lean\}" = "lean" \]; then[\s\S]*require_spans=0[\s\S]*REQUIRE_SPANS="\$\{require_spans\}"/,
  )
  assert.match(
    deployWorkflow,
    /if \[ "\$\{require_spans\}" = "1" \]; then[\s\S]*spanCount > 0[\s\S]*else[\s\S]*span proof is advisory in staging lean mode/,
  )
})
