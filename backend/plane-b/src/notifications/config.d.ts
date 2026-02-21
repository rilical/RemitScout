/**
 * Notification system configuration.
 *
 * This file centralizes configuration for all notification channels.
 * Uses AWS-native services (SES, SNS) with backward compatibility for third-party services.
 *
 * @deprecated Use config-aws.ts for new code. This file is kept for backward compatibility.
 */
/**
 * Webhook channel configuration.
 * @deprecated Use getWebhookConfig() from config-aws.ts
 */
export declare const WEBHOOK_CONFIG: {
    MAX_RETRIES: number;
    TIMEOUT_MS: number;
    BACKOFF_BASE_MS: number;
    MAX_BACKOFF_MS: number;
};
/**
 * Email channel configuration using AWS SES (default) or SendGrid (legacy).
 * @deprecated Use getEmailConfig() from config-aws.ts
 */
export declare const EMAIL_CONFIG: {
    SES_FROM_ADDRESS: string;
    SES_FROM_NAME: string;
    PROVIDER: "ses" | "sendgrid";
    MAX_RETRIES: number;
    SES_REGION?: string | undefined;
    SES_REPLY_TO?: string | undefined;
    SENDGRID_API_KEY?: string | undefined;
    EMAIL_FROM_ADDRESS?: string | undefined;
    EMAIL_FROM_NAME?: string | undefined;
};
/**
 * SMS channel configuration using AWS SNS (default) or Twilio (legacy).
 * @deprecated Use getSmsConfig() from config-aws.ts
 */
export declare const SMS_CONFIG: {
    PROVIDER: "sns" | "twilio";
    MAX_RETRIES: number;
    SNS_REGION?: string | undefined;
    SNS_TOPIC_ARN?: string | undefined;
    TWILIO_ACCOUNT_SID?: string | undefined;
    TWILIO_AUTH_TOKEN?: string | undefined;
    TWILIO_FROM_NUMBER?: string | undefined;
};
/**
 * Push notification configuration (Sprint 4).
 *
 * @sprint Sprint 4: Implement push notifications
 */
export declare const PUSH_CONFIG: {
    readonly PROVIDER: string;
    readonly API_KEY: string;
    readonly MAX_RETRIES: number;
};
/**
 * General notification settings.
 * @deprecated Use getNotificationConfig() from config-aws.ts
 */
export declare const NOTIFICATION_CONFIG: {
    MAX_CONCURRENT_DISPATCHES: number;
    PARALLEL_DISPATCH: boolean;
};
/**
 * Signal type constants.
 *
 * @sprint Sprint 4: Add SMART_TIMING and RATE_TARGET signal types
 */
export declare const SIGNAL_TYPES: {
    readonly ARBITRAGE_SIGNAL: "ARBITRAGE_SIGNAL";
};
export type SignalType = typeof SIGNAL_TYPES[keyof typeof SIGNAL_TYPES];
