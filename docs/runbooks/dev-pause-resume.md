# Dev Pause/Resume (CDK + OpsPause)

## Why this exists
Dev is intentionally paused most of the time to avoid background cost
(ECS services + scheduled Lambdas + database IO).

We use **two layers**:
1) **CDK `devPaused`**: controls the *desired* steady state (what a redeploy converges to).
2) **OpsPause Lambda**: fast runtime toggle that also **stops/starts Aurora**.

Guardrails:
- **Nightly auto-pause** at **12:00am ET** (EventBridge Scheduler → OpsPause).
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

## Expected state

**Paused** (`devPaused=true`)
- All ECS services desired=0
- All EventBridge rules disabled
- Aurora cluster stopped (dev)
- SQS queues still exist (no data loss)

**Resumed** (`devPaused=false`)
- ECS services desired > 0 (per context defaults)
- EventBridge rules enabled
- Aurora cluster available

## Drift policy
- **No console/manual toggles** for ECS or EventBridge rules.
- OpsPause automation (nightly/cost-guardrail) can intentionally introduce drift.
- If you need the stack to match the current pause state, **re-deploy** with the correct
  `devPaused` value to reconcile.

## Emergency path (only if needed)
Ops-pause Lambda can be used for a fast emergency stop, but it **must** be
followed by a CDK deploy with the correct `devPaused` value to reconcile.
