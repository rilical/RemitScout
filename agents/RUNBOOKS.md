# Agent Runbooks (Evidence Access)

## Purpose
Provide read-only access patterns for agents to gather evidence (AWS + SQL) without changing state.

## AWS Read-Only Access
- Use a read-only AWS role or profile.
- Prefer AWS CLI commands that list/describe resources.

Common commands:
- `aws sts get-caller-identity --profile <profile>`
- `aws cloudformation describe-stacks --stack-name <stack> --region <region> --profile <profile>`
- `aws cloudformation describe-stack-events --stack-name <stack> --region <region> --profile <profile>`
- `aws ecs list-services --cluster <cluster> --region <region> --profile <profile>`
- `aws ecs describe-services --cluster <cluster> --services <svc> --region <region> --profile <profile>`
- `aws sqs list-queues --queue-name-prefix <prefix> --region <region> --profile <profile>`
- `aws events list-rules --name-prefix <prefix> --region <region> --profile <profile>`

## SQL Read-Only Access
- Use a read-only DB user.
- Avoid full scans; add time filters.

Example (psql):
- `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM silver.quote_record WHERE ingested_at >= NOW() - INTERVAL '24 hours';"`

## Evidence Policy
- If evidence is missing, request the exact SQL or CLI command output.
- Do not assume success without proof.

## Safety Rules
- Never run destructive commands.
- Do not export secrets or raw PII.
