import { describe, expect, it, vi } from 'vitest'
import { withAbortTimeout, withTimeout } from '../shared/utils/timeout'

describe('timeout utils', () => {
  it('withTimeout resolves when the promise finishes in time', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 50, 'test')).resolves.toBe('ok')
  })

  it('withTimeout rejects with ETIMEDOUT', async () => {
    const never = new Promise<void>(() => {})
    await expect(withTimeout(never, 10, 'test')).rejects.toMatchObject({
      name: 'TimeoutError',
      code: 'ETIMEDOUT',
    })
  })

  it('withAbortTimeout aborts and rejects with ETIMEDOUT', async () => {
    const fn = vi.fn((signal: AbortSignal) => new Promise<void>((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
    }))

    await expect(withAbortTimeout(fn, 10, 'aws_op')).rejects.toMatchObject({
      name: 'TimeoutError',
      code: 'ETIMEDOUT',
    })
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

