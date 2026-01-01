## Goals
- Implement Supabase JWT verification in Plane A (JWKS first, remote fallback).
- Make /api/me the source of truth for plan and entitlements.
- Implement Stripe upgrade flow (checkout + webhook updates).
- Enforce premium entitlements server-side for protected endpoints.
- Add tests that prove auth and gating cannot be bypassed.

## RSE Anchors
- RSE-271225-022936.txt L340-L358: identity, billing, entitlements, /api/me.
- RSE-271225-022936.txt L358, L981-L996: /api/me contract and entitlements.
- RSE-271225-022936.txt L900-L903, L2150-L2153: billing endpoints.
- RSE-271225-022936.txt L957-L958, L2056-L2071: server-side entitlements enforcement, JWKS caching, no client trust.
- RSE-271225-022936.txt L2663-L2694: user_plan and billing_webhook_event tables.

## Endpoints
- GET /api/me (Auth required; all plans)
- POST /api/billing/checkout-session (Auth required; Plus upgrade)
- GET /api/billing/portal (Auth required; Plus)
- POST /api/billing/webhook (No auth; Stripe signature required)
- Protected endpoints (Plus required): /api/pulse/*, /api/exports/*, /api/history/*

## Data Tables
- silver.user_account
- silver.user_plan
- silver.plan_usage_counter
- silver.billing_webhook_event

## /api/me Response Contract
{
  "success": true,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com"
  },
  "plan": {
    "plan_code": "free",
    "status": "active"
  },
  "entitlements": {
    "pulse_access": "none",
    "exports_enabled": false,
    "alerts_max": 0,
    "history_max_days": 30
  },
  "usage": {}
}

## Exit Criteria
- Plane A validates Supabase JWTs (JWKS first, remote fallback).
- /api/me returns plan and entitlements for authenticated users.
- Stripe checkout and webhook flows update silver.user_plan.
- Server-side entitlements enforced on protected endpoints.
- Tests cover auth verification and entitlement gating.

## Non-goals
- No custom auth system.
- No client-trusted entitlements.
- No Plane B or Plane C changes beyond documentation.
