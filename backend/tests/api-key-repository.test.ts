import { describe, expect, it } from 'vitest'

describe('api key repository module', () => {
  it('exports api key repository implementation', async () => {
    const mod = await import('../plane-a/src/repositories/implementations/api-key-repository')
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
