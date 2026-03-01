/**
 * Agent Notifications — lightweight Slack webhook poster for agent events.
 *
 * Posts structured messages to the #agent-ops Slack channel via incoming webhook.
 * Falls back to logging when no webhook URL is configured.
 */

import { config } from './config'
import { createLogger } from './logger'

const logger = createLogger('shared.agent-notifications')

export type AgentNotificationType =
  | 'repair_proposed'
  | 'repair_deployed'
  | 'stress_escalation'
  | 'orchestrator_health'
  | 'knowledge_gap'
  | 'tool_gateway_violation'

export type AgentNotification = {
  type: AgentNotificationType
  title: string
  details: Record<string, unknown>
  severity?: 'info' | 'warning' | 'critical'
}

const SEVERITY_EMOJI: Record<string, string> = {
  info: ':information_source:',
  warning: ':warning:',
  critical: ':rotating_light:',
}

const TYPE_LABELS: Record<AgentNotificationType, string> = {
  repair_proposed: 'Repair Proposed',
  repair_deployed: 'Repair Deployed',
  stress_escalation: 'Stress Escalation',
  orchestrator_health: 'Orchestrator Health',
  knowledge_gap: 'Knowledge Gap',
  tool_gateway_violation: 'Tool Gateway Violation',
}

function buildSlackPayload(notification: AgentNotification): Record<string, unknown> {
  const severity = notification.severity ?? 'info'
  const emoji = SEVERITY_EMOJI[severity] ?? ':robot_face:'
  const label = TYPE_LABELS[notification.type] ?? notification.type

  const detailLines = Object.entries(notification.details)
    .map(([key, value]) => `*${key}:* ${String(value)}`)
    .join('\n')

  return {
    text: `${emoji} *[Agent] ${label}*\n${notification.title}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *[Agent] ${label}*\n${notification.title}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: detailLines || '_No additional details_',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `env: \`${config.envName || 'development'}\` | ${new Date().toISOString()}`,
          },
        ],
      },
    ],
  }
}

/**
 * Send an agent notification to the #agent-ops Slack channel.
 *
 * Returns silently if no webhook URL is configured.
 */
export async function notifyAgent(notification: AgentNotification): Promise<void> {
  const webhookUrl = config.alerts.agentSlackWebhookUrl
  if (!webhookUrl) {
    logger.debug('agent_notification_skipped', {
      type: notification.type,
      reason: 'no webhook URL configured',
    })
    return
  }

  const payload = buildSlackPayload(notification)

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    })

    if (!response.ok) {
      logger.warn('agent_notification_failed', {
        type: notification.type,
        status: response.status,
        statusText: response.statusText,
      })
    }
  } catch (err) {
    logger.warn('agent_notification_error', {
      type: notification.type,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
