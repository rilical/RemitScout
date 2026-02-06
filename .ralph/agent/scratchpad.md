# Scratchpad (Ralph)

## 2026-02-06

**Feedback source:** chat transcript (this run prompt)

**Goal (1 phrase):** backend slop audit + DDD domain map baseline

### Current understanding
- We need evidence-based docs under `docs/refactor/` (baseline, slop inventory, DDD map, refactor slices, golden patterns).
- This must stay “plan + inventory” (no big refactor yet), but we can add small analysis helpers/scripts if they’re non-invasive.
- Business need: reduce future refactor risk by grounding bounded contexts and module boundaries in real hotspots/duplication, not opinions.

### Plan (repo-specific, evidence-first)
1) Build baseline: read `ARCHITECTURE.md`, backend entrypoints, and AWS CDK wiring to document runtime, planes/services, data stores, queues/workers, auth model, and observability gaps.
2) Quantify slop: compute top 20 largest backend modules by LOC; identify god modules (>400 LOC) and boundary violations (domain logic in handlers/infrastructure).
3) Map duplication: find repeated patterns (validation, provider normalization/mapping, error mapping, fee/corridor parsing) via ripgrep similarity and by inspecting repeated helper code.
4) Propose DDD bounded contexts (5–8) tied to real modules and flows; draft target folder/module structure with strict dependency rules.
5) Produce refactor plan (10–20 slices) with measurable wins and low-risk sequencing; include “tooling guardrails” (lint/enforced boundaries).
6) Specify 3 golden patterns to standardize (errors, request context, port/adapter for providers).

### Notes / constraints
- Follow `AGENTS.md` policy when we begin reviewing backend code: load `ARCHITECTURE.md` + `agents/AGENT-MATCH.md` first, then select the right `agents/rag/<agent>.md` for deeper review.
- Keep changes additive (docs + optional scripts); avoid behavioral changes.

