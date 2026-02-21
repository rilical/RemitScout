/**
 * Multi-channel notification dispatcher.
 *
 * This service handles dispatching notifications across multiple channels:
 * - HTTP webhooks (current implementation)
 * - Email (Sprint 4)
 * - SMS (Sprint 4)
 * - Push notifications (Sprint 4)
 * - In-app notifications (Sprint 4)
 *
 * Architecture:
 * 1. Receives signal from anomaly detector
 * 2. Persists signal to history (audit trail)
 * 3. Loads matching subscriptions from database
 * 4. Dispatches to appropriate channels based on subscription preferences
 *
 * @sprint Sprint 4: Add email, SMS, and push channel implementations
 */
import type { Pool } from 'pg';
import type { AnomalyResult } from '../signals/anomaly-detector';
import type { SignalType } from './types';
export type NotificationsQueueMessage = {
    signalType: SignalType | string;
    corridorId: string;
    providerId: string;
    anomaly: {
        zScore: number;
        currentRate: number;
        avg24h: number | null;
        stdDev24h: number | null;
        direction: string | null;
    };
    requestedAt: string;
};
/**
 * Dispatches arbitrage signal to subscribed webhooks.
 *
 * This function orchestrates the entire webhook notification flow:
 * 1. Validates the anomaly result (must be detected with valid Z-score)
 * 2. Persists signal to signal_history table for audit trail
 * 3. Loads active webhook subscriptions matching criteria (corridor/provider/threshold)
 * 4. Sends HTTP POST to each subscriber's webhook URL in parallel
 * 5. Implements retry logic with exponential backoff for failed deliveries
 *
 * **Parallel Delivery**: All webhooks are sent concurrently to minimize latency.
 * **Security**: Each webhook includes HMAC-SHA256 signature for authentication.
 * **Retry Logic**: Up to 3 attempts with exponential backoff (1s, 2s, 4s).
 *
 * @param pool - Database connection pool
 * @param corridorId - Corridor identifier (e.g., 'US-MX-USD-MXN')
 * @param providerId - Provider identifier (e.g., 'remitly')
 * @param anomaly - Detected anomaly result with Z-score and rate deviation
 *
 * @example
 * await dispatchSignal(pool, 'US-MX-USD-MXN', 'remitly', {
 *   detected: true,
 *   zScore: 2.5,
 *   currentRate: 19.85,
 *   avg24h: 19.20,
 *   stdDev24h: 0.26,
 *   direction: 'above'
 * })
 *
 * @sprint Sprint 4: Refactor to support multiple notification channels
 */
export declare const dispatchSignal: (pool: Pool, corridorId: string, providerId: string, anomaly: AnomalyResult) => Promise<void>;
export declare const dispatchQueuedSignal: (pool: Pool, payload: NotificationsQueueMessage) => Promise<void>;
/**
 * @sprint Sprint 4: Add email notification dispatch
 *
 * export const dispatchEmail = async (
 *   userId: string,
 *   payload: EmailPayload
 * ): Promise<void> => {
 *   // Implement SendGrid/SES integration
 * }
 */
/**
 * @sprint Sprint 4: Add SMS notification dispatch
 *
 * export const dispatchSMS = async (
 *   phoneNumber: string,
 *   payload: SmsPayload
 * ): Promise<void> => {
 *   // Implement Twilio/SNS integration
 * }
 */
/**
 * @sprint Sprint 4: Add push notification dispatch
 *
 * export const dispatchPush = async (
 *   deviceToken: string,
 *   payload: PushPayload
 * ): Promise<void> => {
 *   // Implement Firebase/OneSignal integration
 * }
 */
/**
 * @sprint Sprint 4: Add multi-channel dispatch orchestrator
 *
 * export const dispatchMultiChannel = async (
 *   pool: Pool,
 *   signal: Signal,
 *   userPreferences: NotificationPreferences
 * ): Promise<void> => {
 *   const channels: NotificationChannel[] = []
 *
 *   if (userPreferences.email) channels.push('email')
 *   if (userPreferences.sms) channels.push('sms')
 *   if (userPreferences.push) channels.push('push')
 *
 *   // Dispatch to all preferred channels in parallel
 * }
 */
