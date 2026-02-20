import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('gold live worker staleness wiring', () => {
  it('drops stale messages before corridor batching', () => {
    const file = path.join(process.cwd(), 'scripts', 'gold-live-worker.ts')
    const content = readFileSync(file, 'utf8')

    expect(content).toContain("unwrapEnvelopeOrLegacy<GoldLiveMessage>")
    expect(content).toContain("'gold_live_message_stale_dropped'")
    expect(content).toContain("'stale_dropped'")
    expect(content).toContain('debouncer.add(payload.corridorId')
  })
})
