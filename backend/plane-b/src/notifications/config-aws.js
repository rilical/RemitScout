"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationConfig = exports.getWebhookConfig = exports.getSmsConfig = exports.getEmailConfig = exports.NOTIFICATION_CONFIG_SCHEMA = exports.WEBHOOK_CONFIG_SCHEMA = exports.SMS_CONFIG_SCHEMA = exports.EMAIL_CONFIG_SCHEMA = void 0;
const zod_1 = require("zod");
const config_1 = require("../../../shared/config");
/**
 * AWS-native notification configuration using SES (email) and SNS (SMS).
 * Replaces third-party services (SendGrid, Twilio) with AWS services.
 */
const emailProviderSchema = zod_1.z.enum(['ses', 'sendgrid']).default('ses');
const smsProviderSchema = zod_1.z.enum(['sns', 'twilio']).default('sns');
/**
 * Email channel configuration using AWS SES.
 */
exports.EMAIL_CONFIG_SCHEMA = zod_1.z.object({
    PROVIDER: emailProviderSchema,
    // AWS SES Configuration
    SES_REGION: zod_1.z.string().optional(),
    SES_FROM_ADDRESS: zod_1.z.string().email().default('alerts@remitscout.com'),
    SES_FROM_NAME: zod_1.z.string().default('RemitScout Alerts'),
    SES_REPLY_TO: zod_1.z.string().email().optional(),
    // Legacy SendGrid (for backward compatibility)
    SENDGRID_API_KEY: zod_1.z.string().optional(),
    EMAIL_FROM_ADDRESS: zod_1.z.string().email().optional(),
    EMAIL_FROM_NAME: zod_1.z.string().optional(),
    MAX_RETRIES: zod_1.z.coerce.number().int().min(0).max(10).default(2),
});
/**
 * SMS channel configuration using AWS SNS.
 */
exports.SMS_CONFIG_SCHEMA = zod_1.z.object({
    PROVIDER: smsProviderSchema,
    // AWS SNS Configuration
    SNS_REGION: zod_1.z.string().optional(),
    SNS_TOPIC_ARN: zod_1.z.string().optional(), // Optional: use topic for fan-out
    // Legacy Twilio (for backward compatibility)
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional(),
    TWILIO_AUTH_TOKEN: zod_1.z.string().optional(),
    TWILIO_FROM_NUMBER: zod_1.z.string().optional(),
    MAX_RETRIES: zod_1.z.coerce.number().int().min(0).max(10).default(2),
});
/**
 * Webhook channel configuration.
 */
exports.WEBHOOK_CONFIG_SCHEMA = zod_1.z.object({
    MAX_RETRIES: zod_1.z.coerce.number().int().min(0).max(10).default(3),
    TIMEOUT_MS: zod_1.z.coerce.number().int().min(1000).max(60000).default(5000),
    BACKOFF_BASE_MS: zod_1.z.coerce.number().int().min(100).default(1000),
    MAX_BACKOFF_MS: zod_1.z.coerce.number().int().min(1000).default(8000),
});
/**
 * General notification settings.
 */
exports.NOTIFICATION_CONFIG_SCHEMA = zod_1.z.object({
    PARALLEL_DISPATCH: zod_1.z.coerce.boolean().default(true),
    MAX_CONCURRENT_DISPATCHES: zod_1.z.coerce.number().int().min(1).max(100).default(10),
});
const asOptionalString = (value) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
};
/**
 * Validates and returns email configuration.
 */
const getEmailConfig = () => {
    const result = exports.EMAIL_CONFIG_SCHEMA.safeParse({
        PROVIDER: asOptionalString(config_1.config.communications.email.provider),
        SES_REGION: asOptionalString(config_1.config.communications.email.sesRegion),
        SES_FROM_ADDRESS: asOptionalString(config_1.config.communications.email.sesFromAddress),
        SES_FROM_NAME: asOptionalString(config_1.config.communications.email.sesFromName),
        SES_REPLY_TO: asOptionalString(config_1.config.communications.email.sesReplyTo),
        SENDGRID_API_KEY: asOptionalString(config_1.config.communications.email.sendgridApiKey),
        EMAIL_FROM_ADDRESS: asOptionalString(config_1.config.communications.email.legacyFromAddress),
        EMAIL_FROM_NAME: asOptionalString(config_1.config.communications.email.legacyFromName),
        MAX_RETRIES: config_1.config.communications.email.maxRetries,
    });
    if (!result.success) {
        throw new Error(`Invalid email configuration: ${result.error.message}`);
    }
    return result.data;
};
exports.getEmailConfig = getEmailConfig;
/**
 * Validates and returns SMS configuration.
 */
const getSmsConfig = () => {
    const result = exports.SMS_CONFIG_SCHEMA.safeParse({
        PROVIDER: asOptionalString(config_1.config.communications.sms.provider),
        SNS_REGION: asOptionalString(config_1.config.communications.sms.snsRegion),
        SNS_TOPIC_ARN: asOptionalString(config_1.config.communications.sms.snsTopicArn),
        TWILIO_ACCOUNT_SID: asOptionalString(config_1.config.communications.sms.twilioAccountSid),
        TWILIO_AUTH_TOKEN: asOptionalString(config_1.config.communications.sms.twilioAuthToken),
        TWILIO_FROM_NUMBER: asOptionalString(config_1.config.communications.sms.twilioFromNumber),
        MAX_RETRIES: config_1.config.communications.sms.maxRetries,
    });
    if (!result.success) {
        throw new Error(`Invalid SMS configuration: ${result.error.message}`);
    }
    return result.data;
};
exports.getSmsConfig = getSmsConfig;
/**
 * Validates and returns webhook configuration.
 */
const getWebhookConfig = () => {
    const result = exports.WEBHOOK_CONFIG_SCHEMA.safeParse({
        MAX_RETRIES: config_1.config.communications.webhook.maxRetries,
        TIMEOUT_MS: config_1.config.communications.webhook.timeoutMs,
        BACKOFF_BASE_MS: config_1.config.communications.webhook.backoffBaseMs,
        MAX_BACKOFF_MS: config_1.config.communications.webhook.maxBackoffMs,
    });
    if (!result.success) {
        throw new Error(`Invalid webhook configuration: ${result.error.message}`);
    }
    return result.data;
};
exports.getWebhookConfig = getWebhookConfig;
/**
 * Validates and returns notification configuration.
 */
const getNotificationConfig = () => {
    const result = exports.NOTIFICATION_CONFIG_SCHEMA.safeParse({
        PARALLEL_DISPATCH: config_1.config.communications.dispatch.parallelDispatch,
        MAX_CONCURRENT_DISPATCHES: config_1.config.communications.dispatch.maxConcurrentDispatches,
    });
    if (!result.success) {
        throw new Error(`Invalid notification configuration: ${result.error.message}`);
    }
    return result.data;
};
exports.getNotificationConfig = getNotificationConfig;
