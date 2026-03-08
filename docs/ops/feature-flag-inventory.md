# Feature Flag Inventory

**Owner:** Engineering Lead
**Last updated:** 2026-03-07
**Review cadence:** Monthly

---

## How Flags Work

- **Backend (`config.ts`):** `toBoolean()` returns `true` for `1`, `true`, `yes` (case-insensitive). Everything else returns `false`.
- **CDK context:** `this.node.tryGetContext('flagName')` with env var fallback.
- **Database:** `public.system_feature_flag` table, managed via admin API (`/api/v1/admin/feature-flags`). Changes take effect within cache TTL (default 60s). Audit trail in `system_feature_flag_audit`.
- **Frontend:** Build-time flags via Nuxt runtime config. Require redeploy to change.

---

## Telemetry and Observability

| Flag | Default | Purpose |
|------|---------|---------|
| `CLOUDWATCH_METRICS_ENABLED` | `true` in AWS, `false` locally | Enables CloudWatch custom metric recording |
| `CLOUDWATCH_HIGH_CARDINALITY_METRICS` | `false` | Enables high-cardinality CloudWatch dimensions (e.g., `run_id`). Gated separately to control cost |
| `ENABLE_TELEMETRY` | `false` | Enables OTEL sidecar for X-Ray traces |
| `EMIT_OBSERVATIONS` | `false` | Enables agent observation emission |
| `TRACE_FILTER_HEALTH_CHECKS` | `false` | Filters health-check spans from distributed traces |
| `SENTRY_ALLOW_MISSING_IN_PROTECTED_ENV` | `false` | Allows Sentry DSN to be absent in staging/prod without failing startup |

## Agent System

| Flag | Default | Purpose |
|------|---------|---------|
| `AGENT_ENABLED` | `false` | Master switch for the self-healing agent system |
| `AGENT_ORCHESTRATOR_ENABLED` | `false` | Enables the agent orchestrator loop |
| `AGENT_REQUIRES_APPROVAL` | `true` | Requires human approval before deploying agent patches |
| `AGENT_DIRECT_DEPLOY` | `false` | Allows agents to deploy patches without validation step |
| `TOOL_GATEWAY_WRITE_ENABLED` | `false` | Enables write operations (file, git) in the tool gateway |
| `STRESS_DETECTION_ENABLED` | `false` | Enables corridor stress signal detection in triangulation |
| `MODULE_AUTO_HEAL_DEFAULT` | `false` | Default auto-heal setting for new modules |
| `MODULE_EMIT_OBSERVATIONS_DEFAULT` | `false` | Default observation emission setting for new modules |

## Data Pipeline

| Flag | Default | Purpose |
|------|---------|---------|
| `READ_ONLY_MODE` | `false` | Puts the system in read-only mode (no writes) |
| `PLANE_B_INGEST_LOOP` | `false` | Enables continuous ingest loop in Plane B |
| `PLANE_B_HEALTH_ENABLED` | `true` | Enables health endpoint for ingest workers |
| `PLANE_B_USE_SEED_DATA` | `false` | Uses seed data instead of live provider data |
| `PLANE_B_B2B_DRAIN_MODE` | `false` | Drains B2B queue without processing new tasks |
| `PLANE_B_B2B_FRESHNESS_SLO_ENABLED` | `false` | Enables freshness SLO enforcement for B2B corridors |
| `PLANE_B_B2B_NATIVE_CURRENCY_ONLY` | `true` | Restricts B2B collection to native currency pairs only |
| `PLANE_B_B2B_WISE_CURRENCY_OVERRIDE` | `false` | Overrides native-currency-only restriction for Wise |
| `PLANE_B_B2C_QUEUE_IN_SWEEP` | `true` locally, `false` in AWS | Queues B2C refresh jobs during sweep runs |
| `PLANE_B_DISABLE_TIER1` | `false` | Disables Tier 1 ingest fanout processing |
| `TRIANGULATION_ENABLED` | `false` | Enables the quote triangulation engine |
| `DISCOVERY_ENABLED` | `false` | Enables corridor discovery via provider websites |
| `DISCOVERY_SCREENSHOTS_ENABLED` | `false` | Enables screenshot capture during discovery |
| `FX_RATE_OANDA_FALLBACK` | `false` | Enables OANDA as FX rate fallback source |
| `FX_RATE_REFRESH_ENABLED` | `true` in prod/staging | Enables automatic FX rate refresh |
| `FX_RATE_REFRESH_LOOP` | `false` | Enables continuous FX rate refresh worker loop |
| `OANDA_USE_AUTHENTICATED_API` | `false` | Uses authenticated OANDA API (requires `OANDA_API_KEY`) |
| `EXPORTS_PARQUET_ENABLED` | `true` in staging | Enables Parquet format for data exports |
| `B2C_REFRESH_LOOP` | `false` | Enables continuous B2C refresh worker loop |
| `B2C_REFRESH_HEALTH_ENABLED` | `true` | Enables health endpoint for B2C refresh worker |
| `VOLATILITY_CACHE_ON_DEMAND` | `false` | Enables on-demand caching for volatility computations |
| `QUEUE_STALENESS_ENFORCEMENT_ENABLED` | `false` | Enables enforcement of queue message staleness windows |
| `QUOTE_REFRESH_DB_FALLBACK` | `false` | Falls back to DB-based quote refresh when SQS unavailable |
| `FX_RATE_REFRESH_DB_FALLBACK` | `false` | Falls back to DB-based FX rate refresh when SQS unavailable |

## Provider Freshness SLO Flags

Each provider has a freshness SLO enable flag. All default to `false`.

| Flag | Provider |
|------|----------|
| `PLANE_B_REMITLY_FRESHNESS_SLO_ENABLED` | Remitly |
| `PLANE_B_WISE_FRESHNESS_SLO_ENABLED` | Wise |
| `PLANE_B_XE_FRESHNESS_SLO_ENABLED` | XE |
| `PLANE_B_TRANSFERGO_FRESHNESS_SLO_ENABLED` | TransferGo |
| `PLANE_B_PAYSEND_FRESHNESS_SLO_ENABLED` | Paysend |
| `PLANE_B_PANGEA_FRESHNESS_SLO_ENABLED` | Pangea |
| `PLANE_B_ORBITREMIT_FRESHNESS_SLO_ENABLED` | OrbitRemit |
| `PLANE_B_BOSSMONEY_FRESHNESS_SLO_ENABLED` | Boss Money |
| `PLANE_B_WORLDREMIT_FRESHNESS_SLO_ENABLED` | WorldRemit |
| `PLANE_B_WESTERNUNION_FRESHNESS_SLO_ENABLED` | Western Union |
| `PLANE_B_XOOM_FRESHNESS_SLO_ENABLED` | Xoom |
| `PLANE_B_INSTAREM_FRESHNESS_SLO_ENABLED` | Instarem |
| `PLANE_B_WIREBARLEY_FRESHNESS_SLO_ENABLED` | WireBarley |
| `PLANE_B_ALANSARI_FRESHNESS_SLO_ENABLED` | Al Ansari |
| `PLANE_B_INTERMEX_FRESHNESS_SLO_ENABLED` | Intermex |
| `PLANE_B_KORONAPAY_FRESHNESS_SLO_ENABLED` | KoronaPay |
| `PLANE_B_REMITBEE_FRESHNESS_SLO_ENABLED` | Remitbee |
| `PLANE_B_SINGX_FRESHNESS_SLO_ENABLED` | SingX |
| `PLANE_B_PLACID_FRESHNESS_SLO_ENABLED` | Placid |
| `PLANE_B_RIA_FRESHNESS_SLO_ENABLED` | RIA |
| `PLANE_B_DAHABSHIIL_FRESHNESS_SLO_ENABLED` | Dahabshiil |
| `PLANE_B_SENDWAVE_FRESHNESS_SLO_ENABLED` | Sendwave |
| `PLANE_B_MUKURU_FRESHNESS_SLO_ENABLED` | Mukuru |

## Security and Auth

| Flag | Default | Purpose |
|------|---------|---------|
| `PLANE_A_REQUIRE_API_KEY` | `false` | Requires API key for Plane A access |
| `PLANE_A_REQUIRE_JWT` | `false` | Requires JWT for Plane A access |
| `PLANE_A_ADMIN_REVOCATION_FAIL_CLOSED` | `true` in prod/staging | Denies access when token revocation check fails |
| `PLANE_A_ADMIN_REQUIRE_ALLOWLIST` | `true` in prod/staging | Requires admin IP allowlist to be configured |
| `PLANE_A_ADMIN_ALLOWLIST_STRICT` | `true` in prod/staging | Strict IP allowlist enforcement for admin routes |
| `PLANE_A_REQUIRE_EMAIL_CONFIRMATION` | `true` | Requires email confirmation before account activation |
| `ADMIN_MFA_REQUIRED` | `true` in prod, recommended `true` in staging | Requires MFA for admin access |
| `PLANE_C_REQUIRE_INTERNAL_AUTH` | `true` in prod/staging | Requires internal API token for Plane C calls |
| `PLANE_C_ENABLE_IAM_AUTH` | `false` | Enables IAM-based auth for Plane C |
| `PLANE_A_CORS_ALLOW_CREDENTIALS` | `false` | Enables credentials in CORS responses |
| `STRICT_CONFIG` | `false` (auto-on in prod/staging) | Enforces strict configuration validation |
| `ALLOW_DB_FALLBACK` | `true` locally, `false` in prod | Allows database URL fallback to defaults |
| `DB_QUERY_TIMEOUT_ENABLED` | `true` | Enables query timeout enforcement |
| `DB_DISABLE_STATEMENT_TIMEOUT` | `false` | Disables explicit statement_timeout on pool connections |

## Email and Notifications

| Flag | Default | Purpose |
|------|---------|---------|
| `WELCOME_EMAIL_ENABLED` | `true` | Enables welcome email on user signup |
| `CONTACT_EMAIL_ENABLED` | `false` | Enables contact form email delivery |
| `ALERT_EMAIL_ENABLED` | `false` | Enables alert email delivery via SMTP |
| `ALERT_EVALUATION_ENABLED` | `true` | Enables alert evaluation worker |
| `ALERTS_EMAIL_ENABLED` | `false` | Enables user alert email notifications (SES) |
| `ALERTS_SMS_ENABLED` | `false` | Enables user alert SMS notifications |
| `BILLING_EMAIL_ENABLED` | `true` | Enables billing-related emails |
| `SECURITY_EMAIL_ENABLED` | `true` | Enables security notification emails |
| `ACCOUNT_DELETION_EMAIL_ENABLED` | `true` | Enables account deletion confirmation emails |
| `NEWSLETTER_EMAIL_ENABLED` | `true` | Enables newsletter email delivery |
| `NEWSLETTER_WELCOME_ENABLED` | `false` | Enables welcome email for new newsletter subscribers |
| `NOTIFICATION_PARALLEL` | `true` | Enables parallel notification dispatch across channels |
| `PUSH_WEB_ENABLED` | `false` | Enables web push notifications |
| `PUSH_SNS_ENABLED` | `false` | Enables push notifications via AWS SNS |
| `PINPOINT_ENABLED` | `false` | Enables AWS Pinpoint for newsletter/marketing |

## Plane A API Features

| Flag | Default | Purpose |
|------|---------|---------|
| `SWAGGER_ENABLED` | `true` locally, `false` in AWS | Enables Swagger UI at `/api-docs` |
| `PLANE_A_SMART_ALERTS_ENABLED` | `true` locally, `false` in prod/staging | Enables smart alert evaluation |
| `PLANE_A_B2C_PROVIDER_WEIGHTED_MID_MARKET` | `true` in staging | Enables provider-weighted mid-market rate in B2C responses |
| `WORKER_HEALTH_ENABLED` | `true` | Enables health check endpoint for workers |

## Queue Mode Flags

| Flag | Values | Default | Purpose |
|------|--------|---------|---------|
| `QUOTE_REFRESH_QUEUE_MODE` | `queue` / `inline` / `off` | `queue` | B2C quote refresh dispatch mode |
| `FX_RATE_REFRESH_QUEUE_MODE` | `queue` / `inline` / `off` | `queue` | FX rate refresh dispatch mode |
| `EXPORT_JOB_QUEUE_MODE` | `queue` / `inline` / `off` | `queue` | Export job dispatch mode |
| `GOLD_LIVE_QUEUE_MODE` | `queue` / `inline` / `off` | `queue` | Gold live publish dispatch mode |

## Frontend Build-Time Flags

| Flag | Env Var | Default | Purpose |
|------|---------|---------|---------|
| `PULSE_ENABLED` | `NUXT_PUBLIC_PULSE_ENABLED` | `false` | Enables the Pulse market overview page |
| `PULSE_SCREENER_ENABLED` | `NUXT_PUBLIC_PULSE_SCREENER_ENABLED` | `true` | Enables screener-first Pulse experience |
| `ENTERPRISE_ENABLED` | `NUXT_PUBLIC_ENTERPRISE_ENABLED` | `false` | Enables enterprise/B2B features |
| `ANALYTICS_ENABLED` | `NUXT_PUBLIC_ANALYTICS_ENABLED` | `true` in staging/prod | Enables analytics (GA4, Meta, etc.) |
| `SENTRY_ENABLED` | `NUXT_PUBLIC_SENTRY_ENABLED` | `true` in staging/prod | Enables Sentry error tracking in frontend |
| `ALLOW_SEARCH_INDEXING` | `NUXT_PUBLIC_ALLOW_SEARCH_INDEXING` | `true` in production | Allows search engine indexing |
| `ADS_ENABLED` | `NUXT_PUBLIC_ADS_ENABLED` | CDK context | Enables ad placements in frontend |

## Infrastructure / CDK Context Flags

Boolean flags set via CDK context or env vars at deploy time. Managed in `infrastructure/cdk/lib/remit-scout-stack.ts`.

| Flag (CDK context key) | Env Fallback | Purpose |
|-------------------------|-------------|---------|
| `enableDbProxy` | `ENABLE_DB_PROXY` | Enables RDS Proxy in front of Aurora |
| `enableBackup` | `ENABLE_BACKUP` | Enables automated database backups |
| `enableFrontend` | `ENABLE_FRONTEND` | Deploys the frontend CloudFront + S3 stack |
| `enableCostGuardrails` | `ENABLE_COST_GUARDRAILS` | Enables AWS Budget alarms and cost anomaly detection |
| `enableMonitoring` | `ENABLE_MONITORING` | Enables CloudWatch dashboards and alarms |
| `enableSynthetics` | `ENABLE_SYNTHETICS` | Enables CloudWatch Synthetics canaries |
| `devMinimalInfra` | `DEV_MINIMAL_INFRA` | Reduces infrastructure footprint for dev |
| `enableGithubActionsOidc` | `ENABLE_GITHUB_ACTIONS_OIDC` | Creates OIDC provider for GitHub Actions |
| `enableCloudFront` | `ENABLE_CLOUDFRONT` | Enables CloudFront distribution for Plane A |
| `enableWaf` | `ENABLE_WAF` | Enables WAF on CloudFront/API Gateway |
| `wafEnableBotControl` | `WAF_ENABLE_BOT_CONTROL` | Enables AWS WAF Bot Control managed rule |
| `enablePlaneAJwtAuth` | `ENABLE_PLANE_A_JWT_AUTH` | Enforces JWT auth on Plane A |
| `enablePlaneCIamAuth` | `ENABLE_PLANE_C_IAM_AUTH` | Enforces IAM auth on Plane C |
| `agentOrchestratorServiceEnabled` | `AGENT_ORCHESTRATOR_SERVICE_ENABLED` | Enables agent orchestrator ECS service |
| `stressResponderServiceEnabled` | `STRESS_RESPONDER_SERVICE_ENABLED` | Enables stress responder ECS service |
| `normalizationServiceEnabled` | `NORMALIZATION_SERVICE_ENABLED` | Enables normalization worker ECS service |
| `alertEvaluationServiceEnabled` | `ALERT_EVALUATION_SERVICE_ENABLED` | Enables alert evaluation ECS service |
| `exportServiceEnabled` | `EXPORT_SERVICE_ENABLED` | Enables export worker ECS service |
| `planeBB2cRefreshServiceEnabled` | `PLANE_B_B2C_REFRESH_SERVICE_ENABLED` | Enables B2C refresh ECS service |
| `planeBFxRateRefreshServiceEnabled` | `PLANE_B_FX_RATE_REFRESH_SERVICE_ENABLED` | Enables FX rate refresh ECS service |
| `planeBQueueWorkerSpotOnly` | `PLANE_B_QUEUE_WORKER_SPOT_ONLY` | Forces Spot-only capacity for Plane B workers |
| `devPaused` | `DEV_PAUSED` | Pauses dev environment ECS services |
| `devNightlyPauseEnabled` | `DEV_NIGHTLY_PAUSE_ENABLED` | Enables nightly auto-pause for dev (cost saving) |
| `stagingBusinessHoursEnabled` | `STAGING_BUSINESS_HOURS_ENABLED` | Business-hours-only scheduling for staging |
| `purgeQueuesOnResume` | `PURGE_QUEUES_ON_RESUME` | Purges SQS queues when resuming paused env |
| `pipelineEnabled` | `PIPELINE_ENABLED` | Enables CodePipeline CI/CD |
| `newRelicAwsMetricStreamEnabled` | `NEW_RELIC_AWS_METRIC_STREAM_ENABLED` | Enables CloudWatch Metric Stream to New Relic |
| `newRelicAwsLogForwardingEnabled` | `NEW_RELIC_AWS_LOG_FORWARDING_ENABLED` | Enables CloudWatch Log forwarding to New Relic |

## Database Feature Flags (Runtime)

Managed via admin API (`/api/v1/admin/feature-flags`). Changes take effect within cache TTL (default 60s). Audit trail in `system_feature_flag_audit`.

> **Note:** Database flags are dynamically created via the admin panel. Run
> `SELECT key, enabled, description FROM system_feature_flag ORDER BY key;` to get the
> current inventory.

---

## Flag Lifecycle

1. **Proposal:** Engineer proposes flag with purpose and retirement date
2. **Creation:** Flag added to database or code with `enabled: false`
3. **Rollout:** Gradually enable (e.g., staging -> prod)
4. **Retirement:** Once feature is stable, remove flag and hardcode behavior
5. **Cleanup:** Remove dead code paths and update this document

### Retirement Process
- Flags older than 6 months without a retirement date should be reviewed
- Remove the flag, the conditional code paths, and update this inventory
- File a cleanup ticket if code removal is non-trivial

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-03-07 | Full regeneration from config.ts, CDK, and frontend sources | Engineering |
| 2026-02-21 | Initial version | Engineering |
