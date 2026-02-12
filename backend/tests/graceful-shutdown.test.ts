import { describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import path from 'node:path'

const fixturePath = path.join(__dirname, 'fixtures', 'graceful-worker.ts')
const [nodeMajor] = process.versions.node.split('.').map(Number)
const tsxBootstrapArgs = nodeMajor >= 20 ? ['--import', 'tsx'] : ['--loader', 'tsx']

describe('graceful shutdown', () => {
  it('exits 0 on SIGTERM and runs cleanup hooks', async () => {
    const child = spawn(
      process.execPath,
      [...tsxBootstrapArgs, fixturePath],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Keep config minimal for the fixture.
          CLOUDWATCH_ENABLED: '0',
        },
      },
    )

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8')
      if (stdout.includes('fixture:ready')) {
        child.kill('SIGTERM')
      }
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8')
    })

    const exitCode: number = await new Promise((resolve, reject) => {
      child.on('error', reject)
      child.on('exit', (code) => resolve(code ?? 999))
    })

    expect(stderr).toBeDefined()
    expect(exitCode).toBe(0)
    expect(stdout).toContain('fixture:db_end')
    expect(stdout).toContain('fixture:redis_quit')
    expect(stdout).toContain('fixture:on_shutdown')
  }, 20_000)
})
