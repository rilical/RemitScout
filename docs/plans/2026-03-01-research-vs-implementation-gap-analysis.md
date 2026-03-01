# Research vs Implementation Gap Analysis

**Date:** 2026-03-01
**Scope:** Audit all Remit-Scout research documents against the production codebase
**Approach:** Risk-weighted hybrid (quick wins first, then medium effort, then strategic)

## Research Sources Audited

1. **RSE Notion Knowledge Base** - Methodologies (The Alpha), System Architecture, Data Models, Compliance & Governance, Pulse Analytics, Advertisements & Affiliate Links
2. **Triangulating Effective Dollar Value in a Corridor** - EDV theory, identification assumptions, arbitrage bounds, rail choice models
3. **Research Questions and Validation Agenda** - Agent-Native Liquidity Observability Platform validation trials (E1-E10), 13 research sections

---

## Category A: Fully Aligned (35 items)

These research concepts have matching production implementations. No action needed.

### Core Indices & Formulas

| Research Concept | Code Location | Match Quality |
|---|---|---|
| RCI formula (basis points) | `backend/scripts/gold-indices-job.ts:290-293` | Exact: `((best_rate - implied_fx_rate) / best_rate) * 10000` |
| RCI statistics (median, p10, p90, dispersion) | `gold-indices-job.ts:302-318` | Complete |
| RCI ratio (all-in cost) | `gold-indices-job.ts:429-432` | Weighted cost ratio |
| TEER weighted composite rate | `gold-indices-job.ts:444-448` | `mid_market * (1 - weighted_cost)` |
| RVI (basis points, Bessel-corrected) | `gold-indices-job.ts:455-461` | `(rvi_value / teer_rate) * 10000` |
| Implied FX rate derivation | `backend/plane-b/src/normalize/quote-normalizer.ts` | `receive_amount / send_amount` with tolerance checks |

### Architecture & Data Pipeline

| Research Concept | Code Location | Match Quality |
|---|---|---|
| 3-Plane Architecture (A/B/C) | `backend/plane-a/`, `plane-b/`, `plane-c/` | Exact structural match |
| Bronze/Silver/Gold storage layers | S3 + Aurora Postgres + ClickHouse | Exact match |
| Quote normalization pipeline | `backend/plane-b/src/normalize/quote-normalizer.ts` (450 LOC) | Production-ready |
| CDP daily table + computation | `002_rse_silver_core.sql` + `gold-indices-job.ts` | Full schema + batch/live jobs |
| Provider rights matrix | `quotes.ts` + DB rights table | Active enforcement |
| Collector tiers (A: API, B: Headless) | Architecture + probe configs | Implemented |

### Pricing & Comparison

| Research Concept | Code Location | Match Quality |
|---|---|---|
| Amount bucket system | `backend/shared/amount-bucket.ts` | [50, 100, 500, 1000, 3000, 10000] |
| Method profiles (7 types) | `backend/plane-b/src/normalize/method-profile.ts` | Complete mapping |
| Quality flags | `backend/plane-b/src/normalize/quality-flags.ts` | 8+ flag types |
| Quote Best Flags | `frontend/components/corridor/BestOptionsRow.vue` + `FlattenedQuote` | cheapest/fastest/topRated/bestValue |
| Smart Send Savings | `frontend/lib/trueCostCalculator.ts` | Spread, delta, markup calculations |
| RemitScore (static) | `frontend/lib/providerScores.ts` | Hardcoded 1-10 scores for 24 providers |

### Triangulation & Stress

| Research Concept | Code Location | Match Quality |
|---|---|---|
| Triangulation engine | `backend/plane-b/src/triangulation/engine.ts` (552 LOC) | Two-leg via USD/EUR/GBP, 7 signal layers |
| Corridor stress signals (8 types) | `backend/plane-b/src/triangulation/corridor-stress.ts` (530 LOC) | Weighted composition with hysteresis |
| Signal combiner | `backend/plane-b/src/triangulation/signal-combiner.ts` | Direct (0.5) + triangulated (0.2) + factor (0.3) |
| Hysteresis state machine | `corridor-stress.ts` | Deadband thresholds + 2min dwell |
| Arbitrage detection | `frontend/components/pulse/PulseArbitrageAlert.vue` + API | Spread anomaly + percentile analysis |

### Caching & Scheduling

| Research Concept | Code Location | Match Quality |
|---|---|---|
| Volatility-based dynamic caching | `backend/shared/volatility-service.ts` | CoV metric, 3 TTL tiers (30min/2hr/6hr) |
| Corridor tier SLOs | `backend/shared/corridor-tiers.ts` | Tier 1=10min (USD), Tier 2=3hr |
| Provider weighting | `backend/scripts/provider-weighting-job.ts` | Corridor-specific + global fallback with confidence blending |
| Outlier suppression | `gold-indices-job.ts` | `is_outlier` flag + `suppression_reason` |

### Governance & Operations

| Research Concept | Code Location | Match Quality |
|---|---|---|
| Gold Publisher Gates | `backend/plane-c/src/services/publisher-gates.ts` + tests | N>=3, dominance checks (W_max 50%, W_top2 75%) |
| Index governance + versioning | `agents/rag/index-governance.md` | 3-axis: parser_version, schema_version, methodology_version |
| TCE framework | `agents/rag/index-governance.md` | 4 error classes with measurable SLIs |
| Mystery shopper spec | `agents/rag/signal-modules.md` | HumanObservationPayload + audit protocol |
| Confidence scoring | `weight_confidence` in gold schema | 0-1 scale + high/medium/low levels |
| Data quality sentinel | `agents/rag/data-quality-sentinel.md` | Z-score thresholds + auto-stoplist |

### Product & Monetization

| Research Concept | Code Location | Match Quality |
|---|---|---|
| Affiliate telemetry | Migrations 035, 044 | Click + conversion tracking |
| Alert evaluation (daily/weekly) | `backend/plane-a/src/services/alert-evaluator.ts` | Plan-gated with comparators |
| Stripe/Plus plans | `backend/plane-a/src/services/stripe-client.ts` | Checkout + entitlements |
| Watchlist persistence | `backend/plane-a/src/repositories/implementations/watchlist-repository.ts` | Full CRUD + soft deletes |
| Provider catalog (24 providers) | `backend/shared/provider-catalog.ts` | Runtime catalog with health corridors |
| Leader change frequency | Pulse chart registry | Dashboard metric |
| Cost volatility tracking | RVI metrics + `corridor_volatility_cache` | Full pipeline with alert gating |

---

## Category B: Production Code Gaps (6 items)

These are features described in research that should be implemented as code.

### Tier 1: Quick Wins (leverage existing data, small additions)

#### P1: Pulse Opportunity Detection

**Research:** Methodologies 4.13 - A corridor is flagged as an "opportunity" if current best all-in cost (RCI) is meaningfully lower than rolling historical baseline (7-day rolling average), delta exceeds threshold (e.g., 5% lower), and output passes Publisher gates.

**Current state:** Corridor stress signals exist. RCI computed daily. No consumer-facing "good time to send" flag.

**Gap:** Missing the comparison logic: `current_rci < (rolling_7d_avg_rci * 0.95)` and a way to surface it in Pulse.

**Estimated effort:** Small. RCI history exists in `cdp_daily`. Add a rolling average query + threshold comparison + expose via Pulse API.

#### P2: Quote Executability Validation

**Research:** EDV doc, Identification Assumption IA1 - "Captured quotes represent executable terms at capture time (or are labeled as non-executable)."

**Current state:** Quotes are collected and normalized. No explicit `is_executable` flag. Promotional prices and non-executable marketing teasers treated the same as real quotes.

**Gap:** Missing a field/flag to distinguish executable quotes from promotional/teaser quotes. This affects TEER accuracy (promotional prices bias the index).

**Estimated effort:** Small-medium. Add `is_executable` flag to quote normalization. Heuristics: if promotional_rate diverges significantly from derived rate, flag as non-executable.

### Tier 2: Medium Effort

#### P3: Anti-Circularity Weight Validation

**Research:** EDV doc (RQ2.5-2.6) - Volume weights are endogenous (EDV affects volume, volume affects price observation). Need externally anchored weights or sensitivity testing.

**Current state:** `provider-weighting-job.ts` exists with corridor-specific weights + confidence blending. No validation that weights aren't circular.

**Gap:** No automated weight perturbation test. No comparison between current weights and externally anchored alternatives (migrant stock proxies, historical corridor weights).

**Estimated effort:** Medium. Add a weight sensitivity analysis job that compares TEER under current weights vs pinned/baseline weights. Alert if conclusions change materially.

#### P4: Signal Layer Ablation Tooling

**Research:** EDV doc + Validation Agenda (E2) - Remove each signal layer and quantify degradation in explanatory power and forecast performance. Identify marginal contribution of each layer.

**Current state:** Triangulation engine combines 7 signal layers with fixed weights. No automated ablation capability.

**Gap:** No way to programmatically disable a signal layer and measure TEER/RVI/RCI stability impact. Would reveal redundancy and circular dependencies.

**Estimated effort:** Medium. Build an ablation mode in the gold indices job that can exclude layers and compare outputs. Store results for analysis.

### Tier 3: Strategic (Larger Effort)

#### P5: EDV Residual Monitoring

**Research:** EDV doc + Validation Agenda (E1) - Track systematic residuals between TEER and reference anchors (mid-market, NDF where available). Persistent residuals = unknown mechanism prompts for investigation.

**Current state:** TEER vs mid-market comparison exists in gold indices job (rate inversion check). No systematic residual tracking over time, no NDF comparison.

**Gap:** Missing a residual time-series that monitors `TEER - reference_anchor` per corridor. Persistent, pattern-stable residuals should trigger investigation flags.

**Estimated effort:** Medium-large. Requires: residual computation per corridor, persistence, drift/change-point detection, and alerting when residuals become persistent vs transitory.

#### P6: ISER Full Methodology

**Research:** Methodologies 4.2 - Infer shadow FX rates from crypto P2P stablecoin pricing, MTO spreads, other approved public signals. Quality filters (minimum coverage, outlier rejection, PIT correctness).

**Current state:** `implied_fx_rate` field exists on every quote. On-chain signals listed in signal modules spec but not implemented as ISER.

**Gap:** The full shadow FX methodology (gathering permitted reference prices in local currency, computing implied pairwise rates, applying quality filters) is not built.

**Estimated effort:** Large. Requires: crypto P2P data ingestion, local currency on-ramp/off-ramp tracking, quality filters, and integration with TEER as a conditioning signal.

---

## Category C: Validation Experiments (10 trials)

These are research/operational trials from the Validation Agenda. Not production features, but experiments to validate the theory.

| Trial | What it validates | Dependencies |
|---|---|---|
| E1: Construct validity benchmark | EDV vs official FX vs mid-market across regimes | P5 (residual monitoring) |
| E2: Layer ablation study | Marginal value of each signal layer | P4 (ablation tooling) |
| E3: Crisis week simulation | Coverage under stress: outages + HTML drift + rate limits | Existing infrastructure |
| E4: DOM drift corpus + patch bench | Detection + repair proposal accuracy | Agent system |
| E5: Mystery-shopper audit program | Quote-vs-realized slippage calibration | External execution |
| E6: Adaptive probing A/B | Static vs stress-adaptive cadence effectiveness | Existing stress responder |
| E7: Governance tabletop | Replay, versioning, client communication workflow | Existing governance framework |
| E8: Tool-gateway security red-team | Prompt injection defense in payload channels | Agent system |
| E9: Buyer DDQ pilot | Evidence pack review with target buyer persona | Business development |
| E10: Workflow engine bake-off | Step Functions vs Temporal for Lane B | Architecture decision |

---

## Category D: Methodological Decisions (4 items)

Strategic choices that inform design but don't require code today.

| Decision | Question | Impact |
|---|---|---|
| D1: Index number formulation | Should TEER use chain-weighted vs fixed-base (Laspeyres/Paasche/Fisher)? | Affects TEER accuracy under provider churn |
| D2: Rail choice model | Discrete choice (multinomial logit) vs reduced-form? | Defines whether EDV is "best quote" or "choice-weighted expected rate" |
| D3: Stablecoin signal role | Price-defining rails or regime indicators? Per-corridor | Determines how crypto signals enter TEER |
| D4: IOSCO alignment level | Which governance principles now vs later? | Affects benchmark credibility timeline |

---

## Proposed Implementation Roadmap (Approach C: Risk-Weighted Hybrid)

### Phase 1: Quick Wins (Tier 1) - leverage existing data

1. **P1: Pulse Opportunity Detection** - Add rolling 7-day RCI average comparison. Surface "good time to send" in Pulse. Small effort, high user-facing value.
2. **P2: Quote Executability Validation** - Add `is_executable` flag to normalization. Improve TEER accuracy by filtering promotional teasers.

### Phase 2: Validation Infrastructure (Tier 2)

3. **P3: Anti-Circularity Weight Validation** - Weight sensitivity analysis job. Validate current weighting approach isn't circular.
4. **P4: Signal Layer Ablation Tooling** - Build ablation mode for gold indices. Enables E2 trial.
5. **E3: Crisis Week Simulation** - Stress test coverage. Validates "coverage under stress" claim.
6. **E5: Mystery Shopper Program** - Begin audit program. Calibrates TEER decomposition.

### Phase 3: Advanced Analytics (Tier 3)

7. **P5: EDV Residual Monitoring** - Systematic residual tracking vs reference anchors. Surfaces unknown unknowns.
8. **D1-D4: Methodological Decisions** - Make informed by Phase 2 validation results.
9. **P6: ISER Full Methodology** - Only after stablecoin signal role (D3) is decided.
10. **E1, E2: Construct Validity + Ablation Studies** - Enabled by Phase 2 tooling.

---

## Overall Truthfulness Assessment

**Score: ~85% aligned**

The codebase is strongly truthful to the research. The core computation (RCI/TEER/RVI/Gold Publisher Gates), the architecture (3-plane, Bronze/Silver/Gold), and the operational framework (stress signals, triangulation, quality flags, governance) all match.

The 15% gap is concentrated in:
- **Validation infrastructure** (proving the algorithms work as theorized)
- **Consumer-facing signals** derived from existing computations (Pulse Opportunities)
- **Advanced identification** (executability, anti-circularity, residual monitoring)
- **ISER** (shadow FX from alternative rails)

None of the gaps represent a fundamental deviation from the research vision. The foundation is solid; the gaps are about proving correctness and extending coverage.
