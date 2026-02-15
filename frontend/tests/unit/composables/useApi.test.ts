// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from '~/composables/useApi'

describe('createApiClient', () => {
  it('request() sends accept, x-request-id, and authorization headers', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    const client = createApiClient({
      base: '/api/v1',
      fetcher,
      getAccessToken: () => 'token_123',
      makeRequestId: () => 'req_1',
    })

    await client.request('/me')

    expect(fetcher).toHaveBeenCalledTimes(1)
    const [url, init] = fetcher.mock.calls[0] as any[]
    expect(url).toBe('/api/v1/me')
    expect(init.headers.accept).toBe('application/json')
    expect(init.headers['x-request-id']).toBe('req_1')
    expect(init.headers.authorization).toBe('Bearer token_123')
  })

  it('request() retries on 5xx and succeeds', async () => {
    vi.useFakeTimers()
    try {
      const fetcher = vi.fn()
        .mockRejectedValueOnce({ statusCode: 503 })
        .mockRejectedValueOnce({ statusCode: 503 })
        .mockResolvedValueOnce({ ok: true })

      const client = createApiClient({
        base: '/api/v1',
        fetcher,
        makeRequestId: () => 'req_retry',
      })

      const pending = client.request('/me', { retries: 2 })
      await vi.runAllTimersAsync()
      await expect(pending).resolves.toEqual({ ok: true })
      expect(fetcher).toHaveBeenCalledTimes(3)
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('request() does not retry on 4xx', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce({ statusCode: 400, data: { message: 'bad' } })
    const client = createApiClient({
      base: '/api/v1',
      fetcher,
      makeRequestId: () => 'req_4xx',
    })

    await expect(client.request('/me', { retries: 3 })).rejects.toMatchObject({
      message: 'bad',
      statusCode: 400,
      requestId: 'req_4xx',
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('request() respects retries: 0', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce({ statusCode: 503, data: { message: 'down' } })
    const client = createApiClient({
      base: '/api/v1',
      fetcher,
      makeRequestId: () => 'req_0',
    })

    await expect(client.request('/me', { retries: 0 })).rejects.toMatchObject({
      statusCode: 503,
      requestId: 'req_0',
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('request() passes timeout and signal through', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    const controller = new AbortController()
    const client = createApiClient({
      base: '/api/v1',
      fetcher,
      makeRequestId: () => 'req_sig',
    })

    await client.request('/me', { timeoutMs: 1234, signal: controller.signal })

    const [, init] = fetcher.mock.calls[0] as any[]
    expect(init.timeout).toBe(1234)
    expect(init.signal).toBe(controller.signal)
  })

  it('getProviderQuotes() passes correct query params', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    const client = createApiClient({
      base: '/api/v1',
      fetcher,
      makeRequestId: () => 'req_q',
    })

    await client.getProviderQuotes({ from: 'US', to: 'MX', amount: 500, method: 'bank_transfer' as any })
    const [url, init] = fetcher.mock.calls[0] as any[]
    expect(url).toBe('/api/v1/providers')
    expect(init.query).toEqual({ from: 'US', to: 'MX', amount: 500, method: 'bank_transfer' })
  })
})
