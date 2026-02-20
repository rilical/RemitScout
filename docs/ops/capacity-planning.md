# Capacity Planning (Remit-Scout V2)

## Baseline Assumptions
- Baseline date: `2026-02-20`.
- Expected DAU at launch: `10k`.
- Peak read QPS (Plane A quotes): `250`.
- Peak write/refresh QPS (Plane B queues/workers): `60`.
- Peak internal publisher QPS (Plane C): `40`.

## Scaling Triggers
- Plane A p95 latency:
  - warning at `> 800ms` (prod), `> 1000ms` (staging)
  - critical at `> 1500ms` sustained
- Queue backpressure:
  - queue depth warning `> 1,000`
  - critical `> 5,000` or oldest age above tier thresholds
- DB pressure:
  - `DatabaseConnections` > 80% max
  - `db_connection_pool_waiting` > 5 for 2+ minutes
- Redis pressure:
  - `EngineCPUUtilization` > 70%
  - `CurrConnections` > 80% configured max

## Expansion Playbook
1. Increase ECS desired counts for queue workers before quote traffic scaling.
2. Validate Aurora headroom, then scale reader/instance class as needed.
3. Re-check DLQ and queue age alarms after scaling changes.
4. Re-run load profile (`perf/load-testing`) after each major scaling change.

## Pager Routing
- `critical`: PagerDuty + Slack incident channel
- `warning`: Slack ops channel
- `ops`: Slack ops channel with escalation to on-call

## Quarterly Review Items
- Update DAU/QPS projections against real traffic.
- Recalibrate queue-age and latency thresholds.
- Confirm cost guardrails vs projected peak capacity.

