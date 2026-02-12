# Database Migration Rollback Runbook

## Summary

Remit-Scout uses forward-only migrations. If a migration causes issues, rollback is done with a **compensating migration** plus controlled application rollback.

## Policy

- Do not edit or delete historical migrations.
- Do not attempt ad-hoc SQL “undo” directly in production.
- Create a new migration that restores expected schema/data behavior.

## Standard Response

1. Freeze deploys for the affected environment.
2. Roll application image back to last-known-good tag using `cd/rollback`.
3. Create and apply a compensating migration.
4. Validate with smoke checks and targeted data checks.
5. Resume deploys.

## Compensating Migration Pattern

1. Generate a new migration file in `backend/db/migrations/`.
2. Write explicit SQL that undoes the bad effect safely:
   - Add missing columns/indexes back.
   - Revert wrong constraints/defaults.
   - Backfill/repair affected rows.
3. Make the script idempotent where possible (`IF EXISTS` / `IF NOT EXISTS`).
4. Run locally and in CI migration dry-run.
5. Promote through `dev` -> `staging` -> `prod`.

## Rollback Workflow Usage

Manual rollback:

1. Open GitHub Actions `cd/rollback`.
2. Select `env` (`dev`, `staging`, or `prod`).
3. Leave `image_tag` blank to use SSM `/remit-scout/<env>/last-good-image`, or pass an explicit tag.
4. Run workflow and confirm:
   - CDK deploy succeeds.
   - migration task exits with code `0`.

## Post-Rollback Validation

- Run API smoke: `pnpm -C backend ci:api-smoke` against the environment URL.
- Check ECS services are stable.
- Confirm migration status and key tables/indexes.
- Confirm no new DLQ growth or alert storms.

## Incident Notes Template

- Migration ID:
- Affected environment:
- User impact:
- Last-known-good image:
- Compensating migration ID:
- Validation evidence (smoke/data checks):
- Follow-up action items:
