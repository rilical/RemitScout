# Status Page and Escalation

## Public Status Page
- Maintain a customer-visible status page for:
  - API availability
  - quote freshness incidents
  - export delivery incidents

## Escalation Path
1. CloudWatch Alarm -> SNS -> PagerDuty.
2. PagerDuty primary on-call acknowledges and opens incident channel.
3. Slack broadcast to ops channel for visibility.
4. Status page updated within 15 minutes for customer-impacting incidents.

## Required Integrations
- PagerDuty routing key configured in environment.
- Slack webhook configured for deploy/security/synthetic failures.
- Synthetic uptime checks enabled (`ops/uptime-synthetic`).

