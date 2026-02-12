import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('export worker script wiring', () => {
  it('uses shutdown handler and worker retry paths', () => {
    const file = path.join(process.cwd(), 'scripts', 'export-worker.ts')
    const content = readFileSync(file, 'utf8')

    expect(content).toContain('createShutdownHandler(')
    expect(content).toContain('withWorkerRetry(')
    expect(content).toContain('signal')
  })
})
