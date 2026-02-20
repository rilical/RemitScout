import { describe, expect, it, vi } from 'vitest'

const loadModule = async () => {
  vi.resetModules()
  vi.doMock('../shared/config', () => ({
    config: {
      privacy: {
        hashSalt: 'privacy-hash-salt',
        sessionSalt: 'privacy-session-salt',
        sessionRotationHours: 24,
      },
    },
  }))
  return await import('../plane-a/src/services/privacy-utils')
}

describe('privacy-utils', () => {
  it('anonymizes IPv4 by truncating and hashing', async () => {
    const { anonymizeIpAddress } = await loadModule()

    const result = anonymizeIpAddress('203.0.113.89')
    expect(result.normalizedIp).toBe('203.0.113.89')
    expect(result.truncatedIp).toBe('203.0.113.0')
    expect(result.ipHash).toMatch(/^[a-f0-9]{64}$/)
    expect(result.ipVersion).toBe(4)
  })

  it('anonymizes IPv6 by truncating to /64 and hashing', async () => {
    const { anonymizeIpAddress } = await loadModule()

    const result = anonymizeIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
    expect(result.truncatedIp).toBe('2001:0db8:85a3:0000:0000:0000:0000:0000')
    expect(result.ipHash).toMatch(/^[a-f0-9]{64}$/)
    expect(result.ipVersion).toBe(6)
  })

  it('extracts browser family from user-agent', async () => {
    const { extractBrowserFamily } = await loadModule()

    expect(extractBrowserFamily('Mozilla/5.0 AppleWebKit Chrome/121.0.0.0 Safari/537.36')).toBe('chrome')
    expect(extractBrowserFamily('Mozilla/5.0 Gecko Firefox/122.0')).toBe('firefox')
    expect(extractBrowserFamily('Mozilla/5.0 Version/17.2 Safari/605.1.15')).toBe('safari')
    expect(extractBrowserFamily(null)).toBeNull()
  })

  it('derives deterministic rotating token and rotates with bucket', async () => {
    const { deriveRotatingToken } = await loadModule()

    const dayOne = deriveRotatingToken('session-seed', {
      now: new Date('2026-02-19T10:00:00.000Z'),
      intervalHours: 24,
    })
    const dayOneRepeat = deriveRotatingToken('session-seed', {
      now: new Date('2026-02-19T23:59:59.000Z'),
      intervalHours: 24,
    })
    const dayTwo = deriveRotatingToken('session-seed', {
      now: new Date('2026-02-20T00:00:01.000Z'),
      intervalHours: 24,
    })

    expect(dayOne?.token).toBe(dayOneRepeat?.token)
    expect(dayOne?.token).not.toBe(dayTwo?.token)
  })
})

