---
entrypoints:
  - "backend/plane-b/src/normalize/quote-normalizer.ts"
  - "backend/plane-b/src/normalize/quality-flags.ts"
evidence_skills:
  - "evidence.bronze_silver_throughput.github_actions"
common_reason_codes:
  - "pipeline.conversion_ratio_low"
---
# Plane B Normalization (AGENTS)

What this directory is:
Transforms Bronze payloads into normalized Silver quote rows.

Entrypoints:
- `backend/plane-b/src/normalize/quote-normalizer.ts`
- `backend/plane-b/src/normalize/quality-flags.ts`

Common failure modes:
- Parser changes cause systematic drops to Silver (conversion ratio low).
- Quality flags over-trigger, suppressing too much data.

Evidence skills to run:
- `evidence.bronze_silver_throughput.github_actions`

Do-not-break rules:
- Never emit unbounded payload dumps from provider responses.
- Keep normalization deterministic and reason-coded.

