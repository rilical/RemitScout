# Remit-Scout Launch Readiness Issues

_Last updated: 2026-02-12_

## P0 Blockers

| ID | Issue | Evidence | Owner | Env | Status |
|---|---|---|---|---|---|
| P0-01 | Staging/prod not fully deployed and validated end-to-end | `infrastructure/cdk/lib/remit-scout-stack.ts` | Platform | staging/prod | Open |
| P0-02 | DB migration must be executed for `webhook_secret` before webhook dispatch is fully reliable | `backend/db/migrations/072_add_webhook_secret.sql` | Backend + Platform | dev/staging/prod | In progress (applied in dev; staging/prod pending) |
| P0-03 | Full security review artifacts (WAF validation, pentest report, compliance sign-off) missing | `.github/workflows/security-scan.yml`, `infrastructure/cdk/lib/api.ts` | Security + Platform | staging/prod | Open |
| P0-04 | Launch users/roles need live Supabase + Aurora seeding run in target envs | `backend/scripts/seed-launch-users.ts` | Auth + Platform | dev/staging/prod | In progress (done in dev; staging/prod pending) |
| P0-05 | Gold indices freshness gate blocks when `fx_rate_history` is stale even if `fx_rates.last_updated` is fresh | `backend/scripts/gold-indices-job.ts` | Backend | all | Fixed in code (fallback freshness check); deploy pending |
| P0-06 | SES send policy scope too narrow for dev alert-email proof path | `infrastructure/cdk/lib/iam.ts` | Platform + Security | dev | Mitigated (runtime IAM hotfix) + fixed in CDK for dev |
| P0-07 | Staging/prod synthesis/deploy required stack-shape fixes (`disableExecuteApiEndpoint` path + CloudFormation 500-resource limit) | `infrastructure/cdk/lib/api.ts`, `infrastructure/cdk/lib/scheduled-jobs.ts`, `infrastructure/cdk/lib/monitoring.ts`, `infrastructure/cdk/lib/remit-scout-stack.ts` | Platform | staging/prod | Fixed in code (staging synth now passes); deploy pending |
| P0-08 | Production synth gate requires explicit JWT + domain contexts before deploy | `infrastructure/cdk/lib/api.ts`, `infrastructure/cdk/lib/remit-scout-stack.ts` | Platform + Security | prod | Open (set `planeAJwtIssuer`, `planeAJwtAudiences`, `planeADomainName`, `planeACertificateArn`, `planeAHostedZoneId`, `planeAHostedZoneName`) |

## P1 Major

| ID | Issue | Evidence | Owner | Env | Status |
|---|---|---|---|---|---|
| P1-01 | Tier-1 disabled mode must still collect Tier-1 lanes at Tier-2 cadence | `backend/scripts/b2b-sweep-scheduler.ts` | Backend | all | Fixed (code + test) |
| P1-02 | Corridor export missing TEER/RCI/RVI fields | `backend/scripts/export-worker.ts` | Backend | all | Fixed (code + test) |
| P1-03 | Legacy `/api/*` surface still documented and risky for client drift | `backend/plane-a/src/app.ts`, `docs/openapi/*.yaml`, `frontend/composables/useApi.ts` | Backend + Frontend | all | Fixed (410 tombstone + `/api/v1` cutover) |
| P1-04 | Ops pause state not persisted to SSM (state drift risk) | `backend/scripts/aws/ops-pause-lambda.ts`, `infrastructure/cdk/lib/ops-pause.ts` | Platform | all | Fixed |
| P1-05 | No explicit one-command ECS DB migration run path | `Makefile` | Platform | all | Fixed (`db-migrate-dev/staging/prod`, validated in dev) |
| P1-06 | WAF logging not configured for forensic review | `infrastructure/cdk/lib/api.ts` | Security + Platform | staging/prod | Fixed in code; deploy pending |
| P1-07 | SES is still in verified-recipient mode for dev alert proof (non-verified recipients are blocked) | Alert worker logs (`alert_email_send_failed`, e.g. `support@remit-scout.com` on 2026-02-12 01:38 UTC) | Platform + Security | dev/staging | Open (move SES out of sandbox or verify recipient identities) |
| P1-08 | Probe coverage intentionally reduced to keep stack under CloudFormation resource cap (5 providers removed from scheduled probes) | `infrastructure/cdk/lib/scheduled-jobs.ts`, `infrastructure/cdk/lib/monitoring.ts` | Platform + Observability | all | Open (acceptable for launch; restore full set by splitting nested stacks) |
| P1-09 | Tier-2 cadence pressure observed in dev before pause (`scheduler_backpressure` queue-age guardrail trips) | `/remit-scout/dev/b2b-sweep-scheduler` logs (`queue_age_seconds` range 3699..79598 in last 24h) + SQS depth on `remit-scout-dev-ingest-fanout-tier2` | Plane B + Platform | dev | Open (drain backlog during next resume window and re-check cadence health) |
| P1-10 | EventBridge `fx-rate-refresh-worker` schedule + loop-enabled task definition can create runaway Fargate tasks and exhaust vCPU | `infrastructure/cdk/lib/remit-scout-stack.ts`, `infrastructure/cdk/lib/scheduled-jobs.ts`, `infrastructure/cdk/lib/ecs-services.ts`, `backend/scripts/fx-rate-refresh-worker.ts` | Platform | dev (and any env if misconfigured) | Fixed (code + deployed to dev on 2026-02-12; ops allowlist removed FX schedule) |
| P1-11 | Dev observation was producing real `429` due to Plane A app-level rate limiting being enabled (because `NODE_ENV='production'` even in dev) | `backend/plane-a/src/plugins/rate-limit-redis.ts`, `backend/shared/config.ts`, Plane A logs `rate_limit_exceeded` | Backend + Platform | dev | Fixed (bypass when `ENVIRONMENT=dev`; deployed 2026-02-12) |
| P1-12 | Exports GET route could throw DB errors when frontend/client calls `/exports/null` (invalid UUID) | `backend/plane-a/src/routes/exports.ts` + Plane A logs `invalid input syntax for type uuid: "null"` | Backend | dev | Fixed (param validation returns `400 invalid_export_id`; deployed 2026-02-12) |
| P1-13 | OpsPause resume could enable EventBridge rules before Aurora is available, creating noisy DB connection timeouts in alert worker | `backend/scripts/aws/ops-pause-lambda.ts` + alert worker logs `Connection terminated due to connection timeout` | Platform | dev | Fixed (resume starts DB first, waits up to 90s; deployed 2026-02-12) |

## P2 Minor

| ID | Issue | Evidence | Owner | Env | Status |
|---|---|---|---|---|---|
| P2-01 | Supabase plus-address emails can fail in some providers | `backend/scripts/dev-create-enterprise-users.ts` | Auth | dev | Fixed (hyphen aliases) |
| P2-02 | Security DAST scans disabled in CI | `.github/workflows/security-scan.yml` | Security | staging/prod | Fixed in workflow (requires `ZAP_TARGET_URL`) |
| P2-03 | API versioning README still reflected past sunset schedule | `backend/README.md` | Backend | all | Fixed |

## Dev Today Checklist (Observation Window)

- [x] Deploy dev with Tier-1 disabled and Tier-2 fanout enabled.
- [x] Resume dev workloads (`make ops-resume-dev`) and verify ECS/RDS/rules are active.
- [x] Trigger one controlled ingest run and verify Bronze/Silver updates.
- [x] Validate Gold indices API route responds after runtime DB TLS mitigation.
- [x] Generate one export and confirm `teer_rate`, `rci_ratio`, `rvi_bps` are present.
- [x] Trigger one alert and verify SES send attempt/log (`alert_email_send_failed` captured in worker logs).
- [x] Confirm nightly auto-pause schedule remains enabled at `00:00 America/New_York`.

## Staging/Prod Wiring Checklist

- [ ] Create/verify Secrets Manager entries for staging/prod (`communications`, `supabase`, `stripe`, `sentry`, `oanda` as used).
- [ ] Deploy staging with JWT auth, custom domains/certs, and WAF enabled.
- [ ] Run `make db-migrate-staging` then verify migration state.
- [ ] Seed launch users + roles in staging via `seed:launch-users` with service role key.
- [ ] Run smoke suite for auth, dashboard, exports, alerts, indices.

## Security Review Checklist

- [ ] Confirm WAF logging stream in staging/prod and validate sampled/block metrics.
- [ ] Set GitHub Actions variable `ZAP_TARGET_URL` to staging API URL.
- [ ] Run OWASP ZAP baseline and full scans; triage all High/Critical findings.
- [ ] Execute penetration test plan (auth bypass, rate-limit abuse, WAF evasion).
- [ ] Produce and approve compliance sign-off artifact for launch.

## Latest Verification Snapshot (2026-02-11)

- Dev gold indices: manual invocation completed successfully (`job_complete`) after FX history refresh (`max_rate_date=2026-02-11`).
- Dev alerts: send-path reached SES (`alert_email_send_failed`) with current blocker `Email address is not verified` (SES sandbox).
- Staging account: no `remit-scout*` CloudFormation stack found in `us-east-1`; no `remit-scout/staging/*` secrets found.
- Prod account: no `remit-scout*` CloudFormation stack found in `us-east-1`.

## Latest Verification Snapshot (2026-02-12)

- **Plane A is up**: `/healthz` and `/readyz` return 200 with DB+Redis OK.
- **Gold indices**: `/api/v1/indices/health` returns `healthy` with latest update `2026-02-12T15:27:51.121Z`.
- **Gold indices freshness fallback**: logs include `fx_history_stale_using_snapshot` (job continues using `fx_rates` snapshot instead of failing hard).
- **B2C proof (controlled)**: `/api/v1/quotes/current` for `US-MX-USD-MXN` returns quotes after running a one-off ECS task for the `b2c-refresh-worker` to drain the refresh queue.
- **B2B proof (controlled)**: a single `ingest-fanout-tier2` message for `wise` (`US-MX-USD-MXN`, bucket=500) produced a successful `quote_attempt_finish` in `/remit-scout/dev/ingest-fanout-tier2-worker` logs (example `ingestion_run_id=dd1c3752-7103-477d-a136-0657df234413`).
- **Watchlists/alerts still pending end-to-end validation**: Supabase credentials + a known test-user password were not available to acquire JWTs and hit authenticated routes in this session.
- **Staging remains unbootstrapped**: no confirmed `remit-scout-staging` stack deploy + secrets/certs wiring still outstanding.

## Latest Verification Snapshot (2026-02-12, final)

- Dev is fully paused for cost control:
  - Aurora cluster `remit-scout-dev-remitscoutauroracluster4aa33bab-am3xjbcrzsnh` is `stopped`.
  - All ECS service desired/running counts are `0`.
  - EventBridge rule count in `ENABLED` state is `0`.
- Nightly pause automation remains configured and enabled:
  - `remit-scout-dev-nightly-pause` with `cron(0 0 * * ? *)` in `America/New_York`.
- Staging synth now succeeds with current code and is below CloudFormation hard limit (`Number of resources: 477`).
- Prod synth now fits CloudFormation hard limit (`Number of resources: 499`) but intentionally fails until required production contexts are provided:
  - JWT issuer/audience
  - Plane A domain + certificate + hosted zone values
- SES status in `us-east-1`:
  - `rs-dev`, `rs-staging`, `rs-prod` all still `ProductionAccessEnabled=false` (sandbox mode).
  - `support@remit-scout.com` identity is still `PENDING` in `rs-dev`; other launch-user addresses checked are verified.
- Rate-limit scan in core Plane B worker logs (last 24h) found no explicit `429`/`rate_limited=true`/`Too Many Requests`/`ThrottlingException` matches.
- Cadence health in the same window is not clean: `scheduler_backpressure` appeared 128 times in `/remit-scout/dev/b2b-sweep-scheduler` before pause, with max queue age ~79,598 seconds.
