import { describe, expect, it } from 'vitest'

describe('aws params module', () => {
  it('exports parameter resolution helpers', async () => {
    const mod = await import('../shared/aws-params')
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
