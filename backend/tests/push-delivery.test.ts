import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'

const mockWebPushSetVapidDetails = vi.fn()
const mockWebPushSendNotification = vi.fn()
const mockSnsSend = vi.fn()

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: mockWebPushSetVapidDetails,
    sendNotification: mockWebPushSendNotification,
  },
}))

vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn().mockImplementation(() => ({ send: mockSnsSend })),
  CreatePlatformEndpointCommand: vi.fn().mockImplementation((input) => ({
    __type: 'CreatePlatformEndpointCommand',
    input,
  })),
  PublishCommand: vi.fn().mockImplementation((input) => ({
    __type: 'PublishCommand',
    input,
  })),
  DeleteEndpointCommand: vi.fn().mockImplementation((input) => ({
    __type: 'DeleteEndpointCommand',
    input,
  })),
}))

const originalEnv = { ...process.env }

const createPool = (devices: any[]): Pool => {
  return {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      if (sql.includes('FROM silver.notification_device')) {
        return { rows: devices }
      }
      return { rows: [], params }
    }) as any,
  } as Pool
}

const loadModule = async () => {
  vi.resetModules()
  return await import('../plane-a/src/services/push-delivery')
}

describe('push-delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('returns skipped when no devices are registered', async () => {
    const { sendPushNotification } = await loadModule()
    const pool = createPool([])

    const result = await sendPushNotification(pool, 'user-1', {
      title: 'Alert',
      body: 'Body',
    })

    expect(result).toEqual({ delivered: 0, failed: 0, skipped: 1 })
  })

  it('delivers web push when configured', async () => {
    process.env.PUSH_WEB_VAPID_PUBLIC_KEY = 'public-key'
    process.env.PUSH_WEB_VAPID_PRIVATE_KEY = 'private-key'
    process.env.PUSH_WEB_ENABLED = '1'

    const { sendPushNotification } = await loadModule()

    const pool = createPool([
      {
        id: 'device-1',
        user_id: 'user-1',
        platform: 'web',
        token: null,
        endpoint: null,
        subscription_json: {
          endpoint: 'https://push.example.com',
          keys: { p256dh: 'p', auth: 'a' },
        },
        sns_endpoint_arn: null,
      },
    ])

    const result = await sendPushNotification(pool, 'user-1', {
      title: 'Alert',
      body: 'Body',
    })

    expect(result.delivered).toBe(1)
    expect(mockWebPushSetVapidDetails).toHaveBeenCalled()
    expect(mockWebPushSendNotification).toHaveBeenCalledTimes(1)
  })

  it('marks missing mobile token as skipped', async () => {
    const { sendPushNotification } = await loadModule()

    const pool = createPool([
      {
        id: 'device-2',
        user_id: 'user-1',
        platform: 'ios',
        token: null,
        endpoint: null,
        subscription_json: null,
        sns_endpoint_arn: null,
      },
    ])

    const result = await sendPushNotification(pool, 'user-1', {
      title: 'Alert',
      body: 'Body',
    })

    expect(result).toEqual({ delivered: 0, failed: 0, skipped: 1 })

    const updateCall = (pool.query as ReturnType<typeof vi.fn>).mock.calls.find(([sql]) =>
      (sql as string).includes('UPDATE silver.notification_device'),
    )
    expect(updateCall?.[1]).toContain('missing_mobile_token')
  })

  it('sends SNS push and stores endpoint arn', async () => {
    process.env.PUSH_SNS_ENABLED = '1'
    process.env.PUSH_SNS_IOS_PLATFORM_ARN = 'arn:aws:sns:us-east-1:123:ios'

    mockSnsSend.mockImplementation(async (command: any) => {
      if (command.__type === 'CreatePlatformEndpointCommand') {
        return { EndpointArn: 'arn:endpoint:1' }
      }
      return {}
    })

    const { sendPushNotification } = await loadModule()

    const pool = createPool([
      {
        id: 'device-3',
        user_id: 'user-1',
        platform: 'ios',
        token: 'token-1',
        endpoint: null,
        subscription_json: null,
        sns_endpoint_arn: null,
      },
    ])

    const result = await sendPushNotification(pool, 'user-1', {
      title: 'Alert',
      body: 'Body',
    })

    expect(result.delivered).toBe(1)
    expect(mockSnsSend).toHaveBeenCalledTimes(2)

    const updateCall = (pool.query as ReturnType<typeof vi.fn>).mock.calls.find(([sql]) =>
      (sql as string).includes('SET sns_endpoint_arn'),
    )
    expect(updateCall?.[1]).toContain('arn:endpoint:1')
  })
})
