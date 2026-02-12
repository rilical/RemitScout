import { describe, expect, it } from 'vitest'

describe('export job repository module', () => {
  it('exports export job repository implementation', async () => {
    const mod = await import('../plane-a/src/repositories/implementations/export-job-repository')
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
