# Remit-Scout Audit Index

Generated: 2026-02-28

## Summary

| # | Audit | Findings | Critical | High | Medium | Low | Status |
|---|-------|----------|----------|------|--------|-----|--------|
| 01 | [Plane A API Routes](01-plane-a-api.md) | 6 | 0 | 3 | 3 | 0 | Complete |
| 02 | [Plane B Collectors & Providers](02-plane-b-providers.md) | 5 | 1 | 3 | 1 | 0 | Complete |
| 03 | [Queues & Workers](03-queues-workers.md) | 7 | 1 | 6 | 0 | 0 | Complete |
| 04 | [Data Lineage & Gold](04-data-lineage-gold.md) | 16 | 2 | 5 | 6 | 3 | Complete |
| 05 | [Auth & Entitlements](05-auth-entitlements.md) | 14 | 1 | 4 | 5 | 4 | Complete |
| 06 | [Frontend & API Contract](06-frontend-api-contract.md) | 18 | 3 | 5 | 6 | 4 | Complete |
| 07 | [Observability & Alerts](07-observability-alerts.md) | 14 | 2 | 4 | 5 | 3 | Complete |
| 08 | [Infrastructure & Deploy](08-infra-deploy.md) | 16 | 2 | 5 | 6 | 3 | Complete |
| 09 | [Config & Secrets](09-config-secrets.md) | 14 | 3 | 4 | 5 | 2 | Complete |
| 10 | [Tests & Coverage](10-tests-coverage.md) | 16 | 2 | 5 | 6 | 3 | Complete |
| 11 | [Dead Code & Artifacts](11-dead-code-artifacts.md) | 12 | 1 | 4 | 5 | 2 | Complete |
| **Total** | | **138** | **18** | **48** | **48** | **24** | |

## Critical Findings Summary

1. **AUDIT-01/02**: `parse_error` quotes persisted as successful records (pangea + all collectors) — **FIXED**
2. **AUDIT-03**: Missing DLQ handoff for dropped corridor providers in ingest-fanout — **FIXED**
3. **AUDIT-04**: SQL injection in `gold-indices-live.ts` via string interpolation of env vars — **FIXED**
4. **AUDIT-04**: Silent negative fee clamping corrupting TEER/RCI in `quote-normalizer.ts` — **FIXED**
5. **AUDIT-05**: Unbounded in-memory token cache in `remote-verify.ts` — no eviction, revoked sessions stay valid — **FIXED**
6. **AUDIT-06**: Open redirect via OAuth callback sessionStorage — **FIXED**
7. **AUDIT-06**: Open redirect via sign-in `?redirect=` parameter — **FIXED**
8. **AUDIT-06**: Admin role check short-circuits on client-side state — **FIXED**
9. **AUDIT-07**: Cross-plane tracing metrics never emitted — alarms permanently in OK state — **FIXED**
10. **AUDIT-07**: Smart alerts + corridor refresh jobs lack failure detection — **FIXED**
11. **AUDIT-08**: CDK synth snapshots expose full AWS topology in git — **FIXED**
12. **AUDIT-08**: Pipeline deploy project has `sts:AssumeRole` on `*` — **FIXED**
13. **AUDIT-09**: `frontend/.env.local` with live Supabase/API Gateway credentials in working tree — **ALREADY_FIXED_WITH_EVIDENCE**
14. **AUDIT-09**: `PLANE_A_JWT_SECRET` defaults to empty string, never enforced — **FIXED**
15. **AUDIT-09**: Privacy hash salt falls back to hardcoded constant — **FIXED**
16. **AUDIT-10**: Gold export guardrails test is a no-op placeholder — **FIXED**
17. **AUDIT-10**: Security dependency audit permanently non-blocking in CI/CD — **FIXED**
18. **AUDIT-11**: ~140 `.d.ts` build artifacts committed inside source directories — **FIXED**

## Fix Status

| Fix ID | Finding | Status |
|--------|---------|--------|
| FIX-RS-001 | AUDIT-02 #1: Gate parse_error quotes | DONE |
| FIX-RS-002 | AUDIT-03 #1: Add DLQ handoff | DONE |
| FIX-RS-003 | AUDIT-01-03 HIGH findings | DONE |
| FIX-RS-004+ | AUDIT-04 through 11 findings | DONE (fixed / already_fixed_with_evidence; see per-audit remediation tables) |
