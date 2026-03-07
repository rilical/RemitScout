import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSesSend = vi.fn()
const mockQuery = vi.fn()

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn().mockImplementation(() => ({ send: mockSesSend })),
  SendEmailCommand: vi.fn().mockImplementation((input) => ({ input })),
}))

vi.mock('../shared/db', () => ({
  query: (...args: any[]) => mockQuery(...args),
}))

const loadModule = async (overrides?: Partial<any>) => {
  vi.resetModules()
  vi.doMock('../shared/config', () => ({
    config: {
      aws: {
        sesRegion: 'us-east-1',
      },
      billing: {
        stripe: {
          frontendBaseUrl: 'https://app.remitscout.test',
        },
      },
      newsletter: {
        baseUrl: 'https://newsletter.remitscout.test',
      },
      email: {
        welcomeEmail: {
          enabled: true,
          from: 'welcome@remitscout.test',
          fromName: 'Remit-Scout',
          ...overrides,
        },
      },
    },
  }))
  return await import('../plane-a/src/services/welcome-email')
}

describe('welcome-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })
  })

  it('returns false when welcome email delivery is disabled', async () => {
    const { sendWelcomeEmail } = await loadModule({ enabled: false })

    const sent = await sendWelcomeEmail({
      pool: {} as any,
      userId: 'user-1',
      email: 'user@example.com',
      name: 'User One',
    })

    expect(sent).toBe(false)
    expect(mockSesSend).not.toHaveBeenCalled()
  })

  it('returns false when the email is suppressed', async () => {
    mockQuery.mockResolvedValue({ rows: [{}], rowCount: 1 })

    const { sendWelcomeEmail } = await loadModule()

    const sent = await sendWelcomeEmail({
      pool: {} as any,
      userId: 'user-1',
      email: 'user@example.com',
      name: 'User One',
    })

    expect(sent).toBe(false)
    expect(mockSesSend).not.toHaveBeenCalled()
  })

  it('sends a welcome email with the dashboard alert CTA when allowed', async () => {
    const { sendWelcomeEmail } = await loadModule()

    const sent = await sendWelcomeEmail({
      pool: {} as any,
      userId: 'user-1',
      email: 'user@example.com',
      name: 'User One',
    })

    expect(sent).toBe(true)
    expect(mockSesSend).toHaveBeenCalledTimes(1)
    expect(mockSesSend.mock.calls[0]?.[0]).toMatchObject({
      input: expect.objectContaining({
        Destination: { ToAddresses: ['user@example.com'] },
        Message: expect.objectContaining({
          Subject: expect.objectContaining({
            Data: 'Welcome to Remit-Scout \u{1f44b}',
          }),
          Body: expect.objectContaining({
            Html: expect.objectContaining({
              Data: expect.stringContaining('/dashboard?tab=alerts&action=new'),
            }),
          }),
        }),
      }),
    })
  })
})
