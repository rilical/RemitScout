import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { createHash } from 'crypto'
import { sendAlertEmail, sendAlertPush, sendAlertSms, suppressEmail } from '../plane-a/src/services/alert-notifications'
import { sendPushNotification } from '../plane-a/src/services/push-delivery'

const mockSesSend = vi.fn()
const mockSnsSend = vi.fn()

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn().mockImplementation(() => ({ send: mockSesSend })),
  SendEmailCommand: vi.fn().mockImplementation((input) => ({ input })),
  SendRawEmailCommand: vi.fn().mockImplementation((input) => ({ input })),
}))

vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn().mockImplementation(() => ({ send: mockSnsSend })),
}))

vi.mock('../plane-a/src/services/push-delivery', () => ({
  sendPushNotification: vi.fn(),
}))

const originalEnv = { ...process.env }

const createPool = (overrides?: {
  settings?: Record<string, unknown> | null
  pref?: Record<string, unknown> | null
  userEmail?: string | null
  suppressed?: boolean
}): Pool => {
  const settings = overrides?.settings ?? {
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    rate_alerts_enabled: true,
    weekly_summary_enabled: true,
    market_updates_enabled: false,
    product_updates_enabled: true,
    promotional_enabled: false,
  }
  const pref = overrides?.pref ?? {
    unsubscribed: false,
    digest_enabled: true,
    marketing_opt_in: false,
    timezone: 'UTC',
    daily_send_hour: 9,
  }
  const userEmail = overrides?.userEmail ?? 'user@example.com'
  const suppressed = overrides?.suppressed ?? false

  return {
    query: vi.fn(async (sql: string) => {
      if (sql.includes('silver.email_suppression') && sql.includes('INSERT')) {
        return { rows: [] }
      }
      if (sql.includes('silver.notification_settings')) {
        return { rows: settings ? [settings] : [] }
      }
      if (sql.includes('silver.notification_pref')) {
        return { rows: pref ? [pref] : [] }
      }
      if (sql.includes('silver.user_account')) {
        return { rows: userEmail ? [{ email: userEmail }] : [] }
      }
      if (sql.includes('silver.email_suppression')) {
        return { rows: suppressed ? [{}] : [] }
      }
      return { rows: [] }
    }) as any,
  } as Pool
}

describe('alert-notifications', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      ALERTS_EMAIL_ENABLED: '1',
      ALERTS_EMAIL_FROM: 'alerts@remitscout.test',
      ALERTS_EMAIL_FROM_NAME: 'Remit-Scout Alerts',
      ALERT_UNSUBSCRIBE_SECRET: 'test-secret',
    }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('sends alert email when configured and allowed', async () => {
    const pool = createPool() as Pool

    const result = await sendAlertEmail(
      pool,
      'user-1',
      'alert-1',
      'Rate Alert: Test',
      'Rate is above threshold',
    )

    expect(result).toBe(true)
    expect(mockSesSend).toHaveBeenCalledTimes(1)
  })

  it('skips alert email when user unsubscribed', async () => {
    const pool = createPool({
      pref: {
        unsubscribed: true,
        digest_enabled: true,
        marketing_opt_in: false,
        timezone: 'UTC',
        daily_send_hour: 9,
      },
    })

    const result = await sendAlertEmail(
      pool,
      'user-1',
      'alert-1',
      'Rate Alert: Test',
      'Rate is above threshold',
    )

    expect(result).toBe(false)
    expect(mockSesSend).not.toHaveBeenCalled()
  })

  it('skips alert sms when sms is disabled', async () => {
    const pool = createPool({
      settings: {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: false,
        rate_alerts_enabled: true,
        weekly_summary_enabled: true,
        market_updates_enabled: false,
        product_updates_enabled: true,
        promotional_enabled: false,
      },
    })

    const result = await sendAlertSms(pool, 'user-1', 'alert-1', 'SMS message')

    expect(result).toBe(false)
  })

  it('sends alert push when delivery succeeds', async () => {
    const pool = createPool({
      settings: {
        email_enabled: false,
        sms_enabled: false,
        push_enabled: true,
        rate_alerts_enabled: true,
        weekly_summary_enabled: true,
        market_updates_enabled: false,
        product_updates_enabled: true,
        promotional_enabled: false,
      },
    })

    vi.mocked(sendPushNotification).mockResolvedValue({ delivered: 1, failed: 0, skipped: 0 })

    const result = await sendAlertPush(
      pool,
      'user-1',
      'alert-1',
      'Alert',
      'Push body',
    )

    expect(result).toBe(true)
    expect(sendPushNotification).toHaveBeenCalled()
  })

  it('stores hashed email when suppressing', async () => {
    const pool = createPool() as Pool

    await suppressEmail(pool, 'User@Example.com ', 'manual')

    const expectedHash = createHash('sha256').update('user@example.com').digest('hex')
    const queries = (pool.query as ReturnType<typeof vi.fn>).mock.calls
    const insert = queries.find(([sql]) => (sql as string).includes('INSERT INTO silver.email_suppression'))

    expect(insert).toBeTruthy()
    expect(insert?.[1]).toEqual([expectedHash, 'manual'])
  })
})
