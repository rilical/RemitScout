import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('oanda rates sync script wiring', () => {
  it('uses shutdown-aware execution', () => {
    const file = path.join(process.cwd(), 'scripts', 'oanda-rates-sync.ts')
    const content = readFileSync(file, 'utf8')

    expect(content).toContain('createShutdownHandler(')
    expect(content).toContain('isShutdownRequested')
  })
})
