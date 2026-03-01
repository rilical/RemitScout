# OpsPause IAM Reconciliation (ecs:ListServices)

Last updated: 2026-02-28

## Purpose
- Keep `OpsPause` working in staging/prod while reconciling emergency IAM hotfixes back into IaC.
- Avoid risky full-stack local deploys when local context differs from deployed env config.

## Scope
- IAM role used by:
  - `remit-scout-staging-*OpsPauseControllerFunction*`
  - `remit-scout-prod-*OpsPauseControllerFunction*`
- CDK source of truth:
  - `infrastructure/cdk/lib/iam.ts`

## Current model
- Temporary inline hotfix policy name: `ops-pause-ecs-listservices-hotfix`
- Required action: `ecs:ListServices`
- IaC fix is committed in `infrastructure/cdk/lib/iam.ts` (OpsPause role now includes `ecs:ListServices`).

## Safe reconciliation flow
1. Verify current state (hotfix present + controller healthy):
   - `AWS_PROFILE=rs-staging make hotfix-ops-pause-status-staging`
   - `AWS_PROFILE=rs-prod make hotfix-ops-pause-status-prod`
   - `AWS_PROFILE=rs-staging make ops-pause-staging`
   - `AWS_PROFILE=rs-prod make ops-pause-prod`

2. Promote IaC fix using the standard deploy path (not ad-hoc local deploy):
   - Follow `docs/runbooks/agent-deploy-promotion-checklist.md`.
   - Deploy staging from immutable SHA.
   - Promote same SHA to prod after staging evidence is green.

3. Confirm base role policy now contains `ecs:ListServices`:
   - `AWS_PROFILE=rs-staging make hotfix-ops-pause-status-staging`
   - `AWS_PROFILE=rs-prod make hotfix-ops-pause-status-prod`
   - Expected: `base_has_listservices=1`.

4. Remove temporary hotfix policy:
   - `AWS_PROFILE=rs-staging make hotfix-ops-pause-cleanup-staging`
   - `AWS_PROFILE=rs-prod make hotfix-ops-pause-cleanup-prod`

5. Final validation:
   - `AWS_PROFILE=rs-staging make ops-pause-staging`
   - `AWS_PROFILE=rs-prod make ops-pause-prod`
   - `AWS_PROFILE=rs-staging make hotfix-ops-pause-status-staging`
   - `AWS_PROFILE=rs-prod make hotfix-ops-pause-status-prod`
   - Expected: controller returns `{"paused":true}` and hotfix is absent.

## Rollback (if post-cleanup pause fails)
- Re-apply hotfix immediately:
```sh
AWS_PROFILE=<profile> aws iam put-role-policy \
  --role-name <ops_pause_role_name> \
  --policy-name ops-pause-ecs-listservices-hotfix \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["ecs:ListServices"],"Resource":["arn:aws:ecs:*:*:cluster/remit-scout-<env>","arn:aws:ecs:*:*:service/remit-scout-<env>/*"]}]}'
```
- Re-run pause validation for the impacted env.
