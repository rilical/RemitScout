import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('export worker script wiring', () => {
  it('keeps the compatibility entrypoint wired to the queue worker implementation', () => {
    const entryFile = path.join(process.cwd(), 'scripts', 'export-worker.ts')
    const workerFile = path.join(process.cwd(), 'scripts', 'export-queue-worker.ts')
    const entryContent = readFileSync(entryFile, 'utf8')
    const workerContent = readFileSync(workerFile, 'utf8')

    expect(entryContent).toContain("runExportWorker")
    expect(entryContent).toContain("runQueueWorker")
    expect(entryContent).toContain("runDbWorker")

    expect(workerContent).toContain('createShutdownHandler(')
    expect(workerContent).toContain('withWorkerRetry(')
    expect(workerContent).toContain('signal')
  })
})
