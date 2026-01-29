import { Annotations } from 'aws-cdk-lib'
import { SlackChannelConfiguration, LoggingLevel } from 'aws-cdk-lib/aws-chatbot'
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam'
import { Topic, Subscription, SubscriptionProtocol } from 'aws-cdk-lib/aws-sns'
import type { Construct } from 'constructs'

export type SnsSubscriptionResources = {
  criticalTopic: Topic
  warningTopic: Topic
  opsTopic: Topic
}

export type SnsSubscriptionOptions = {
  envName: string
  slackWorkspaceId?: string
  slackCriticalChannelId?: string
  slackWarningChannelId?: string
  slackOpsChannelId?: string
  slackWebhookUrl?: string
  pagerDutyIntegrationKey?: string
}

const createSlackChannelConfig = (
  scope: Construct,
  topic: Topic,
  envName: string,
  workspaceId: string,
  channelId: string,
  suffix: string,
): SlackChannelConfiguration => {
  return new SlackChannelConfiguration(scope, `Slack${suffix}Channel`, {
    slackChannelConfigurationName: `remit-scout-${envName}-${suffix.toLowerCase()}`,
    slackWorkspaceId: workspaceId,
    slackChannelId: channelId,
    notificationTopics: [topic],
    loggingLevel: LoggingLevel.ERROR,
    guardrailPolicies: [ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess')],
  })
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

  const slackWorkspaceId = options.slackWorkspaceId
  if (slackWorkspaceId) {
    if (options.slackCriticalChannelId) {
      createSlackChannelConfig(
        scope,
        criticalTopic,
        options.envName,
        slackWorkspaceId,
        options.slackCriticalChannelId,
        'Critical',
      )
    }
    if (options.slackWarningChannelId) {
      createSlackChannelConfig(
        scope,
        warningTopic,
        options.envName,
        slackWorkspaceId,
        options.slackWarningChannelId,
        'Warning',
      )
    }
    if (options.slackOpsChannelId) {
      createSlackChannelConfig(
        scope,
        opsTopic,
        options.envName,
        slackWorkspaceId,
        options.slackOpsChannelId,
        'Ops',
      )
    }
  } else if (options.slackWebhookUrl) {
    Annotations.of(scope).addWarning(
      'slackWebhookUrl is configured, but SNS does not send Slack-compatible payloads. Use AWS Chatbot (slackWorkspaceId + channel IDs) or a webhook relay.',
    )
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
