# Auth Bypass Paths (Plane A)

This document enumerates all Plane A routes that are intentionally accessible without `requireAuth`, `requireAdmin`, or `requireEntitlement`.

Why this exists:
- Prevent accidental auth bypass when new routes are added.
- Force explicit review when changing route registration or adding new unauthenticated endpoints.

Rules:
- Any new unauthenticated route must be added here with a rationale.
- Any route under `protected_prefixes` should remain protected by the global auth preHandler in `backend/plane-a/src/app.ts`.

## Machine-Readable Config (used by tests)

```json
{
  "bypass_paths": [
    "/healthz",
    "/readyz",
    "/metrics",
    "/api",
    "/api/*",

    "/api/v1/billing/webhook",
    "/api/v1/auth/forgot-password",
    "/api/v1/alerts/unsubscribe",
    "/api/v1/alerts/corridor-eligibility",
    "/api/v1/alerts/macro-corridors"
  ],
  "bypass_prefixes": [
    "/api-docs"
  ],
  "protected_prefixes": [
    "/api/v1/me",
    "/api/v1/billing",
    "/api/v1/pulse",
    "/api/v1/watchlist",
    "/api/v1/alerts",
    "/api/v1/history",
    "/api/v1/exports",
    "/api/v1/data",
    "/api/v1/account",
    "/api/v1/dashboard",
    "/api/v1/sessions"
  ],
  "public_prefixes": [
    "/api/v1/ads",
    "/api/v1/quotes",
    "/api/v1/providers",
    "/api/v1/provider-metadata",
    "/api/v1/corridor-currencies",
    "/api/v1/corridor-limits",
    "/api/v1/popular-corridors",
    "/api/v1/rates",
    "/api/v1/contact",
    "/api/v1/newsletter",
    "/api/v1/marketing",
    "/api/v1/compliance",
    "/api/v1/bank-vs-specialist",
    "/api/v1/geo"
  ],
  "public_paths": [
    "/api/v1/telemetry/search",
    "/api/v1/telemetry/click",
    "/api/v1/telemetry/conversion",
    "/api/v1/telemetry/session",

    "/api/v1/provider-visits/track",
    "/api/v1/indices/health",
    "/api/v1/public/indices/series",
    "/api/v1/public/indices/embed-snapshots/:snapshotId",
    "/api/v1/public/indices/published-embeds/:id",
    "/api/v1/public/pulse/embed-snapshots/:snapshotId",
    "/api/v1/public/pulse/published-embeds/:id",
    "/api/v1/public/pulse/hero",
    "/api/v1/public/pulse/corridors"
  ]
}
```

## Rationales

- `/healthz`, `/readyz`: used by load balancers/ECS health checks.
- `/metrics`: Prometheus scrape endpoint (assumed to be network-restricted in AWS).
- `/api`, `/api/*`: explicit 410 for legacy paths.
- `/api-docs/*`: developer OpenAPI UI (disabled in AWS unless `SWAGGER_ENABLED=1`).
- `/api/v1/billing/webhook`: Stripe webhook (signature verification + optional IP allowlist).
- `/api/v1/auth/forgot-password`: password-reset initiation must work before authentication.
- `/api/v1/alerts/unsubscribe`: email unsubscribe (token validation in handler).
- `/api/v1/alerts/corridor-eligibility`, `/api/v1/alerts/macro-corridors`: allowed unauthenticated only in dev/test for UI bootstrapping.
- Public read-only API endpoints (quotes/providers/rates/etc): used by unauthenticated discovery flows; must not expose PII.
- `/api/v1/public/indices/*`, `/api/v1/public/pulse/*`: share-safe embed/public data feeds; must remain aggregate-only and PII-free.
- `/api/v1/compliance/*`: exposes non-sensitive certification posture and privacy threshold metadata.
- Telemetry write endpoints: accept anonymous events; must avoid PII and be rate-limited.
- `/api/v1/indices/health`: public readiness summary for indices (no user data).
