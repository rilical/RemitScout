# AWS Security Posture Checks

## Automated Checks
- Workflow: `.github/workflows/infra-security-audit.yml`
- Scripts:
  - `backend/scripts/ci/audit-iam-wildcards.ts`
  - `backend/scripts/ci/audit-storage-encryption.ts`

## Coverage
- IAM wildcard detection in `infrastructure/iam` and CDK IAM wiring.
- RDS cluster storage encryption.
- S3 bucket default encryption.

## Required Environment Variables
- `STACK_NAME`
- Optional overrides:
  - `SECURITY_AUDIT_BUCKETS` (CSV)
  - `SECURITY_AUDIT_RDS_CLUSTER`

## Evidence Artifacts
- `artifacts/iam-wildcard-audit.json`
- `artifacts/aws-security-posture.json`

## Review Cadence
- Daily scheduled run in CI.
- Mandatory manual run before production release.

