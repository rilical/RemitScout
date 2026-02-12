import { describe, expect, it } from 'vitest'
import { applyJitter } from '../shared/worker-jitter'

describe('worker jitter', () => {
  it('does not throw for positive jitter values', async () => {
    const logger = { debug: () => undefined }
    await expect(applyJitter(logger, 'test', 10)).resolves.toBeUndefined()
  })

  it('returns immediately when jitter is zero', async () => {
    const logger = { debug: () => undefined }
    await expect(applyJitter(logger, 'test', 0)).resolves.toBeUndefined()
  })
})
