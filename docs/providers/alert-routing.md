# Sprint 3 Block Alert Routing

## Default routing
- Slack: send to ops ingestion alerts channel if configured.
- Email: send to ops distribution list if configured.
- DB log: always write a record for every block.

## Fallback
- If Slack or Email is not wired, log only and mark the alert as not_delivered for that sink.
