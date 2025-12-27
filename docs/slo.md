## P95 search latency <200ms
Definition: 95th percentile response time for search and compare endpoints stays under 200ms. Measurement: capture request latency from Plane A logs and compute p95 for /api/quotes/current and /api/popular-corridors (monitoring TBD).

## Tier-1 freshness <=15m
Definition: for Tier-1 corridors, the latest quote age is no more than 15 minutes. Measurement: compute NOW() - collected_at from the latest quote records in Silver (monitoring TBD).

## Tier-3 freshness <=4h
Definition: for Tier-3 corridors, the latest quote age is no more than 4 hours. Measurement: compute NOW() - collected_at from the latest quote records in Silver (monitoring TBD).

## Derived coverage >=3 providers
Definition: any derived output exposed externally must have contributions from at least 3 providers. Measurement: enforce in publisher gates and record contributor_count per dataset (monitoring TBD).
