import { z } from 'zod';
/**
 * Email channel configuration using AWS SES.
 */
export declare const EMAIL_CONFIG_SCHEMA: z.ZodObject<{
    PROVIDER: z.ZodDefault<z.ZodEnum<["ses", "sendgrid"]>>;
    SES_REGION: z.ZodOptional<z.ZodString>;
    SES_FROM_ADDRESS: z.ZodDefault<z.ZodString>;
    SES_FROM_NAME: z.ZodDefault<z.ZodString>;
    SES_REPLY_TO: z.ZodOptional<z.ZodString>;
    SENDGRID_API_KEY: z.ZodOptional<z.ZodString>;
    EMAIL_FROM_ADDRESS: z.ZodOptional<z.ZodString>;
    EMAIL_FROM_NAME: z.ZodOptional<z.ZodString>;
    MAX_RETRIES: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    SES_FROM_ADDRESS: string;
    SES_FROM_NAME: string;
    PROVIDER: "ses" | "sendgrid";
    MAX_RETRIES: number;
    SES_REGION?: string | undefined;
    SES_REPLY_TO?: string | undefined;
    SENDGRID_API_KEY?: string | undefined;
    EMAIL_FROM_ADDRESS?: string | undefined;
    EMAIL_FROM_NAME?: string | undefined;
}, {
    SES_REGION?: string | undefined;
    SES_FROM_ADDRESS?: string | undefined;
    SES_FROM_NAME?: string | undefined;
    SES_REPLY_TO?: string | undefined;
    SENDGRID_API_KEY?: string | undefined;
    EMAIL_FROM_ADDRESS?: string | undefined;
    EMAIL_FROM_NAME?: string | undefined;
    PROVIDER?: "ses" | "sendgrid" | undefined;
    MAX_RETRIES?: number | undefined;
}>;
export type EmailConfig = z.infer<typeof EMAIL_CONFIG_SCHEMA>;
/**
 * SMS channel configuration using AWS SNS.
 */
export declare const SMS_CONFIG_SCHEMA: z.ZodObject<{
    PROVIDER: z.ZodDefault<z.ZodEnum<["sns", "twilio"]>>;
    SNS_REGION: z.ZodOptional<z.ZodString>;
    SNS_TOPIC_ARN: z.ZodOptional<z.ZodString>;
    TWILIO_ACCOUNT_SID: z.ZodOptional<z.ZodString>;
    TWILIO_AUTH_TOKEN: z.ZodOptional<z.ZodString>;
    TWILIO_FROM_NUMBER: z.ZodOptional<z.ZodString>;
    MAX_RETRIES: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    PROVIDER: "sns" | "twilio";
    MAX_RETRIES: number;
    SNS_REGION?: string | undefined;
    SNS_TOPIC_ARN?: string | undefined;
    TWILIO_ACCOUNT_SID?: string | undefined;
    TWILIO_AUTH_TOKEN?: string | undefined;
    TWILIO_FROM_NUMBER?: string | undefined;
}, {
    SNS_REGION?: string | undefined;
    SNS_TOPIC_ARN?: string | undefined;
    TWILIO_ACCOUNT_SID?: string | undefined;
    TWILIO_AUTH_TOKEN?: string | undefined;
    TWILIO_FROM_NUMBER?: string | undefined;
    PROVIDER?: "sns" | "twilio" | undefined;
    MAX_RETRIES?: number | undefined;
}>;
export type SmsConfig = z.infer<typeof SMS_CONFIG_SCHEMA>;
/**
 * Webhook channel configuration.
 */
export declare const WEBHOOK_CONFIG_SCHEMA: z.ZodObject<{
    MAX_RETRIES: z.ZodDefault<z.ZodNumber>;
    TIMEOUT_MS: z.ZodDefault<z.ZodNumber>;
    BACKOFF_BASE_MS: z.ZodDefault<z.ZodNumber>;
    MAX_BACKOFF_MS: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    MAX_RETRIES: number;
    TIMEOUT_MS: number;
    BACKOFF_BASE_MS: number;
    MAX_BACKOFF_MS: number;
}, {
    MAX_RETRIES?: number | undefined;
    TIMEOUT_MS?: number | undefined;
    BACKOFF_BASE_MS?: number | undefined;
    MAX_BACKOFF_MS?: number | undefined;
}>;
export type WebhookConfig = z.infer<typeof WEBHOOK_CONFIG_SCHEMA>;
/**
 * General notification settings.
 */
export declare const NOTIFICATION_CONFIG_SCHEMA: z.ZodObject<{
    PARALLEL_DISPATCH: z.ZodDefault<z.ZodBoolean>;
    MAX_CONCURRENT_DISPATCHES: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    MAX_CONCURRENT_DISPATCHES: number;
    PARALLEL_DISPATCH: boolean;
}, {
    MAX_CONCURRENT_DISPATCHES?: number | undefined;
    PARALLEL_DISPATCH?: boolean | undefined;
}>;
export type NotificationConfig = z.infer<typeof NOTIFICATION_CONFIG_SCHEMA>;
/**
 * Validates and returns email configuration.
 */
export declare const getEmailConfig: () => EmailConfig;
/**
 * Validates and returns SMS configuration.
 */
export declare const getSmsConfig: () => SmsConfig;
/**
 * Validates and returns webhook configuration.
 */
export declare const getWebhookConfig: () => WebhookConfig;
/**
 * Validates and returns notification configuration.
 */
export declare const getNotificationConfig: () => NotificationConfig;
