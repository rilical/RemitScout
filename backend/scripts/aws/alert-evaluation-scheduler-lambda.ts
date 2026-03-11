import { resolveAwsEnv } from '../../shared/aws-params'
import { createLogger } from '../../shared/logger'
import { sendJsonMessage } from '../../shared/sqs'

const logger = createLogger('script.alert-evaluation-scheduler')

type SchedulerEvent = {
  frequency?: 'weekly' | 'daily'
}

const toBoolean = (value: string | undefined) => value === '1' || value === 'true'

export const handler = async (event: SchedulerEvent = {}): Promise<{ status: string; frequency: string }> => {
  try {
    await resolveAwsEnv([
      {
        envVar: 'ALERT_EVALUATION_QUEUE_URL',
        secretArnEnv: 'ALERT_EVALUATION_QUEUE_SECRET_ARN',
        ssmNameEnv: 'ALERT_EVALUATION_QUEUE_SSM_NAME',
        jsonKeys: ['url', 'ALERT_EVALUATION_QUEUE_URL'],
        required: false,
      },
    ])

    const enabled =
      process.env.ALERT_EVALUATION_ENABLED !== undefined
        ? toBoolean(process.env.ALERT_EVALUATION_ENABLED)
        : true

    const rawFrequency = (event.frequency ||
      process.env.ALERT_EVALUATION_FREQUENCY ||
      'weekly') as string
    const frequency = rawFrequency === 'daily' ? 'daily' : 'weekly'

    if (!enabled) {
      logger.info('alert_evaluation_scheduler_disabled', { frequency })
      return { status: 'disabled', frequency }
    }

    const queueUrl = process.env.ALERT_EVALUATION_QUEUE_URL || ''
    if (!queueUrl) {
      logger.warn('alert_evaluation_queue_missing', { frequency })
      return { status: 'skipped', frequency }
    }

    const message: { frequency: string; timeBucket?: number } = { frequency }
    if (frequency === 'daily' || frequency === 'weekly') {
      message.timeBucket = new Date().getUTCHours()
    }

    await sendJsonMessage(queueUrl, message)
    logger.info('alert_evaluation_enqueued', { frequency, time_bucket: message.timeBucket })

    return { status: 'ok', frequency }
  } catch (error) {
    logger.error('handler_error', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}
