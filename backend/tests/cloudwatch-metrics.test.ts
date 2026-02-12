import { describe, expect, it } from 'vitest'

describe('cloudwatch metrics module', () => {
  it('exports cloudwatch metric functions', async () => {
    const mod = await import('../shared/cloudwatch-metrics')
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
