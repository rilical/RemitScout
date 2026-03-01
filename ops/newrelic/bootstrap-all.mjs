#!/usr/bin/env node

/**
 * Bootstraps all Remit-Scout New Relic assets in a stable order.
 *
 * Required env:
 * - NEW_RELIC_USER_API_KEY
 * - NEW_RELIC_ACCOUNT_ID
 *
 * Optional env:
 * - NEW_RELIC_REGION (US|EU, default US)
 * - NEW_RELIC_ALERT_EMAIL (required for notifications script)
 */

import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const requiredVars = ['NEW_RELIC_USER_API_KEY', 'NEW_RELIC_ACCOUNT_ID']
const missing = requiredVars.filter((name) => !process.env[name] || !String(process.env[name]).trim())

if (missing.length) {
  console.error(`Missing required env: ${missing.join(', ')}`)
  process.exit(1)
}

const tasks = [
  { label: 'Dashboards', script: 'bootstrap-dashboards.mjs' },
  { label: 'Alert mirrors', script: 'sync-alerts.mjs' },
]

if (process.env.NEW_RELIC_STAGING_AWS_ROLE_ARN && process.env.NEW_RELIC_PROD_AWS_ROLE_ARN) {
  tasks.push({ label: 'Cloud links', script: 'sync-cloud-links.mjs' })
} else {
  console.log(
    '[skip] Cloud links (set NEW_RELIC_STAGING_AWS_ROLE_ARN and NEW_RELIC_PROD_AWS_ROLE_ARN to enable)',
  )
}

tasks.push(
  { label: 'Workloads', script: 'sync-workloads.mjs' },
  { label: 'Notifications/workflows', script: 'sync-notifications-workflows.mjs' },
)

const runTask = (task) =>
  new Promise((resolveTask, rejectTask) => {
    console.log(`\n==> ${task.label}`)
    const child = spawn('node', [resolve('ops/newrelic', task.script)], {
      stdio: 'inherit',
      env: process.env,
    })

    child.on('error', rejectTask)
    child.on('exit', (code) => {
      if (code === 0) {
        resolveTask()
        return
      }
      rejectTask(new Error(`${task.script} failed with exit code ${code}`))
    })
  })

const main = async () => {
  for (const task of tasks) {
    await runTask(task)
  }
  console.log('\nNew Relic bootstrap completed.')
}

main().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})
