"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordNotificationDuration = exports.recordNotificationMetric = exports.sendSmsViaSns = exports.sendEmailViaSes = void 0;
const client_ses_1 = require("@aws-sdk/client-ses");
const client_sns_1 = require("@aws-sdk/client-sns");
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
const config_1 = require("../../../shared/config");
const logger_1 = require("../../../shared/logger");
const error_handling_1 = require("../../../shared/utils/error-handling");
const config_aws_1 = require("./config-aws");
const logger = (0, logger_1.createLogger)('plane-b.notifications.aws-services');
let sesClient = null;
let snsClient = null;
let cloudWatchClient = null;
const getSesClient = (region) => {
    if (!sesClient) {
        sesClient = new client_ses_1.SESClient({ region: region || process.env.AWS_REGION || 'us-east-1' });
    }
    return sesClient;
};
const getSnsClient = (region) => {
    if (!snsClient) {
        snsClient = new client_sns_1.SNSClient({ region: region || process.env.AWS_REGION || 'us-east-1' });
    }
    return snsClient;
};
const getCloudWatchClient = () => {
    if (!cloudWatchClient) {
        cloudWatchClient = new client_cloudwatch_1.CloudWatchClient({});
    }
    return cloudWatchClient;
};
/**
 * Sends email using AWS SES.
 */
const sendEmailViaSes = async (to, subject, body, htmlBody) => {
    try {
        const emailConfig = (0, config_aws_1.getEmailConfig)();
        if (emailConfig.PROVIDER !== 'ses') {
            logger.warn('send_email_wrong_provider', {
                expected: 'ses',
                actual: emailConfig.PROVIDER,
            });
            return false;
        }
        const recipients = Array.isArray(to) ? to : [to];
        const client = getSesClient(emailConfig.SES_REGION);
        await client.send(new client_ses_1.SendEmailCommand({
            Source: `${emailConfig.SES_FROM_NAME} <${emailConfig.SES_FROM_ADDRESS}>`,
            Destination: {
                ToAddresses: recipients,
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8',
                },
                Body: {
                    Text: {
                        Data: body,
                        Charset: 'UTF-8',
                    },
                    ...(htmlBody
                        ? {
                            Html: {
                                Data: htmlBody,
                                Charset: 'UTF-8',
                            },
                        }
                        : {}),
                },
            },
            ReplyToAddresses: emailConfig.SES_REPLY_TO ? [emailConfig.SES_REPLY_TO] : undefined,
        }));
        // Record CloudWatch metric
        await (0, exports.recordNotificationMetric)('email', 'sent', recipients.length);
        logger.info('email_sent_ses', {
            to: recipients,
            subject,
        });
        return true;
    }
    catch (error) {
        const { message } = (0, error_handling_1.formatError)(error);
        logger.error('email_send_failed_ses', {
            to: Array.isArray(to) ? to : [to],
            error: message,
        });
        await (0, exports.recordNotificationMetric)('email', 'failed', 1);
        return false;
    }
};
exports.sendEmailViaSes = sendEmailViaSes;
/**
 * Sends SMS using AWS SNS.
 */
const sendSmsViaSns = async (phoneNumber, message) => {
    try {
        const smsConfig = (0, config_aws_1.getSmsConfig)();
        if (smsConfig.PROVIDER !== 'sns') {
            logger.warn('send_sms_wrong_provider', {
                expected: 'sns',
                actual: smsConfig.PROVIDER,
            });
            return false;
        }
        const client = getSnsClient(smsConfig.SNS_REGION);
        const phoneNumbers = Array.isArray(phoneNumber) ? phoneNumber : [phoneNumber];
        // If topic ARN is configured, publish to topic (fan-out)
        if (smsConfig.SNS_TOPIC_ARN) {
            await client.send(new client_sns_1.PublishCommand({
                TopicArn: smsConfig.SNS_TOPIC_ARN,
                Message: message,
                MessageAttributes: {
                    phoneNumbers: {
                        DataType: 'String',
                        StringValue: phoneNumbers.join(','),
                    },
                },
            }));
        }
        else {
            // Publish directly to phone numbers
            const publishPromises = phoneNumbers.map((phone) => client.send(new client_sns_1.PublishCommand({
                PhoneNumber: phone,
                Message: message,
            })));
            await Promise.all(publishPromises);
        }
        // Record CloudWatch metric
        await (0, exports.recordNotificationMetric)('sms', 'sent', phoneNumbers.length);
        logger.info('sms_sent_sns', {
            phone_numbers: phoneNumbers,
        });
        return true;
    }
    catch (error) {
        const { message } = (0, error_handling_1.formatError)(error);
        logger.error('sms_send_failed_sns', {
            phone_number: Array.isArray(phoneNumber) ? phoneNumber : [phoneNumber],
            error: message,
        });
        await (0, exports.recordNotificationMetric)('sms', 'failed', 1);
        return false;
    }
};
exports.sendSmsViaSns = sendSmsViaSns;
/**
 * Records CloudWatch metrics for notification delivery.
 */
const recordNotificationMetric = async (channel, status, count = 1) => {
    try {
        if (!config_1.config.observability.cloudwatch.enabled) {
            return;
        }
        const client = getCloudWatchClient();
        await client.send(new client_cloudwatch_1.PutMetricDataCommand({
            Namespace: 'RemitScout/Notifications',
            MetricData: [
                {
                    MetricName: `${channel}_${status}`,
                    Value: count,
                    Unit: 'Count',
                    Timestamp: new Date(),
                },
            ],
        }));
    }
    catch (error) {
        // Silently fail metrics - don't break notification delivery
        logger.debug('notification_metric_failed', {
            channel,
            status,
            error: (0, error_handling_1.formatError)(error).message,
        });
    }
};
exports.recordNotificationMetric = recordNotificationMetric;
/**
 * Records CloudWatch metric for notification dispatch duration.
 */
const recordNotificationDuration = async (channel, durationMs) => {
    try {
        if (!config_1.config.observability.cloudwatch.enabled) {
            return;
        }
        const client = getCloudWatchClient();
        await client.send(new client_cloudwatch_1.PutMetricDataCommand({
            Namespace: 'RemitScout/Notifications',
            MetricData: [
                {
                    MetricName: `${channel}_duration`,
                    Value: durationMs,
                    Unit: 'Milliseconds',
                    Timestamp: new Date(),
                },
            ],
        }));
    }
    catch (error) {
        // Silently fail metrics
        logger.debug('notification_duration_metric_failed', {
            channel,
            error: (0, error_handling_1.formatError)(error).message,
        });
    }
};
exports.recordNotificationDuration = recordNotificationDuration;
