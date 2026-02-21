# Dev Pause/Resume (CDK + OpsPause)

## Why this exists
Dev is intentionally paused most of the time to avoid background cost
(ECS services + scheduled Lambdas + database IO).

We use **two layers**:
1) **CDK `devPaused`**: controls the *desired* steady state (what a redeploy converges to).
2) **OpsPause Lambda**: fast runtime toggle that also **stops/starts Aurora**.

OpsPause uses optional **EventBridge allowlists**:
- **Pause**: always disables *all* rules by prefix (`remit-scout-<env>-*`) to avoid spend leaks.
- **Resume**: if `opsResumeRuleAllowlist` is configured, it enables *only* those rules (low-noise dev observation).
  Everything else stays disabled unless you enable it intentionally.
- **Resume purge**: if `purgeQueuesOnResume=true`, OpsPause purges only the
  explicit non-DLQ `purgeQueueAllowlist` before restoring worker desired counts.

If you’re running a structured dev observation window, follow:
- `docs/runbooks/dev-observation-session.md`

Guardrails:
- **Nightly auto-pause** at **12:00am ET** (EventBridge Scheduler → OpsPause).
- **Dev morning resume** at **8:00am ET weekdays** (customizable via `devMorningResumeCron`).
- **Cost guardrail auto-pause** on **Budget / Anomaly** notifications (SNS → OpsPause).

## Commands

Pause dev:
```sh
make pause-dev
```

Emergency pause (no deploy):
```sh
make ops-pause-dev
```

Resume dev:
```sh
make resume-dev
```

Emergency resume (no deploy; may cause drift):
```sh
make ops-resume-dev
```

Check status:
```sh
make status-dev
```

Check B2C-debug readiness snapshot (status + key queue backlog + quote freshness):
```sh
make status-dev-b2c
```

Rights matrix recovery (global scope, data-only strict dry-run):
```sh
make rights-recovery-global
```

Rights matrix recovery apply (global scope, single full apply):
```sh
make rights-recovery-global-apply
```

Post-migration rights activation validation (SQL checks + hot-lane forensics):
```sh
make rights-validate-activation
```

Notes for rights recovery:
- Keep strict policy: null/empty `source_countries` or `destination_countries` never implies allow-all.
- `rights-recovery-global` is the primary recovery path and runs capability seed, country sync, strict differential health, and capability delta dry-run on all provider-supported corridors.
- `rights-recovery-global-apply` runs the same global checks, applies full rights country widening from capability evidence, re-runs strict differential, and then executes `rights-validate-activation`.
- `rights-recovery-macro` and `rights-recovery-macro-apply` are diagnostic subset flows only.
- Promote in order: `dev` -> `staging` -> `prod` using the same command sequence.

## Expected state

**Paused** (`devPaused=true`)
- All ECS services desired=0
- All EventBridge rules disabled
- Aurora cluster stopped (dev)
- SQS queues still exist (no data loss)

**Resumed** (`devPaused=false`)
- ECS services desired > 0 (per context defaults)
- EventBridge rules enabled per `opsResumeRuleAllowlist`
- Aurora cluster available
- Allowlisted volatile queues purged before workers restore (when `purgeQueuesOnResume=true`)
- Pause-state validation logs emitted (`pause_state_validation_ok` or `pause_state_validation_drift`)

## Drift policy
- **No console/manual toggles** for ECS or EventBridge rules.
- OpsPause automation (nightly/cost-guardrail) can intentionally introduce drift.
- If you need the stack to match the current pause state, **re-deploy** with the correct
  `devPaused` value to reconcile.

## Emergency path (only if needed)
Ops-pause Lambda can be used for a fast emergency stop, but it **must** be
followed by a CDK deploy with the correct `devPaused` value to reconcile.
