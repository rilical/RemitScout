import { describe, it, expect, vi } from 'vitest'
import { retry } from '../shared/retry'

describe('retry', () => {
  it('returns result on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const result = await retry(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success')

    const result = await retry(fn, { maxRetries: 2, initialDelayMs: 10 })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('exhausts retries and throws last error', async () => {
    const error = new Error('persistent error')
    const fn = vi.fn().mockRejectedValue(error)

    await expect(
      retry(fn, { maxRetries: 2, initialDelayMs: 10 }),
    ).rejects.toThrow('persistent error')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('uses custom maxRetries', async () => {
    const error = new Error('error')
    const fn = vi.fn().mockRejectedValue(error)

    await expect(
      retry(fn, { maxRetries: 1, initialDelayMs: 10 }),
    ).rejects.toThrow('error')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('applies exponential backoff', async () => {
    const startTime = Date.now()
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('success')

    const result = await retry(fn, {
      maxRetries: 2,
      initialDelayMs: 50,
      backoffMultiplier: 2,
      jitter: false,
    })

    const elapsed = Date.now() - startTime
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
    expect(elapsed).toBeGreaterThanOrEqual(50 + 100)
  })

  it('caps delay at maxDelayMs', async () => {
    const startTime = Date.now()
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('success')

    const result = await retry(fn, {
      maxRetries: 2,
      initialDelayMs: 100,
      maxDelayMs: 150,
      backoffMultiplier: 2,
      jitter: false,
    })

    const elapsed = Date.now() - startTime
    expect(result).toBe('success')
    expect(elapsed).toBeLessThan(500)
  })

  it('applies jitter when enabled', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success')

    const result = await retry(fn, {
      maxRetries: 1,
      initialDelayMs: 50,
      jitter: true,
    })

    expect(result).toBe('success')
  })

  it('skips retry when retryable returns false', async () => {
    const error = new Error('non-retryable')
    const fn = vi.fn().mockRejectedValue(error)

    const retryable = vi.fn().mockReturnValue(false)

    await expect(
      retry(fn, {
        maxRetries: 2,
        initialDelayMs: 10,
        retryable,
      }),
    ).rejects.toThrow('non-retryable')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(retryable).toHaveBeenCalledWith(error)
  })

  it('retries when retryable returns true', async () => {
    const error = new Error('retryable')
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success')

    const retryable = vi.fn().mockReturnValue(true)

    const result = await retry(fn, {
      maxRetries: 1,
      initialDelayMs: 10,
      retryable,
    })

    expect(result).toBe('success')
    expect(retryable).toHaveBeenCalledWith(error)
  })

  it('uses default options when none provided', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const result = await retry(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles retryable function that throws', async () => {
    const error = new Error('error')
    const fn = vi.fn().mockRejectedValue(error)

    const retryable = vi.fn().mockImplementation(() => {
      throw new Error('retryable error')
    })

    await expect(
      retry(fn, {
        maxRetries: 1,
        initialDelayMs: 10,
        retryable,
      }),
    ).rejects.toThrow('error')
  })

  it('handles multiple sequential failures with backoff', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockRejectedValueOnce(new Error('fail3'))
      .mockResolvedValue('success')

    const result = await retry(fn, {
      maxRetries: 3,
      initialDelayMs: 20,
      backoffMultiplier: 2,
      jitter: false,
    })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(4)
  })
})

