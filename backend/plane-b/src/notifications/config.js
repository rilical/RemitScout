"use strict";
/**
 * Notification system configuration.
 *
 * This file centralizes configuration for all notification channels.
 * Uses AWS-native services (SES, SNS) with backward compatibility for third-party services.
 *
 * @deprecated Use config-aws.ts for new code. This file is kept for backward compatibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIGNAL_TYPES = exports.NOTIFICATION_CONFIG = exports.PUSH_CONFIG = exports.SMS_CONFIG = exports.EMAIL_CONFIG = exports.WEBHOOK_CONFIG = void 0;
const config_aws_1 = require("./config-aws");
/**
 * Webhook channel configuration.
 * @deprecated Use getWebhookConfig() from config-aws.ts
 */
exports.WEBHOOK_CONFIG = (0, config_aws_1.getWebhookConfig)();
/**
 * Email channel configuration using AWS SES (default) or SendGrid (legacy).
 * @deprecated Use getEmailConfig() from config-aws.ts
 */
exports.EMAIL_CONFIG = (0, config_aws_1.getEmailConfig)();
/**
 * SMS channel configuration using AWS SNS (default) or Twilio (legacy).
 * @deprecated Use getSmsConfig() from config-aws.ts
 */
exports.SMS_CONFIG = (0, config_aws_1.getSmsConfig)();
/**
 * Push notification configuration (Sprint 4).
 *
 * @sprint Sprint 4: Implement push notifications
 */
exports.PUSH_CONFIG = {
    PROVIDER: process.env.PUSH_PROVIDER || 'firebase',
    API_KEY: process.env.FIREBASE_SERVER_KEY || '',
    MAX_RETRIES: Number(process.env.PUSH_MAX_RETRIES) || 2,
};
/**
 * General notification settings.
 * @deprecated Use getNotificationConfig() from config-aws.ts
 */
exports.NOTIFICATION_CONFIG = (0, config_aws_1.getNotificationConfig)();
/**
 * Signal type constants.
 *
 * @sprint Sprint 4: Add SMART_TIMING and RATE_TARGET signal types
 */
exports.SIGNAL_TYPES = {
    ARBITRAGE_SIGNAL: 'ARBITRAGE_SIGNAL',
};
