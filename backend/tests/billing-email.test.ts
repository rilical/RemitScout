import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'

const mockSesSend = vi.fn()

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn().mockImplementation(() => ({ send: mockSesSend })),
  SendEmailCommand: vi.fn().mockImplementation((input) => ({ input })),
}))

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

const mockConfig = {
  billingEmail: {
    enabled: true,
    from: 'billing@remitscout.test',
    fromName: 'Billing',
  },
  communications: { email: { sesRegion: 'us-east-1', sesFromAddress: '' } },
  aws: { sesRegion: 'us-east-1' },
  billing: { stripe: { frontendBaseUrl: 'https://remitscout.test' } },
  alerts: { unsubscribe: { baseUrl: '' } },
  newsletter: { baseUrl: '' },
  planeA: { adminEmails: [] },
}

vi.mock('../shared/config', () => ({
  config: mockConfig,
}))

const loadModule = async () => {
  return await import('../plane-a/src/services/billing-email')
}

describe('billing-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfig.billingEmail.enabled = true
    mockConfig.billingEmail.from = 'billing@remitscout.test'
    mockConfig.billingEmail.fromName = 'Billing'
  })

  it('returns false when user has no email', async () => {
    const { query } = await import('../shared/db')
    vi.mocked(query).mockImplementation(async (sql: string) => {
      if (sql.includes('FROM silver.user_account')) {
        return { rows: [{ email: null }], rowCount: 1 }
      }
      return { rows: [], rowCount: 0 }
    })

    const { sendPlusConfirmationEmail } = await loadModule()

    const result = await sendPlusConfirmationEmail({} as Pool, 'user-1')

    expect(result).toBe(false)
    expect(mockSesSend).not.toHaveBeenCalled()
  })

  it('returns false when email is suppressed', async () => {
    const { query } = await import('../shared/db')
    vi.mocked(query).mockImplementation(async (sql: string) => {
      if (sql.includes('FROM silver.user_account')) {
        return { rows: [{ email: 'user@example.com' }], rowCount: 1 }
      }
      if (sql.includes('FROM silver.email_suppression')) {
        return { rows: [{}], rowCount: 1 }
      }
      return { rows: [], rowCount: 0 }
    })

    const { sendPlusConfirmationEmail } = await loadModule()

    const result = await sendPlusConfirmationEmail({} as Pool, 'user-1')

    expect(result).toBe(false)
    expect(mockSesSend).not.toHaveBeenCalled()
  })

  it('returns false when billing email is disabled', async () => {
    mockConfig.billingEmail.enabled = false

    const { query } = await import('../shared/db')
    vi.mocked(query).mockImplementation(async (sql: string) => {
      if (sql.includes('FROM silver.user_account')) {
        return { rows: [{ email: 'user@example.com' }], rowCount: 1 }
      }
      return { rows: [], rowCount: 0 }
    })

    const { sendPlusConfirmationEmail } = await loadModule()

    const result = await sendPlusConfirmationEmail({} as Pool, 'user-1')

    expect(result).toBe(false)
    expect(mockSesSend).not.toHaveBeenCalled()
  })

  it('sends billing confirmation email when enabled', async () => {
    const { query } = await import('../shared/db')
    vi.mocked(query).mockImplementation(async (sql: string) => {
      if (sql.includes('FROM silver.user_account')) {
        return { rows: [{ email: 'user@example.com' }], rowCount: 1 }
      }
      if (sql.includes('FROM silver.email_suppression')) {
        return { rows: [], rowCount: 0 }
      }
      return { rows: [], rowCount: 0 }
    })

    const { sendPlusConfirmationEmail } = await loadModule()

    const result = await sendPlusConfirmationEmail({} as Pool, 'user-1', { trialDays: 7 })

    expect(result).toBe(true)
    expect(mockSesSend).toHaveBeenCalledTimes(1)
  })
})
