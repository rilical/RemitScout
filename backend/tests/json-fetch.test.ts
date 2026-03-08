import { afterEach, describe, expect, it, vi } from 'vitest'

import { jsonFetch, parseJsonishText } from '../scripts/ci/json-fetch'

describe('json-fetch helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses JSON-looking text bodies into objects', () => {
    expect(parseJsonishText('{"access_token":"admin-token"}')).toEqual({
      access_token: 'admin-token',
    })

    expect(parseJsonishText('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('keeps non-JSON text bodies as strings', () => {
    expect(parseJsonishText('<html>not json</html>')).toBe('<html>not json</html>')
  })

  it('parses JSON-looking text/plain responses for smoke scripts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      headers: {
        get: vi.fn().mockReturnValue('text/plain; charset=utf-8'),
      },
      text: vi.fn().mockResolvedValue('{"success":true,"rows":[]}'),
      json: vi.fn(),
    }))

    const { status, body } = await jsonFetch<{ success?: boolean; rows?: unknown[] }>('https://example.test/api')

    expect(status).toBe(200)
    expect(body).toEqual({ success: true, rows: [] })
  })

  it('keeps non-JSON text/plain responses as strings', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      headers: {
        get: vi.fn().mockReturnValue('text/plain; charset=utf-8'),
      },
      text: vi.fn().mockResolvedValue('ok'),
      json: vi.fn(),
    }))

    const { body } = await jsonFetch<string>('https://example.test/api')

    expect(body).toBe('ok')
  })
})
