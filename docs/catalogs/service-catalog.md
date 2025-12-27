| Service | Plane | Description | Owner | Runtime | Notes |
| --- | --- | --- | --- | --- | --- |
| Plane A API | A | Public API surface for compare and discovery. | TBD | Fastify | Runs in backend/plane-a. |
| Plane B Ingestion Worker | B | Seed ingestion and future collectors. | TBD | Node script | Runs in backend/plane-b. |
| Plane C Pulse Service | C | Pulse analytics API surface. | TBD | Fastify | Runs in backend/plane-c. |
| Gold Publisher/Aggregator | C | Batch aggregation and publish gates. | TBD | Batch job | Gold-only outputs. |
| Export Worker | C | Generates export files from Gold. | TBD | Worker | Gold-only export. |
| Identity/Billing | A | Auth and billing integrations. | TBD | Supabase/Stripe | External services. |
| Entitlements/Auth | A | Verifies JWTs and enforces plan entitlements. | TBD | Fastify | Plane A middleware. |
| Billing Webhook Handler | A | Processes Stripe webhook events. | TBD | Fastify | Plane A route. |
| Watchlists/Alerts Service | A | User watchlists and alerts. | TBD | Service | Future module. |
