import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalEnv = { ...process.env }

const loadModule = async (secret: string, tokenExpiryHours = 720) => {
  vi.doMock('../shared/config', () => ({
    config: {
      logging: {
        level: 'error',
      },
      runtime: {},
      aws: {
        region: 'us-east-1',
      },
      alerts: {
        unsubscribe: {
          secret,
          baseUrl: 'http://localhost:3000',
          tokenExpiryHours,
        },
      },
      planeA: {
        jwtSecret: '',
      },
    },
  }))

  return await import('../plane-a/src/services/alert-unsubscribe')
}

describe('alert-unsubscribe', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.useRealTimers()
    vi.unmock('../shared/config')
  })

  it('returns null when secret is missing', async () => {
    const { generateAlertUnsubscribeToken } = await loadModule('')

    expect(generateAlertUnsubscribeToken('user-1')).toBeNull()
  })

  it('generates and verifies tokens with a secret', async () => {
    const { generateAlertUnsubscribeToken, verifyAlertUnsubscribeToken } = await loadModule('test-secret')

    const token = generateAlertUnsubscribeToken('user-1')
    expect(token).toBeTruthy()

    const decoded = verifyAlertUnsubscribeToken(token as string)
    expect(decoded).toEqual({ userId: 'user-1' })
  })

  it('rejects expired tokens', async () => {
    const { generateAlertUnsubscribeToken, verifyAlertUnsubscribeToken } = await loadModule('test-secret', -1)

    const token = generateAlertUnsubscribeToken('user-1')
    expect(token).toBeTruthy()

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2099-01-01T00:00:00Z'))

    expect(verifyAlertUnsubscribeToken(token as string)).toBeNull()
  })
})
