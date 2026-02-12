import { describe, expect, it, vi } from 'vitest'
import { withWorkerRetry } from '../shared/worker-retry'

describe('worker retry', () => {
  it('retries transient errors then succeeds', async () => {
    let attempts = 0
    const result = await withWorkerRetry(async () => {
      attempts += 1
      if (attempts < 3) {
        throw new Error('network timeout')
      }
      return 'ok'
    }, { maxRetries: 3, initialDelayMs: 1, maxDelayMs: 5 })

    expect(result).toBe('ok')
    expect(attempts).toBe(3)
  })

  it('honors abort signal', async () => {
    const controller = new AbortController()
    controller.abort()

    const op = vi.fn(async () => 'ok')
    await expect(withWorkerRetry(op, { signal: controller.signal })).rejects.toBeInstanceOf(Error)
  })
})
