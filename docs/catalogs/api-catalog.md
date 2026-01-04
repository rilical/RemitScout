| Method | Path | Auth | Entitlement | Description | OpenAPI | Frontend |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /api/providers | Public (IP rate limit) | None | Provider quotes with metadata for frontend comparison. | docs/openapi/api.yaml | ✅ useProviders() |
| GET | /api/quotes/current | Public (IP rate limit) | None | Current quotes for a corridor (raw data). | docs/openapi/api.yaml | ✅ Direct calls |
| GET | /api/popular-corridors | Public (IP rate limit) | None | Popular corridors summary. | docs/openapi/api.yaml | ✅ usePopularCorridors() |
| GET | /api/me | User JWT | All plans | Plan and entitlements for the current user. | docs/openapi/api.yaml | ✅ useMe() |
| POST | /api/billing/checkout-session | User JWT | Plus upgrade | Create a Stripe checkout session. | docs/openapi/api.yaml | ✅ Checkout flow |
| GET | /api/billing/portal | User JWT | Plus | Create a Stripe billing portal link. | docs/openapi/api.yaml | ✅ Account settings |
| POST | /api/billing/webhook | None | N/A | Stripe webhook handler. | docs/openapi/api.yaml | ✅ Stripe webhooks |
| GET | /api/pulse/status | User JWT | Pulse | Pulse service status check. | docs/openapi/api.yaml | ✅ Pulse dashboard |
| GET | /api/ops/{provider}/health | Admin JWT | Admin | Provider health check (admin only). | docs/openapi/api.yaml | ❌ Admin only |
| GET | /healthz | None | None | Basic health check. | docs/openapi/api.yaml | ✅ Monitoring |
| GET | /readyz | None | None | Readiness check (database connectivity). | docs/openapi/api.yaml | ✅ Kubernetes |
| GET | /metrics | None | None | Prometheus metrics. | docs/openapi/api.yaml | ✅ Monitoring |
