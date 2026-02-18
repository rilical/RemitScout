---
entrypoints:
  - "backend/plane-b/src/collectors/base-collector.ts"
  - "backend/plane-b/src/collectors/block-detection.ts"
  - "backend/plane-b/src/collectors/collector-metrics.ts"
  - "backend/plane-b/src/providers/index.ts"
evidence_skills:
  - "evidence.provider_health.github_actions"
  - "evidence.bronze_silver_throughput.github_actions"
common_reason_codes:
  - "provider.blocked.http_403"
  - "pipeline.silver_lag_high"
---
# Plane B Collectors (AGENTS)

What this directory is:
Collector runtime for ingesting provider data into Bronze/Silver, including block detection and metrics.

Entrypoints:
- `backend/plane-b/src/collectors/base-collector.ts`
- `backend/plane-b/src/collectors/block-detection.ts`
- `backend/plane-b/src/collectors/collector-metrics.ts`
- `backend/plane-b/src/providers/index.ts`

Common failure modes:
- Provider blocks (403/captcha) not detected early, causing silent freshness drop.
- Rate limiting/backoff misconfigured, leading to 429 storms.
- Collector writes Bronze but normalization stops before Silver.

Evidence skills to run:
- `evidence.provider_health.github_actions`
- `evidence.bronze_silver_throughput.github_actions`

Do-not-break rules:
- Keep CloudWatch dimensions low-cardinality.
- Do not add per-corridor metrics unless explicitly approved.

