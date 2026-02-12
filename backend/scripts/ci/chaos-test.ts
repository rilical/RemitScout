/**
 * Chaos test runner (best-effort).
 *
 * This is intentionally safe-by-default: it runs local invariants and
 * process-level shutdown checks that do not require AWS credentials.
 *
 * For deeper chaos (Redis/DB/SQS disruption in staging), run this script
 * with environment-specific harnesses (TODO).
 */

import { spawn } from 'node:child_process'
import path from 'node:path'

const runFixtureShutdown = async () => {
  const fixturePath = path.join(__dirname, '..', '..', 'tests', 'fixtures', 'graceful-worker.ts')
  const [nodeMajor] = process.versions.node.split('.').map(Number)
  const tsxBootstrapArgs = nodeMajor >= 20 ? ['--import', 'tsx'] : ['--loader', 'tsx']
  const child = spawn(process.execPath, [...tsxBootstrapArgs, fixturePath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CLOUDWATCH_ENABLED: '0' },
  })

  let stdout = ''
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString('utf8')
    if (stdout.includes('fixture:ready')) {
      child.kill('SIGTERM')
    }
  })

  const exitCode: number = await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('exit', (code) => resolve(code ?? 999))
  })

  if (exitCode !== 0) {
    throw new Error(`chaos_test_shutdown_failed: exit_code=${exitCode}`)
  }
}

const main = async () => {
  await runFixtureShutdown()
  console.log('chaos-test:ok')
}

main().catch((error) => {
  console.error('chaos-test:failed', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
