import { describe, expect, it } from 'vitest'

describe('health server module', () => {
  it('exports health server functions', async () => {
    const mod = await import('../shared/health-server')
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
