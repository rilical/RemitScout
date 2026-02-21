/**
 * Sends email using AWS SES.
 */
export declare const sendEmailViaSes: (to: string | string[], subject: string, body: string, htmlBody?: string) => Promise<boolean>;
/**
 * Sends SMS using AWS SNS.
 */
export declare const sendSmsViaSns: (phoneNumber: string | string[], message: string) => Promise<boolean>;
/**
 * Records CloudWatch metrics for notification delivery.
 */
export declare const recordNotificationMetric: (channel: "email" | "sms" | "webhook", status: "sent" | "failed", count?: number) => Promise<void>;
/**
 * Records CloudWatch metric for notification dispatch duration.
 */
export declare const recordNotificationDuration: (channel: "email" | "sms" | "webhook", durationMs: number) => Promise<void>;
