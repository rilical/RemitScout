import webpush from 'web-push'
import {
  SNSClient,
  CreatePlatformEndpointCommand,
  PublishCommand,
  DeleteEndpointCommand,
} from '@aws-sdk/client-sns'
import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { formatError } from '../../../shared/utils/error-handling'

const logger = createLogger('plane-a.push-delivery')

type PushPlatform = 'web' | 'ios' | 'android'

type PushPayload = {
  title: string
  body: string
  url?: string
  icon?: string
}

type DeviceRow = {
  id: string
  user_id: string
  platform: PushPlatform
  token: string | null
  endpoint: string | null
  subscription_json: unknown
  sns_endpoint_arn: string | null
}

type WebPushSubscription = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

type DeliveryResult = {
  delivered: number
  failed: number
  skipped: number
}

let snsClient: SNSClient | null = null
let webPushConfigured = false

const toBoolean = (value: string | undefined) => value === '1' || value === 'true'

const getWebPushConfig = () => {
  const publicKey =
    process.env.PUSH_WEB_VAPID_PUBLIC_KEY ||
    process.env.PUSH_VAPID_PUBLIC_KEY ||
    process.env.PUBLIC_PUSH_VAPID_KEY ||
    ''
  const privateKey =
    process.env.PUSH_WEB_VAPID_PRIVATE_KEY ||
    process.env.PUSH_VAPID_PRIVATE_KEY ||
    ''
  const enabled = toBoolean(process.env.PUSH_WEB_ENABLED) || Boolean(publicKey && privateKey)
  const subject = process.env.PUSH_WEB_VAPID_SUBJECT || process.env.PUSH_VAPID_SUBJECT || 'mailto:no-reply@remit-scout.com'
  return { enabled, publicKey, privateKey, subject }
}

const ensureWebPushConfigured = () => {
  if (webPushConfigured) return true
  const config = getWebPushConfig()
  if (!config.enabled || !config.publicKey || !config.privateKey) {
    return false
  }
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey)
  webPushConfigured = true
  return true
}

const getSnsClient = () => {
  const enabled = toBoolean(process.env.PUSH_SNS_ENABLED)
  if (!enabled) return null
  if (!snsClient) {
    snsClient = new SNSClient({
      region: process.env.SNS_REGION || process.env.AWS_REGION || 'us-east-1',
    })
  }
  return snsClient
}

const getSnsPlatformArn = (platform: PushPlatform) => {
  if (platform === 'ios') {
    return process.env.PUSH_SNS_IOS_PLATFORM_ARN || ''
  }
  if (platform === 'android') {
    return process.env.PUSH_SNS_ANDROID_PLATFORM_ARN || ''
  }
  return ''
}

const getApnsMessageKey = () => {
  return toBoolean(process.env.PUSH_SNS_APNS_SANDBOX) ? 'APNS_SANDBOX' : 'APNS'
}

const parseSubscription = (value: unknown) => {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>
    } catch (error) {
      logger.debug('push_subscription_parse_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }
  if (typeof value === 'object') return value as Record<string, unknown>
  return null
}

const getErrorStatusCode = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') return null
  if (!('statusCode' in error)) return null
  const statusCode = (error as { statusCode?: unknown }).statusCode
  return typeof statusCode === 'number' ? statusCode : null
}

const getErrorName = (error: unknown): string => {
  if (!error || typeof error !== 'object') return ''
  if (!('name' in error)) return ''
  const name = (error as { name?: unknown }).name
  return typeof name === 'string' ? name : ''
}

const listActiveDevices = async (pool: Pool, userId: string): Promise<DeviceRow[]> => {
  const result = await pool.query<DeviceRow>(
    `SELECT id,
            user_id,
            platform,
            token,
            endpoint,
            subscription_json,
            sns_endpoint_arn
     FROM silver.notification_device
     WHERE user_id = $1 AND is_active = TRUE`,
    [userId],
  )
  return result.rows
}

const markDeviceError = async (
  pool: Pool,
  deviceId: string,
  errorMessage: string,
  deactivate: boolean,
) => {
  await pool.query(
    `UPDATE silver.notification_device
     SET last_error = $2,
         last_error_at = NOW(),
         updated_at = NOW(),
         is_active = CASE WHEN $3 THEN FALSE ELSE is_active END
     WHERE id = $1`,
    [deviceId, errorMessage.slice(0, 512), deactivate],
  )
}

const updateDeviceEndpointArn = async (pool: Pool, deviceId: string, arn: string) => {
  await pool.query(
    `UPDATE silver.notification_device
     SET sns_endpoint_arn = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [deviceId, arn],
  )
}

const shouldDeactivateWebPush = (error: unknown) => {
  const statusCode = getErrorStatusCode(error)
  return statusCode === 404 || statusCode === 410
}

const sendWebPush = async (pool: Pool, device: DeviceRow, payload: PushPayload): Promise<boolean> => {
  if (!ensureWebPushConfigured()) {
    logger.debug('web_push_not_configured', { user_id: device.user_id })
    return false
  }

  const subscription = parseSubscription(device.subscription_json)
  const subscriptionObject = subscription && typeof subscription === 'object'
    ? subscription as Record<string, unknown>
    : null
  const endpoint = typeof subscriptionObject?.endpoint === 'string'
    ? subscriptionObject.endpoint
    : null
  const keys = (subscriptionObject?.keys && typeof subscriptionObject.keys === 'object')
    ? subscriptionObject.keys as Record<string, unknown>
    : null
  const p256dh = typeof keys?.p256dh === 'string' ? keys.p256dh : null
  const auth = typeof keys?.auth === 'string' ? keys.auth : null

  if (!endpoint || !p256dh || !auth) {
    await markDeviceError(pool, device.id, 'missing_web_subscription', true)
    return false
  }

  try {
    const payloadJson = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url,
      icon: payload.icon,
    })
    const webSubscription: WebPushSubscription = {
      endpoint,
      keys: {
        p256dh,
        auth,
      },
    }
    await webpush.sendNotification(webSubscription, payloadJson)
    return true
  } catch (error) {
    const { message } = formatError(error)
    await markDeviceError(pool, device.id, message, shouldDeactivateWebPush(error))
    logger.warn('web_push_failed', {
      user_id: device.user_id,
      device_id: device.id,
      error: message,
    })
    return false
  }
}

const buildSnsMessage = (payload: PushPayload, platform: PushPlatform) => {
  const apnsKey = getApnsMessageKey()
  const apnsPayload = {
    aps: {
      alert: {
        title: payload.title,
        body: payload.body,
      },
      sound: 'default',
    },
    url: payload.url,
  }
  const gcmPayload = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      url: payload.url,
    },
  }
  const message: Record<string, string> = {
    default: payload.body,
  }
  if (platform === 'ios') {
    message[apnsKey] = JSON.stringify(apnsPayload)
  } else if (platform === 'android') {
    message.GCM = JSON.stringify(gcmPayload)
  }
  return JSON.stringify(message)
}

const ensureSnsEndpoint = async (pool: Pool, device: DeviceRow) => {
  if (device.sns_endpoint_arn) return device.sns_endpoint_arn
  const client = getSnsClient()
  const platformArn = getSnsPlatformArn(device.platform)
  if (!client || !platformArn || !device.token) {
    return null
  }
  const response = await client.send(
    new CreatePlatformEndpointCommand({
      PlatformApplicationArn: platformArn,
      Token: device.token,
      CustomUserData: device.user_id,
    }),
  )
  if (response.EndpointArn) {
    await updateDeviceEndpointArn(pool, device.id, response.EndpointArn)
    return response.EndpointArn
  }
  return null
}

const shouldDeactivateSns = (error: unknown) => {
  const name = getErrorName(error)
  if (typeof name === 'string' && name.includes('EndpointDisabled')) return true
  return false
}

const sendSnsPush = async (pool: Pool, device: DeviceRow, payload: PushPayload): Promise<boolean> => {
  const client = getSnsClient()
  if (!client) {
    logger.debug('sns_push_not_configured', { user_id: device.user_id })
    return false
  }
  const platformArn = getSnsPlatformArn(device.platform)
  if (!platformArn) {
    logger.debug('sns_platform_missing', { platform: device.platform })
    return false
  }

  try {
    const endpointArn = await ensureSnsEndpoint(pool, device)
    if (!endpointArn) {
      await markDeviceError(pool, device.id, 'missing_sns_endpoint', false)
      return false
    }

    await client.send(
      new PublishCommand({
        TargetArn: endpointArn,
        MessageStructure: 'json',
        Message: buildSnsMessage(payload, device.platform),
      }),
    )
    return true
  } catch (error) {
    const { message } = formatError(error)
    await markDeviceError(pool, device.id, message, shouldDeactivateSns(error))
    logger.warn('sns_push_failed', {
      user_id: device.user_id,
      device_id: device.id,
      error: message,
    })
    if (shouldDeactivateSns(error) && device.sns_endpoint_arn && client) {
      try {
        await client.send(new DeleteEndpointCommand({ EndpointArn: device.sns_endpoint_arn }))
      } catch (cleanupError) {
        logger.debug('sns_endpoint_cleanup_failed', {
          device_id: device.id,
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        })
      }
    }
    return false
  }
}

export const sendPushNotification = async (
  pool: Pool,
  userId: string,
  payload: PushPayload,
): Promise<DeliveryResult> => {
  const devices = await listActiveDevices(pool, userId)
  if (devices.length === 0) {
    return { delivered: 0, failed: 0, skipped: 1 }
  }

  let delivered = 0
  let failed = 0
  let skipped = 0

  for (const device of devices) {
    let success = false
    if (device.platform === 'web') {
      success = await sendWebPush(pool, device, payload)
    } else if (device.platform === 'ios' || device.platform === 'android') {
      if (!device.token) {
        await markDeviceError(pool, device.id, 'missing_mobile_token', false)
        skipped++
        continue
      }
      success = await sendSnsPush(pool, device, payload)
    } else {
      skipped++
      continue
    }

    if (success) delivered++
    else failed++
  }

  return { delivered, failed, skipped }
}
