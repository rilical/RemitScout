# Dev Pause/Resume (CDK-only)

## Why this exists
Dev is intentionally paused most of the time to avoid background cost
(ECS services + scheduled Lambdas). The **only supported way** to toggle
pause/resume is via CDK deploys using `devPaused` so we avoid drift.

## Commands

Pause dev:
```sh
make pause-dev
```

Resume dev:
```sh
make resume-dev
```

Check status:
```sh
make status-dev
```

## Expected state

**Paused** (`devPaused=true`)
- All ECS services desired=0
- All EventBridge rules disabled
- SQS queues still exist

**Resumed** (`devPaused=false`)
- ECS services desired > 0 (per context defaults)
- EventBridge rules enabled

## Drift policy
- **No manual console toggles** for ECS or EventBridge.
- If an emergency change is made, always **re-deploy** with the correct
  `devPaused` value to reconcile drift.

## Emergency path (only if needed)
Ops-pause Lambda can be used for a fast emergency stop, but it **must** be
followed by a CDK deploy with the correct `devPaused` value to reconcile.
