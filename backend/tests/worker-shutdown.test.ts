import { describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import path from 'node:path'

const fixturePath = path.join(__dirname, 'fixtures', 'worker-shutdown-fixture.ts')
const [nodeMajor] = process.versions.node.split('.').map(Number)
const tsxBootstrapArgs = nodeMajor >= 20 ? ['--import', 'tsx'] : ['--loader', 'tsx']

describe('worker shutdown integration', () => {
  it('stops polling, completes in-flight work, and exits with code 0', async () => {
    const child = spawn(process.execPath, [...tsxBootstrapArgs, fixturePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    })

    let stdout = ''
    let stderr = ''
    let sigtermSent = false

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString('utf8')
      stdout += text
      if (!sigtermSent && text.includes('fixture:poll:1')) {
        sigtermSent = true
        child.kill('SIGTERM')
      }
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8')
    })

    const exitCode = await new Promise<number>((resolve, reject) => {
      child.on('error', reject)
      child.on('exit', (code) => resolve(code ?? 999))
    })

    expect(stderr).toBeDefined()
    expect(exitCode).toBe(0)
    expect(stdout).toContain('fixture:shutdown_requested')
    expect(stdout).toContain('fixture:inflight_done')

    const summaryLine = stdout
      .split('\n')
      .find((line) => line.startsWith('fixture:summary:'))
    expect(summaryLine).toBeDefined()
    const payload = summaryLine!.replace('fixture:summary:', '')
    const summary = JSON.parse(payload) as {
      pollAfterShutdown: number
      inFlightProcessed: boolean
      cleanupRan: boolean
    }
    expect(summary.pollAfterShutdown).toBe(0)
    expect(summary.inFlightProcessed).toBe(true)
    expect(summary.cleanupRan).toBe(true)
  }, 20_000)
})
