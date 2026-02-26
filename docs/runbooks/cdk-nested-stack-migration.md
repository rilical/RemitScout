# CDK Nested-Stack Zero-Replacement Migration

Last updated: 2026-02-26

Purpose:
- Move `remit-scout-<env>` from monolith resources to nested stacks without replacing live resources.
- Required for staging first, then prod promotion.

Scope:
- CDK app: `infrastructure/cdk`
- Root stack remains: `remit-scout-<env>`
- Nested domains under root: `Foundation`, `Runtime`, `Edge`, `Ops`

## Preconditions
- [ ] Merge refactor that introduces nested stacks and preserves root output keys.
- [ ] AWS caller identity is correct for target env account.
- [ ] `cdk diff` has been reviewed for target env.
- [ ] Backup/rollback window is open.

## Safety Rules
- Never run destructive commands against root stack in this migration.
- Require `Replacement: True` count == 0 for each import phase.
- If any phase diff shows replacement/deletes outside expected nested-stack scaffolding, stop.

## Phase Order
1. `Ops`
2. `Edge`
3. `Runtime`
4. `Foundation`

Rationale:
- Migrate least stateful domains first and heavy shared infra last.

## Step 1: Snapshot Current State
```bash
export ENV=staging
export STACK_NAME="remit-scout-${ENV}"

aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs' --output json > /tmp/${STACK_NAME}-outputs-before.json

aws cloudformation list-stack-resources --stack-name "$STACK_NAME" \
  --output json > /tmp/${STACK_NAME}-resources-before.json
```

## Step 2: Generate and Review Diff
```bash
pnpm -C infrastructure/cdk exec -- cdk diff -c env=$ENV --exclusively "$STACK_NAME"
```

Gate:
- No unexpected resource replacement.
- Root outputs still include deploy contract keys:
  - `DbMigrateTaskDefinitionArn`
  - `PlaneAApiUrl`
  - `PlaneACloudFrontDomain` (if enabled)
  - `FrontendDistributionId` (if enabled)

## Step 3: Per-Phase Retain/Import
For each domain (`Ops`, `Edge`, `Runtime`, `Foundation`):

1. Mark resources in that domain as retained in migration template version.
2. Deploy retain-only transition.
3. Prepare import mapping from existing physical IDs.
4. Run import change set for target nested stack resources.
5. Re-run `cdk diff`; must remain replacement-free.

Use CloudFormation import docs path:
```bash
# create import change set from synthesized template
aws cloudformation create-change-set \
  --stack-name "$STACK_NAME" \
  --change-set-name "${ENV}-import-<domain>-$(date +%s)" \
  --change-set-type IMPORT \
  --template-body file://infrastructure/cdk/cdk.out/${STACK_NAME}.template.json \
  --resources-to-import file://resources-to-import-<domain>.json
```

Then execute only when status is `CREATE_COMPLETE` and reviewed.

## Step 4: Post-Migration Validation
- [ ] `cdk deploy -c env=$ENV` works normally (no import flags).
- [ ] Root stack outputs still resolve via `describe-stacks`.
- [ ] Staging readiness and deploy workflows pass end-to-end.
- [ ] Smoke test passes.
- [ ] Alarm gate clear.
- [ ] Last-known-good image updated.

## Rollback
If a phase fails before import execution:
- Delete failed change set and return to previous deployed template.

If import executed and drift is detected:
- Do not force-update root.
- Reconcile import mapping and retry only that domain.
- Keep previous domains untouched.

## Production Promotion
After staging completion and evidence:
- Repeat same phase order and gates in prod.
- Do not combine staging and prod migration in one maintenance window.
