import { z } from 'zod'
import { config } from '../../../shared/config'

/**
 * AWS-native notification configuration using SES (email) and SNS (SMS).
 * Replaces third-party services (SendGrid, Twilio) with AWS services.
 */

const emailProviderSchema = z.enum(['ses', 'sendgrid']).default('ses')
const smsProviderSchema = z.enum(['sns', 'twilio']).default('sns')

/**
 * Email channel configuration using AWS SES.
 */
export const EMAIL_CONFIG_SCHEMA = z.object({
  PROVIDER: emailProviderSchema,
  // AWS SES Configuration
  SES_REGION: z.string().optional(),
  SES_FROM_ADDRESS: z.string().email().default('no-reply@remit-scout.com'),
  SES_FROM_NAME: z.string().default('Remit-Scout Alerts'),
  SES_REPLY_TO: z.string().email().optional(),
  // Legacy SendGrid (for backward compatibility)
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(2),
})

export type EmailConfig = z.infer<typeof EMAIL_CONFIG_SCHEMA>

/**
 * SMS channel configuration using AWS SNS.
 */
export const SMS_CONFIG_SCHEMA = z.object({
  PROVIDER: smsProviderSchema,
  // AWS SNS Configuration
  SNS_REGION: z.string().optional(),
  SNS_TOPIC_ARN: z.string().optional(), // Optional: use topic for fan-out
  // Legacy Twilio (for backward compatibility)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(2),
})

export type SmsConfig = z.infer<typeof SMS_CONFIG_SCHEMA>

/**
 * Webhook channel configuration.
 */
export const WEBHOOK_CONFIG_SCHEMA = z.object({
  MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
  TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(5000),
  BACKOFF_BASE_MS: z.coerce.number().int().min(100).default(1000),
  MAX_BACKOFF_MS: z.coerce.number().int().min(1000).default(8000),
})

export type WebhookConfig = z.infer<typeof WEBHOOK_CONFIG_SCHEMA>

/**
 * General notification settings.
 */
export const NOTIFICATION_CONFIG_SCHEMA = z.object({
  PARALLEL_DISPATCH: z.coerce.boolean().default(true),
  MAX_CONCURRENT_DISPATCHES: z.coerce.number().int().min(1).max(100).default(10),
})

export type NotificationConfig = z.infer<typeof NOTIFICATION_CONFIG_SCHEMA>

const asOptionalString = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

/**
 * Validates and returns email configuration.
 */
export const getEmailConfig = (): EmailConfig => {
  const result = EMAIL_CONFIG_SCHEMA.safeParse({
    PROVIDER: asOptionalString(config.communications.email.provider),
    SES_REGION: asOptionalString(config.communications.email.sesRegion),
    SES_FROM_ADDRESS: asOptionalString(config.communications.email.sesFromAddress),
    SES_FROM_NAME: asOptionalString(config.communications.email.sesFromName),
    SES_REPLY_TO: asOptionalString(config.communications.email.sesReplyTo),
    SENDGRID_API_KEY: asOptionalString(config.communications.email.sendgridApiKey),
    EMAIL_FROM_ADDRESS: asOptionalString(config.communications.email.legacyFromAddress),
    EMAIL_FROM_NAME: asOptionalString(config.communications.email.legacyFromName),
    MAX_RETRIES: config.communications.email.maxRetries,
  })

  if (!result.success) {
    throw new Error(`Invalid email configuration: ${result.error.message}`)
  }

  return result.data
}

/**
 * Validates and returns SMS configuration.
 */
export const getSmsConfig = (): SmsConfig => {
  const result = SMS_CONFIG_SCHEMA.safeParse({
    PROVIDER: asOptionalString(config.communications.sms.provider),
    SNS_REGION: asOptionalString(config.communications.sms.snsRegion),
    SNS_TOPIC_ARN: asOptionalString(config.communications.sms.snsTopicArn),
    TWILIO_ACCOUNT_SID: asOptionalString(config.communications.sms.twilioAccountSid),
    TWILIO_AUTH_TOKEN: asOptionalString(config.communications.sms.twilioAuthToken),
    TWILIO_FROM_NUMBER: asOptionalString(config.communications.sms.twilioFromNumber),
    MAX_RETRIES: config.communications.sms.maxRetries,
  })

  if (!result.success) {
    throw new Error(`Invalid SMS configuration: ${result.error.message}`)
  }

  return result.data
}

/**
 * Validates and returns webhook configuration.
 */
export const getWebhookConfig = (): WebhookConfig => {
  const result = WEBHOOK_CONFIG_SCHEMA.safeParse({
    MAX_RETRIES: config.communications.webhook.maxRetries,
    TIMEOUT_MS: config.communications.webhook.timeoutMs,
    BACKOFF_BASE_MS: config.communications.webhook.backoffBaseMs,
    MAX_BACKOFF_MS: config.communications.webhook.maxBackoffMs,
  })

  if (!result.success) {
    throw new Error(`Invalid webhook configuration: ${result.error.message}`)
  }

  return result.data
}

/**
 * Validates and returns notification configuration.
 */
export const getNotificationConfig = (): NotificationConfig => {
  const result = NOTIFICATION_CONFIG_SCHEMA.safeParse({
    PARALLEL_DISPATCH: config.communications.dispatch.parallelDispatch,
    MAX_CONCURRENT_DISPATCHES: config.communications.dispatch.maxConcurrentDispatches,
  })

  if (!result.success) {
    throw new Error(`Invalid notification configuration: ${result.error.message}`)
  }

  return result.data
}

/**
 * Push notification configuration.
 */
export const PUSH_CONFIG = {
  PROVIDER: config.communications.push.provider,
  API_KEY: config.communications.push.firebaseServerKey,
  MAX_RETRIES: config.communications.push.maxRetries,
} as const

/**
 * Signal type constants.
 */
export const SIGNAL_TYPES = {
  ARBITRAGE_SIGNAL: 'ARBITRAGE_SIGNAL',
} as const

export type SignalType = typeof SIGNAL_TYPES[keyof typeof SIGNAL_TYPES]

