# Remit-Scout CI/CD v2 (GitHub Actions + AWS OIDC)

Feedback source: chat transcript.

## What this pipeline does
- PRs run change-based CI (fast).
- `develop` deploys **dev** (paused by default for cost).
- `main` deploys **staging** (full deploy: infra + backend image + migrations + frontend + smoke).
- Prod is intentionally **not** wired in this repo right now.

## Required GitHub Environments
Create these GitHub environments:
- `dev`
- `staging`

### Environment variables (GitHub → Settings → Environments → Variables)
`dev`:
- `AWS_REGION=us-east-1`
- `STACK_NAME=remit-scout-dev`
- `AWS_ROLE_TO_ASSUME=arn:aws:iam::716156543157:role/remit-scout-gha-deploy-dev`

`staging`:
- `AWS_REGION=us-east-1`
- `STACK_NAME=remit-scout-staging`
- `AWS_ROLE_TO_ASSUME=arn:aws:iam::010630709504:role/remit-scout-gha-deploy-staging`
- `PUBLIC_SUPABASE_URL=<staging supabase url>`
- `PUBLIC_SUPABASE_ANON_KEY=<staging supabase anon key>`

## AWS OIDC roles (already created)
The pipeline assumes GitHub OIDC roles exist and are trusted for:
- `repo:rilical/remit-scout-v2:environment:dev` (dev deploy job)
- `repo:rilical/remit-scout-v2:environment:staging` (staging deploy job)

Notes:
- Deploy jobs in `.github/workflows/deploy.yml` use GitHub **Environments**, so the OIDC `sub` claim is environment-scoped.
- If you rename GitHub environments, you must update the IAM trust policy `token.actions.githubusercontent.com:sub`.
- We also allow branch-scoped `sub` values (`ref:refs/heads/develop` and `ref:refs/heads/main`) to support future non-environment deploy jobs.

Idempotent AWS setup helper:
- `scripts/aws/ensure-github-actions-oidc-roles.sh` (updates trust + inline policy in-place)

### Role ARNs
- Dev: `arn:aws:iam::716156543157:role/remit-scout-gha-deploy-dev`
- Staging: `arn:aws:iam::010630709504:role/remit-scout-gha-deploy-staging`
- (Created but unused) Prod: `arn:aws:iam::938998270127:role/remit-scout-gha-deploy-prod`

## Where to look when deploys fail
- GitHub Actions → `cd/deploy` workflow run
- AWS CloudFormation stack events for `remit-scout-<env>`
- ECS task logs for the DB migration task (output key: `DbMigrateTaskDefinitionArn`)
