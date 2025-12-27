import { describe, it, expect } from 'vitest'

describe('Gold export guardrails', () => {
  it('documents gold-only export requirement', () => {
    // TODO: assert export queries do not read silver.* or bronze.* tables.
    // Example checks:
    // - scan export SQL for forbidden schemas
    // - verify data sources are gold.* only
    expect(true).toBe(true)
  })
})
