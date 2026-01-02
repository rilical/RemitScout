/**
 * Notification system configuration.
 * 
 * This file centralizes configuration for all notification channels.
 * 
 * @sprint Sprint 4: Add email, SMS, and push configuration
 */

/**
 * Webhook channel configuration.
 */
export const WEBHOOK_CONFIG = {
  /** Maximum number of retry attempts for failed webhook deliveries */
  MAX_RETRIES: Number(process.env.WEBHOOK_MAX_RETRIES) || 3,

  /** Request timeout in milliseconds */
  TIMEOUT_MS: Number(process.env.WEBHOOK_TIMEOUT_MS) || 5000,

  /** Base backoff time in milliseconds (exponential backoff: 2^n * BASE) */
  BACKOFF_BASE_MS: Number(process.env.WEBHOOK_BACKOFF_BASE_MS) || 1000,

  /** Maximum backoff time in milliseconds to prevent excessive delays */
  MAX_BACKOFF_MS: Number(process.env.WEBHOOK_MAX_BACKOFF_MS) || 8000,
} as const

/**
 * Email channel configuration (Sprint 4).
 * 
 * @sprint Sprint 4: Implement email delivery
 */
export const EMAIL_CONFIG = {
  PROVIDER: process.env.EMAIL_PROVIDER || 'sendgrid',
  API_KEY: process.env.SENDGRID_API_KEY || '',
  FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || 'alerts@remitscout.com',
  FROM_NAME: process.env.EMAIL_FROM_NAME || 'RemitScout Alerts',
  MAX_RETRIES: Number(process.env.EMAIL_MAX_RETRIES) || 2,
} as const

/**
 * SMS channel configuration (Sprint 4).
 * 
 * @sprint Sprint 4: Implement SMS delivery
 */
export const SMS_CONFIG = {
  PROVIDER: process.env.SMS_PROVIDER || 'twilio',
  ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  FROM_NUMBER: process.env.TWILIO_FROM_NUMBER || '',
  MAX_RETRIES: Number(process.env.SMS_MAX_RETRIES) || 2,
} as const

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
 */
export const NOTIFICATION_CONFIG = {
  /** Whether to dispatch notifications in parallel or sequential */
  PARALLEL_DISPATCH: process.env.NOTIFICATION_PARALLEL === 'false' ? false : true,
  
  /** Maximum concurrent dispatches when parallel mode is enabled */
  MAX_CONCURRENT_DISPATCHES: Number(process.env.MAX_CONCURRENT_DISPATCHES) || 10,
} as const

/**
 * Signal type constants.
 * 
 * @sprint Sprint 4: Add SMART_TIMING and RATE_TARGET signal types
 */
export const SIGNAL_TYPES = {
  ARBITRAGE_SIGNAL: 'ARBITRAGE_SIGNAL',
} as const

export type SignalType = typeof SIGNAL_TYPES[keyof typeof SIGNAL_TYPES]

