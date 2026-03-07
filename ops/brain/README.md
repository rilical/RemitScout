# Remit-Scout 24/7 Brain (Mac Mini Control Plane)

## What this is
The “brain” is a **local control-plane loop** designed to run 24/7 on an always-on machine (your Mac mini).

It does three things:
1. **Ingest signals** (probe failures, alarms, queue age spikes, SLO breaches).
2. **Create/refresh a Case** under `.remit-scout/cases/<case_id>/` (PRD + Plan).
3. **Select skills** from `.remit-scout/skills/catalog.yaml` to gather evidence (and later: request execution via GitHub Actions / AWS jobs).

## Claw Cage policy (local)
OpenClaw (or any model process) must be treated as untrusted:
- The model process should have **no AWS credentials**.
- Prefer **no GitHub write tokens** in the model process.
- The wrapper brain process can hold tokens, but must enforce:
  - allowlisted operations only
  - risk tier rules
  - prod read-only posture by default

## Current implementation (v1)
- Signal inbox: `ops/brain/inbox/*.json`
- State: `ops/brain/state/brain-state.json` (dedupe)
- Case outputs: `.remit-scout/cases/<case_id>/prd.yaml` and `plan.yaml`
- Outbox (executor requests): `ops/brain/outbox/*.json` (GitHub workflow dispatch requests)
 - (Optional) Slack Case cards: posted to `SLACK_CASES_CHANNEL_ID` when `BRAIN_SLACK_POST_CASE_CARDS=1`
- Triage mode: `BRAIN_TRIAGE_MODE=live|dry_run` (dry-run simulates dispatch, writes outbox status `simulated`, and preserves bounded/rollback evidence notes for replay)

Run locally:
```bash
cd "<repo-root>"
pnpm -C backend brain:once
```

Run continuously:
```bash
cd "<repo-root>"
pnpm -C backend brain:loop
```

Recommended env template:
- `.env.brain.example`

### Signal format (minimal)
Create a file like `ops/brain/inbox/signal-<anything>.json`:
```json
{
  "signal_id": "manual:wise:probe_failure:2026-02-18T00:00:00Z",
  "observed_at": "2026-02-18T00:00:00Z",
  "env": "staging",
  "severity": "sev2",
  "signal_sources": ["aws/cloudwatch"],
  "domain": "provider_health",
  "symptoms": "Provider probe failures detected for wise.",
  "provider_id": "wise",
  "corridor_id": "US-PH-USD-PHP",
  "risk_tier": 1
}
```

Optional case hints envelope (used to auto-seed PRD suspected components):
```json
"case_hints": {
  "suspected_components": {
    "planes": ["plane_b"],
    "services": ["provider-probes"],
    "providers": ["wise"],
    "queues": ["ingest_fanout_tier2"]
  }
}
```

### Signal example: queue backlog
```json
{
  "signal_id": "manual:queue:ingest_fanout_tier2:2026-02-18T00:00:00Z",
  "observed_at": "2026-02-18T00:00:00Z",
  "env": "staging",
  "severity": "sev2",
  "signal_sources": ["slack/manual"],
  "domain": "queue",
  "symptoms": "Queue backlog suspected (oldest age high).",
  "queue_kind": "ingest_fanout_tier2",
  "risk_tier": 1
}
```

### Signal example: API latency
```json
{
  "signal_id": "manual:http_latency:2026-02-18T00:00:00Z",
  "observed_at": "2026-02-18T00:00:00Z",
  "env": "staging",
  "severity": "sev2",
  "signal_sources": ["slack/manual"],
  "domain": "api_latency",
  "symptoms": "Quotes endpoint latency regression suspected.",
  "target_url": "https://example.com/healthz",
  "risk_tier": 1
}
```

### Signal example: indices readiness
```json
{
  "signal_id": "manual:indices:readiness:2026-02-18T00:00:00Z",
  "observed_at": "2026-02-18T00:00:00Z",
  "env": "staging",
  "severity": "sev2",
  "signal_sources": ["slack/manual"],
  "domain": "indices",
  "symptoms": "Gold export indices readiness degraded (missing/suppressed corridors suspected).",
  "risk_tier": 1
}
```

### Signal example: pulse cache lag
```json
{
  "signal_id": "manual:pulse:cache_lag:2026-02-18T00:00:00Z",
  "observed_at": "2026-02-18T00:00:00Z",
  "env": "staging",
  "severity": "sev2",
  "signal_sources": ["slack/manual"],
  "domain": "pulse",
  "symptoms": "Pulse cache appears stale or empty.",
  "risk_tier": 1
}
```

## OpenClaw integration (optional contract)
If you want OpenClaw to recommend skills, set:
- `OPENCLAW_CMD` to a shell command that:
  - reads JSON on stdin
  - writes a JSON decision to stdout with shape:
    - `{ "selected_skills": [{"skill_id":"...", "params":{...}}], "why":"...", "priority": 1 }`

The brain will still enforce allowlists and risk tiers.
If a decider selects skill IDs not present in `.remit-scout/skills/catalog.yaml`, the brain escalates by adding `manual.human_triage` and records the catalog mismatch in the decision rationale.

## GitHub Actions dispatch (optional)
If you want the brain to actually trigger evidence workflows:
- Set `BRAIN_DISPATCH_GITHUB_ACTIONS=1`
- Set `GITHUB_REPOSITORY=owner/repo`
- Set `GITHUB_TOKEN=...` (needs `actions:write` permission)
- Optionally set `GITHUB_REF=main`

Every requested dispatch is always written to `ops/brain/outbox/` for auditability (even if dispatch is disabled).

Dry-run simulation mode:
- Set `BRAIN_TRIAGE_MODE=dry_run` to simulate triage dispatch without calling GitHub Actions APIs.
- Dry-run writes deterministic outbox requests with `status=simulated` and includes bounded/rollback evidence notes to support replay in `live` mode.
- Outbox filenames are timestamp-first (`dispatch-<utc_ts>-<route_order>-...json`) so lexicographic ordering follows request order.
- Ingestion orders pending dispatch records by `requested_at` then `route_order` before applying per-loop limits.
- Keep `BRAIN_TRIAGE_MODE=live` for normal execution.

## GitHub Actions ingestion (optional, closes the loop)
If you want the brain to ingest GitHub Actions evidence artifacts and write durable Run records:
- Set `BRAIN_INGEST_GITHUB_ACTIONS=1`
- (Optional) Set `BRAIN_INGEST_MAX_PER_LOOP=5` to cap ingestion per tick.

Behavior:
- The brain correlates dispatched workflows using `dispatch_id` (uuid).
- It downloads the evidence artifact, extracts `evidence.json`, and writes:
  - `.remit-scout/cases/<case_id>/runs/run-<finished_at_utc_ts>-<dispatch_id>.json`
- It posts a Slack thread reply on the Case card (if Slack is enabled).
- Slack finding summaries redact failure-bundle archive URLs/paths; operators should use `decision_record.rollback_evidence.refs` in the Run record for replay pointers.
- It comments on the linked GitHub Issue (if `links.github_issue` is populated and token has `issues:write`).

## Case index + retention observability
Brain emits one structured observability event per loop:
- `event=issueops_case_index_retention@v1`

The event measures:
- case index health (`indexed_missing_case_dirs`, `unindexed_case_dirs`)
- lifecycle distribution (`open|blocked|closed`)
- retention drift for closed cases + run artifacts

Policy knobs (observe-only; no automatic deletion):
- `BRAIN_CASE_INDEX_RETENTION_DAYS` (default `90`)
- `BRAIN_CASE_RUN_RETENTION_DAYS` (default `90`)

The event always includes bounded evidence + rollback notes so operators can audit and manually execute cleanup safely.

## GitHub Issue creation (optional)
If you want each new Case to open a GitHub Issue automatically:
- Set `BRAIN_CREATE_GITHUB_ISSUE=1`
- Set `GITHUB_REPOSITORY=owner/repo`
- Set `GITHUB_TOKEN=...` (needs `issues:write` permission)

The brain will write the created issue URL into:
`.remit-scout/cases/<case_id>/prd.yaml` → `links.github_issue`.
