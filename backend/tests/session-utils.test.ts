import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadModule = async () => {
  vi.resetModules()
  vi.doMock('../shared/config', () => ({
    config: {
      geo: {
        countryHeader: 'x-country-code',
      },
      privacy: {
        hashSalt: 'privacy-hash-salt',
        sessionSalt: 'privacy-session-salt',
        sessionRotationHours: 24,
      },
    },
  }))
  return await import('../plane-a/src/services/session-utils')
}

describe('session-utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-19T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('derives session id from claims', async () => {
    const { deriveSessionId, deriveRotatingSessionId } = await loadModule()
    const request = {
      user: { claims: { session_id: ' sess-123 ' } },
      headers: {},
    } as any

    expect(deriveSessionId(request)).toBe(
      deriveRotatingSessionId('sess-123', new Date('2026-02-19T12:00:00.000Z')),
    )
  })

  it('derives session id from bearer token when claims missing', async () => {
    const { deriveSessionId, deriveRotatingSessionId } = await loadModule()
    const token = 'token-abc'
    const request = {
      user: { claims: {} },
      headers: { authorization: `Bearer ${token}` },
    } as any

    expect(deriveSessionId(request)).toBe(
      deriveRotatingSessionId(token, new Date('2026-02-19T12:00:00.000Z')),
    )
  })

  it('extracts expires at from exp claim', async () => {
    const { extractExpiresAt } = await loadModule()
    const request = {
      user: { claims: { exp: 1700000000 } },
    } as any

    const expiresAt = extractExpiresAt(request)
    expect(expiresAt?.toISOString()).toBe(new Date(1700000000 * 1000).toISOString())
  })

  it('detects device type from user agent', async () => {
    const { detectDeviceType } = await loadModule()

    expect(detectDeviceType('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)')).toBe('tablet')
    expect(detectDeviceType('Mozilla/5.0 (Linux; Android 10; Pixel) Mobile')).toBe('mobile')
    expect(detectDeviceType('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe('desktop')
  })

  it('gets location from headers using configured key', async () => {
    const { getLocationFromHeaders } = await loadModule()
    const headers = { 'x-country-code': 'US' } as any

    expect(getLocationFromHeaders(headers)).toBe('US')
  })

  it('masks ip addresses', async () => {
    const { maskIpAddress } = await loadModule()

    expect(maskIpAddress('192.168.1.9')).toBe('192.168.1.***')
    expect(maskIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3:****')
    expect(maskIpAddress(null)).toBeNull()
  })
})
