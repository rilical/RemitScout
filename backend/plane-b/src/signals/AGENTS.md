---
entrypoints:
  - "backend/plane-b/src/signals/anomaly-detector.ts"
  - "backend/plane-b/src/signals/anomaly-config.ts"
evidence_skills:
  - "evidence.provider_health.github_actions"
common_reason_codes:
  - "provider.no_recent_success"
---
# Plane B Signals (AGENTS)

What this directory is:
Signal detection and anomaly logic used to raise ops events and Cases.

Entrypoints:
- `backend/plane-b/src/signals/anomaly-detector.ts`
- `backend/plane-b/src/signals/anomaly-config.ts`

Common failure modes:
- Noisy detectors causing alert fatigue.
- Detectors missing provider blocks leading to delayed response.

Evidence skills to run:
- `evidence.provider_health.github_actions`

Do-not-break rules:
- Every emitted signal must be dedupe-able and bounded.
- Preserve rights-matrix NULL/empty semantics (empty set must not match all).

