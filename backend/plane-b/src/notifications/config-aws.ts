import { z } from 'zod'

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
  SES_FROM_ADDRESS: z.string().email().default('alerts@remitscout.com'),
  SES_FROM_NAME: z.string().default('RemitScout Alerts'),
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

/**
 * Validates and returns email configuration.
 */
export const getEmailConfig = (): EmailConfig => {
  const result = EMAIL_CONFIG_SCHEMA.safeParse({
    PROVIDER: process.env.EMAIL_PROVIDER,
    SES_REGION: process.env.SES_REGION,
    SES_FROM_ADDRESS: process.env.SES_FROM_ADDRESS,
    SES_FROM_NAME: process.env.SES_FROM_NAME,
    SES_REPLY_TO: process.env.SES_REPLY_TO,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    MAX_RETRIES: process.env.EMAIL_MAX_RETRIES,
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
    PROVIDER: process.env.SMS_PROVIDER,
    SNS_REGION: process.env.SNS_REGION,
    SNS_TOPIC_ARN: process.env.SNS_TOPIC_ARN,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
    MAX_RETRIES: process.env.SMS_MAX_RETRIES,
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
    MAX_RETRIES: process.env.WEBHOOK_MAX_RETRIES,
    TIMEOUT_MS: process.env.WEBHOOK_TIMEOUT_MS,
    BACKOFF_BASE_MS: process.env.WEBHOOK_BACKOFF_BASE_MS,
    MAX_BACKOFF_MS: process.env.WEBHOOK_MAX_BACKOFF_MS,
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
    PARALLEL_DISPATCH: process.env.NOTIFICATION_PARALLEL,
    MAX_CONCURRENT_DISPATCHES: process.env.MAX_CONCURRENT_DISPATCHES,
  })

  if (!result.success) {
    throw new Error(`Invalid notification configuration: ${result.error.message}`)
  }

  return result.data
}


