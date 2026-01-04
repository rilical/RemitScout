import { Topic, Subscription, SubscriptionProtocol } from 'aws-cdk-lib/aws-sns'
import type { Construct } from 'constructs'

export type SnsSubscriptionResources = {
  criticalTopic: Topic
  warningTopic: Topic
  opsTopic: Topic
}

export type SnsSubscriptionOptions = {
  envName: string
  slackWebhookUrl?: string
  pagerDutyIntegrationKey?: string
}

const createSlackSubscription = (
  scope: Construct,
  topic: Topic,
  webhookUrl: string,
  channel: string,
): Subscription => {
  // Note: SNS doesn't support filtering by channel in the subscription.
  // If channel-specific routing is needed, use a Lambda function to route messages.
  const subscription = new Subscription(scope, `${topic.node.id}SlackSubscription${channel.replace(/[^a-zA-Z0-9]/g, '')}`, {
    topic,
    protocol: SubscriptionProtocol.HTTPS,
    endpoint: webhookUrl,
  })

  return subscription
}

const createPagerDutySubscription = (
  scope: Construct,
  topic: Topic,
  integrationKey: string,
): Subscription => {
  const subscription = new Subscription(scope, `${topic.node.id}PagerDutySubscription`, {
    topic,
    protocol: SubscriptionProtocol.HTTPS,
    endpoint: `https://events.pagerduty.com/integration/${integrationKey}/enqueue`,
  })

  return subscription
}

export const createSnsSubscriptions = (
  scope: Construct,
  options: SnsSubscriptionOptions,
): SnsSubscriptionResources => {
  const isProd = options.envName === 'prod'

  const criticalTopic = new Topic(scope, 'CriticalAlertsTopic', {
    topicName: `remit-scout-${options.envName}-alerts-critical`,
    displayName: `Remit-Scout ${options.envName} Critical Alerts`,
  })

  const warningTopic = new Topic(scope, 'WarningAlertsTopic', {
    topicName: `remit-scout-${options.envName}-alerts-warning`,
    displayName: `Remit-Scout ${options.envName} Warning Alerts`,
  })

  const opsTopic = new Topic(scope, 'OpsAlertsTopic', {
    topicName: `remit-scout-${options.envName}-alerts-ops`,
    displayName: `Remit-Scout ${options.envName} Ops Alerts`,
  })

  if (options.slackWebhookUrl) {
    createSlackSubscription(scope, criticalTopic, options.slackWebhookUrl, '#alerts-critical')
    createSlackSubscription(scope, warningTopic, options.slackWebhookUrl, '#alerts-warning')
    createSlackSubscription(scope, opsTopic, options.slackWebhookUrl, '#ops-alerts')
  }

  if (options.pagerDutyIntegrationKey) {
    createPagerDutySubscription(scope, criticalTopic, options.pagerDutyIntegrationKey)
  }

  return {
    criticalTopic,
    warningTopic,
    opsTopic,
  }
}

