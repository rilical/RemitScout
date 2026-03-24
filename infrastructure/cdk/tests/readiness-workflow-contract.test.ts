import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const readinessWorkflowPath = path.join(
  repoRoot,
  '.github',
  'workflows',
  'staging-go-live-readiness.yml',
)
const readinessWorkflow = fs.readFileSync(readinessWorkflowPath, 'utf8')

test('staging readiness admin smoke fails closed when verified admin session coverage is skipped', () => {
  assert.match(
    readinessWorkflow,
    /Admin surface smoke \(staging\)[\s\S]*grep -Fq 'skipped=requires_verified_admin_session'/,
  )
})

test('staging readiness workflow hard-fails when the release evidence manifest is not pass-grade', () => {
  assert.match(
    readinessWorkflow,
    /Build release evidence manifest \(staging hard gate\)[\s\S]*\.status == "pass"[\s\S]*\(.violations \| length\) == 0[\s\S]*\(.artifacts\.misleadingFiles \| length\) == 0/,
  )
})

test('staging readiness records advisory Sentry scope evidence instead of failing the whole job on stale release credentials', () => {
  assert.match(
    readinessWorkflow,
    /Sentry release scope check[\s\S]*status="warn"[\s\S]*warning_reason="Sentry release scope check could not create and delete a test release;/,
  )
})

test('staging readiness observability gate exports the staging New Relic cloud-link role', () => {
  assert.match(
    readinessWorkflow,
    /Observability prereq gate \(staging hard gate\)[\s\S]*NEW_RELIC_STAGING_AWS_ROLE_ARN:\s+\$\{\{\s*vars\.NEW_RELIC_STAGING_AWS_ROLE_ARN\s*\}\}/,
  )
})

test('staging readiness runs New Relic span verification after traffic-generating smokes', () => {
  assert.match(
    readinessWorkflow,
    /Public integration smoke \(staging, post-ui\)[\s\S]*New Relic sync \+ verify \(staging hard gate\)[\s\S]*NEW_RELIC_WINDOW_MINUTES:\s+'180'[\s\S]*REQUIRE_SPANS=1/,
  )
})

test('staging readiness resumes operational services before export-dependent parity smoke', () => {
  assert.match(
    readinessWorkflow,
    /Resume staging operational services for parity evidence[\s\S]*Wait for staging critical services after ops resume[\s\S]*Enterprise \+ triangulation smoke \(staging\)/,
  )
})

test('staging readiness applies candidate migrations inside staging ECS runtime', () => {
  assert.match(
    readinessWorkflow,
    /Resolve staging DbMigrate ECS runtime[\s\S]*DB_MIGRATE_TASK_DEF_ARN[\s\S]*docker\/setup-buildx-action@v3[\s\S]*Build \+ push candidate DbMigrate image \(staging readiness\)[\s\S]*file:\s+backend\/Dockerfile\.migrate[\s\S]*Apply repo migrations from exact SHA via ECS \(staging readiness\)[\s\S]*aws ecs register-task-definition[\s\S]*aws ecs run-task/,
  )
})

test('staging readiness evidence artifacts keep 90-day retention', () => {
  const matches = readinessWorkflow.match(/retention-days: 90/g) ?? []
  assert.equal(matches.length >= 2, true)
})
