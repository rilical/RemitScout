import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('b2c refresh worker script wiring', () => {
  it('passes shutdown signal into queue processing', () => {
    const file = path.join(process.cwd(), 'scripts', 'b2c-refresh-worker.ts')
    const content = readFileSync(file, 'utf8')

    expect(content).toContain('createShutdownHandler(')
    expect(content).toContain('processQuoteRefreshQueue({ signal')
  })
})
