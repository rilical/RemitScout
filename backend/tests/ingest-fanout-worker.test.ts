import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('ingest fanout worker script wiring', () => {
  it('uses shutdown handler and retry', () => {
    const file = path.join(process.cwd(), 'scripts', 'ingest-fanout-worker.ts')
    const content = readFileSync(file, 'utf8')

    expect(content).toContain('createShutdownHandler(')
    expect(content).toContain('withWorkerRetry(')
  })
})
