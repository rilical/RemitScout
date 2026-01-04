/**
 * Notification system types.
 * 
 * This file defines the extensible channel system that will support
 * webhooks, email, SMS, push, and in-app notifications.
 * 
 * @sprint Sprint 4 will add email, SMS, and push channel implementations
 */

export type NotificationChannel = 'webhook' | 'email' | 'sms' | 'push' | 'in_app'

export type SignalType = 'ARBITRAGE_SIGNAL' | 'SMART_TIMING' | 'RATE_TARGET'

/**
 * Base notification payload that all channels must handle.
 * Each channel can extend this with channel-specific fields.
 */
export interface BaseNotificationPayload {
  type: SignalType
  corridor: string
  provider: string
  timestamp: string
  [key: string]: unknown
}

/**
 * Webhook-specific payload (current implementation).
 * 
 * @sprint Sprint 4: Consider unifying with other channel payloads
 */
export interface WebhookPayload extends BaseNotificationPayload {
  type: 'ARBITRAGE_SIGNAL'
  current_rate: number
  avg_24h: number
  deviation_sigma: number
  direction: 'above' | 'below' | 'neutral'
}

/**
 * Email-specific payload (Sprint 4).
 * 
 * @sprint Sprint 4: Implement email channel
 */
export interface EmailPayload extends BaseNotificationPayload {
  subject: string
  htmlBody: string
  textBody: string
  recipientEmail: string
}

/**
 * SMS-specific payload (Sprint 4).
 * 
 * @sprint Sprint 4: Implement SMS channel
 */
export interface SmsPayload extends BaseNotificationPayload {
  message: string
  recipientPhone: string
}

/**
 * Channel delivery interface.
 * All notification channels must implement this interface.
 * 
 * @sprint Sprint 4: Implement for email, SMS, push channels
 */
export interface INotificationChannel<T extends BaseNotificationPayload = BaseNotificationPayload> {
  /**
   * Send notification via this channel.
   * @returns true if delivered successfully, false otherwise
   */
  send(payload: T, destination: string): Promise<boolean>
  
  /**
   * Channel identifier
   */
  readonly channelType: NotificationChannel
  
  /**
   * Maximum retry attempts for this channel
   */
  readonly maxRetries: number
}



