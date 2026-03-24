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

test('staging readiness evidence artifacts keep 90-day retention', () => {
  const matches = readinessWorkflow.match(/retention-days: 90/g) ?? []
  assert.equal(matches.length >= 2, true)
})
