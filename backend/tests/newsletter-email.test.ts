import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSesSend = vi.fn()

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn().mockImplementation(() => ({ send: mockSesSend })),
  SendEmailCommand: vi.fn().mockImplementation((input) => ({ input })),
}))

const mockQuery = vi.fn()
const mockGetPool = vi.fn().mockReturnValue({})

vi.mock('../shared/db', () => ({
  getPool: () => mockGetPool(),
  query: (...args: any[]) => mockQuery(...args),
}))

const loadModule = async (overrides?: Partial<any>) => {
  vi.resetModules()
  vi.doMock('../shared/config', () => ({
    config: {
      db: { planeAUrl: 'postgres://localhost/test' },
      billing: { stripe: { frontendBaseUrl: 'http://localhost:3000' } },
      newsletter: {
        enabled: true,
        from: 'newsletter@remitscout.test',
        fromName: 'Remit-Scout Newsletter',
        baseUrl: 'http://localhost:3000',
        ...overrides,
      },
    },
  }))
  return await import('../plane-a/src/services/newsletter-email')
}

describe('newsletter-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when email is suppressed', async () => {
    mockQuery.mockResolvedValue({ rows: [{}], rowCount: 1 })

    const { sendConfirmationEmail } = await loadModule()

    await expect(
      sendConfirmationEmail('user@example.com', 'verify-token', 'unsub-token'),
    ).rejects.toThrow('email_suppressed')
  })

  it('throws when from address is missing', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })

    const { sendConfirmationEmail } = await loadModule({ from: '' })

    await expect(
      sendConfirmationEmail('user@example.com', 'verify-token', 'unsub-token'),
    ).rejects.toThrow('newsletter_from_address_missing')
  })

  it('sends confirmation email when enabled', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })

    const { sendConfirmationEmail } = await loadModule()

    await sendConfirmationEmail('user@example.com', 'verify-token', 'unsub-token')

    expect(mockSesSend).toHaveBeenCalledTimes(1)
  })

  it('skips welcome email when disabled', async () => {
    const { sendWelcomeEmail } = await loadModule({ enabled: false })

    await sendWelcomeEmail('user@example.com')

    expect(mockSesSend).not.toHaveBeenCalled()
  })
})
