import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { formatError } from '../../../shared/utils/error-handling'
import { getEmailConfig, getSmsConfig } from './config-aws'

const logger = createLogger('plane-b.notifications.aws-services')

let sesClient: SESClient | null = null
let snsClient: SNSClient | null = null
let cloudWatchClient: CloudWatchClient | null = null

const getSesClient = (region?: string): SESClient => {
  if (!sesClient) {
    sesClient = new SESClient({ region: region || process.env.AWS_REGION || 'us-east-1' })
  }
  return sesClient
}

const getSnsClient = (region?: string): SNSClient => {
  if (!snsClient) {
    snsClient = new SNSClient({ region: region || process.env.AWS_REGION || 'us-east-1' })
  }
  return snsClient
}

const getCloudWatchClient = (): CloudWatchClient => {
  if (!cloudWatchClient) {
    cloudWatchClient = new CloudWatchClient({})
  }
  return cloudWatchClient
}

/**
 * Sends email using AWS SES.
 */
export const sendEmailViaSes = async (
  to: string | string[],
  subject: string,
  body: string,
  htmlBody?: string,
): Promise<boolean> => {
  try {
    const emailConfig = getEmailConfig()
    if (emailConfig.PROVIDER !== 'ses') {
      logger.warn('send_email_wrong_provider', {
        expected: 'ses',
        actual: emailConfig.PROVIDER,
      })
      return false
    }

    const recipients = Array.isArray(to) ? to : [to]
    const client = getSesClient(emailConfig.SES_REGION)

    await client.send(
      new SendEmailCommand({
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
      }),
    )

    // Record CloudWatch metric
    await recordNotificationMetric('email', 'sent', recipients.length)

    logger.info('email_sent_ses', {
      to: recipients,
      subject,
    })
    return true
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.error('email_send_failed_ses', {
      to: Array.isArray(to) ? to : [to],
      error: message,
    })
    await recordNotificationMetric('email', 'failed', 1)
    return false
  }
}

/**
 * Sends SMS using AWS SNS.
 */
export const sendSmsViaSns = async (
  phoneNumber: string | string[],
  message: string,
): Promise<boolean> => {
  try {
    const smsConfig = getSmsConfig()
    if (smsConfig.PROVIDER !== 'sns') {
      logger.warn('send_sms_wrong_provider', {
        expected: 'sns',
        actual: smsConfig.PROVIDER,
      })
      return false
    }

    const client = getSnsClient(smsConfig.SNS_REGION)
    const phoneNumbers = Array.isArray(phoneNumber) ? phoneNumber : [phoneNumber]

    // If topic ARN is configured, publish to topic (fan-out)
    if (smsConfig.SNS_TOPIC_ARN) {
      await client.send(
        new PublishCommand({
          TopicArn: smsConfig.SNS_TOPIC_ARN,
          Message: message,
          MessageAttributes: {
            phoneNumbers: {
              DataType: 'String',
              StringValue: phoneNumbers.join(','),
            },
          },
        }),
      )
    } else {
      // Publish directly to phone numbers
      const publishPromises = phoneNumbers.map((phone) =>
        client.send(
          new PublishCommand({
            PhoneNumber: phone,
            Message: message,
          }),
        ),
      )
      await Promise.all(publishPromises)
    }

    // Record CloudWatch metric
    await recordNotificationMetric('sms', 'sent', phoneNumbers.length)

    logger.info('sms_sent_sns', {
      phone_numbers: phoneNumbers,
    })
    return true
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.error('sms_send_failed_sns', {
      phone_number: Array.isArray(phoneNumber) ? phoneNumber : [phoneNumber],
      error: message,
    })
    await recordNotificationMetric('sms', 'failed', 1)
    return false
  }
}

/**
 * Records CloudWatch metrics for notification delivery.
 */
export const recordNotificationMetric = async (
  channel: 'email' | 'sms' | 'webhook',
  status: 'sent' | 'failed',
  count: number = 1,
): Promise<void> => {
  try {
    if (!config.observability.cloudwatch.enabled) {
      return
    }
    const client = getCloudWatchClient()
    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/Notifications',
        MetricData: [
          {
            MetricName: `${channel}_${status}`,
            Value: count,
            Unit: 'Count',
            Timestamp: new Date(),
          },
        ],
      }),
    )
  } catch (error: unknown) {
    // Silently fail metrics - don't break notification delivery
    logger.debug('notification_metric_failed', {
      channel,
      status,
      error: formatError(error).message,
    })
  }
}

/**
 * Records CloudWatch metric for notification dispatch duration.
 */
export const recordNotificationDuration = async (
  channel: 'email' | 'sms' | 'webhook',
  durationMs: number,
): Promise<void> => {
  try {
    if (!config.observability.cloudwatch.enabled) {
      return
    }
    const client = getCloudWatchClient()
    await client.send(
      new PutMetricDataCommand({
        Namespace: 'RemitScout/Notifications',
        MetricData: [
          {
            MetricName: `${channel}_duration`,
            Value: durationMs,
            Unit: 'Milliseconds',
            Timestamp: new Date(),
          },
        ],
      }),
    )
  } catch (error: unknown) {
    // Silently fail metrics
    logger.debug('notification_duration_metric_failed', {
      channel,
      error: formatError(error).message,
    })
  }
}



