# Observability Architecture

## One-screen quick map
Core monitoring wiring:
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/infrastructure/cdk/lib/monitoring.ts`
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/infrastructure/cdk/lib/scheduled-jobs.ts`
- Ralph loop runtime telemetry: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/scripts/ralph-loop.sh` (`Run observability event=*` includes traceability-tag coverage counters)
- Trace validation runbook: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/ops/tracing-validation.md`

Evidence packs (bounded JSON for agents):
- Schema: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.remit-scout/schema/evidence.schema.json`
- Library: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/scripts/lib/evidence.ts`
- Workflows: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.github/workflows/evidence-*.yml`

## IssueOps escalation observability
- Run records must expose `decision_record.human_in_loop` as the canonical escalation handoff envelope.
- Escalation dashboards should segment by `required`, `status`, and `reason_codes` from `decision_record.human_in_loop`.
- Bounded-evidence and rollback-evidence reviews should use `decision_record.bounded_evidence` and `decision_record.rollback_evidence` together with `human_in_loop.handoff_summary`.
- Slack-visible findings summaries must redact failure-bundle archive pointers; rollback replay uses `decision_record.rollback_evidence.refs` from the Run record.
- Monitor `triage.timebox_exceeded` as a dedicated escalation reason to identify repeated iterate loops and tune evidence skills or runbook routing.
- Monitor `triage.close_case_rationale_missing` as a dedicated escalation reason to identify close-case attempts that lack informational rationale from bounded findings.
- Monitor `triage.timeline_reconstruction_failed` as a dedicated escalation reason to detect event-stream drift (missing/invalid timeline anchors) before incident closure.
- Monitor `issueops_case_index_retention@v1` events from Brain logs; alert when `status=drift` or when indexed/unindexed retention counts are non-zero.
- Retention thresholds for that event are policy-driven (`BRAIN_CASE_INDEX_RETENTION_DAYS`, `BRAIN_CASE_RUN_RETENTION_DAYS`) and should be environment-specific.
- Monitor Brain `brain_triage_mode` startup logs and outbox `triage_mode`/`status` values to distinguish simulation (`dry_run` + `simulated`) from real dispatch failures.

## SLO targets (default)
- API p95 latency:
  - dev <= 1500ms
  - staging <= 1000ms
  - prod <= 800ms
- Freshness p95:
  - tier-1 <= 900s (15m)
  - tier-2 <= 10,800s (3h)
  - dev override tier-2 = 21,600s (6h)
- Quote success rate:
  - tier-1 >= 0.98
  - tier-2 >= 0.95
- Provider coverage:
  - tier-1 >= 3
  - tier-2 >= 3
- DLQ depth must remain 0 across queues.
- Treat missing SLO metrics as SLO failures.

## Indices methodology (high level)
- RCI (cost ratio): weighted average of `(fee + FX markup) / send_amount`
- TEER: `mid_market_rate * (1 - RCI)`
- RVI: dispersion of effective rates; published as bps relative to TEER

See `backend/scripts/provider-weighting-job.ts` and `backend/scripts/data-health-slo-job.ts` for implementation details.
