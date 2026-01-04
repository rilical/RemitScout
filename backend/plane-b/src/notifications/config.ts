/**
 * Notification system configuration.
 * 
 * This file centralizes configuration for all notification channels.
 * Uses AWS-native services (SES, SNS) with backward compatibility for third-party services.
 * 
 * @deprecated Use config-aws.ts for new code. This file is kept for backward compatibility.
 */

import { getEmailConfig, getSmsConfig, getWebhookConfig, getNotificationConfig } from './config-aws'

/**
 * Webhook channel configuration.
 * @deprecated Use getWebhookConfig() from config-aws.ts
 */
export const WEBHOOK_CONFIG = getWebhookConfig()

/**
 * Email channel configuration using AWS SES (default) or SendGrid (legacy).
 * @deprecated Use getEmailConfig() from config-aws.ts
 */
export const EMAIL_CONFIG = getEmailConfig()

/**
 * SMS channel configuration using AWS SNS (default) or Twilio (legacy).
 * @deprecated Use getSmsConfig() from config-aws.ts
 */
export const SMS_CONFIG = getSmsConfig()

/**
 * Push notification configuration (Sprint 4).
 * 
 * @sprint Sprint 4: Implement push notifications
 */
export const PUSH_CONFIG = {
  PROVIDER: process.env.PUSH_PROVIDER || 'firebase',
  API_KEY: process.env.FIREBASE_SERVER_KEY || '',
  MAX_RETRIES: Number(process.env.PUSH_MAX_RETRIES) || 2,
} as const

/**
 * General notification settings.
 * @deprecated Use getNotificationConfig() from config-aws.ts
 */
export const NOTIFICATION_CONFIG = getNotificationConfig()

/**
 * Signal type constants.
 * 
 * @sprint Sprint 4: Add SMART_TIMING and RATE_TARGET signal types
 */
export const SIGNAL_TYPES = {
  ARBITRAGE_SIGNAL: 'ARBITRAGE_SIGNAL',
} as const

export type SignalType = typeof SIGNAL_TYPES[keyof typeof SIGNAL_TYPES]


