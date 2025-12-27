| Method | Path | Auth | Entitlement | Description | OpenAPI |
| --- | --- | --- | --- | --- | --- |
| GET | /api/quotes/current | Public (IP rate limit) | None | Current quotes for a corridor. | docs/openapi/public.yaml |
| GET | /api/popular-corridors | Public (IP rate limit) | None | Popular corridors summary. | docs/openapi/public.yaml |
| GET | /api/me | User JWT | All plans | Plan and entitlements for the current user. | docs/openapi/auth.yaml |
| POST | /api/billing/checkout-session | User JWT | Plus upgrade | Create a Stripe checkout session. | docs/openapi/billing.yaml |
| GET | /api/billing/portal | User JWT | Plus | Create a Stripe billing portal link. | docs/openapi/billing.yaml |
| POST | /api/billing/webhook | None | N/A | Stripe webhook handler. | docs/openapi/billing.yaml |
