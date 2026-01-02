| Service | Plane | Description | Owner | Runtime | Notes |
| --- | --- | --- | --- | --- | --- |
| Plane A API | A | Public API surface for compare and discovery. | TBD | Fastify | Runs in backend/plane-a. |
| Plane B Ingestion Worker | B | Seed ingestion and future collectors. | TBD | Node script | Runs in backend/plane-b. |
| Plane B Provider Collectors | B | Provider collectors and scheduler for B2B sweeps and refreshes. | TBD | Node script | Runs in backend/plane-b/src/providers. |
| Plane C Pulse Service | C | Pulse analytics API surface. | TBD | Fastify | Runs in backend/plane-c. |
| Gold Publisher/Aggregator | C | Batch aggregation and publish gates. | TBD | Batch job | Gold-only outputs. |
| Gold Popular Corridors Job | B | Refreshes gold.popular_corridors cache from recent searches and quotes. | TBD | Batch job | Runs in backend/scripts/gold-popular-corridors-job.ts. |
| Gold FX Rates Job | B | Aggregates weighted FX rates into gold.fx_rates. | TBD | Batch job | Runs in backend/scripts/gold-fx-rates-job.ts. |
| Gold Pulse Cache Job | B | Populates gold.pulse_cache entries for Pulse UI. | TBD | Batch job | Runs in backend/scripts/gold-pulse-cache-job.ts. |
| Export Worker | C | Generates export files from Gold. | TBD | Worker | Gold-only export. |
| Identity/Billing | A | Auth and billing integrations. | TBD | Supabase/Stripe | External services. |
| Entitlements/Auth | A | Verifies JWTs and enforces plan entitlements. | TBD | Fastify | Plane A middleware. |
| Billing Webhook Handler | A | Processes Stripe webhook events. | TBD | Fastify | Plane A route. |
| Watchlists/Alerts Service | A | User watchlists and alerts. | TBD | Service | Future module. |
