# Corridor Coverage Policy (Sprint 3)

## Corridor discovery
- Corridors are discovered from provider responses and written to silver.provider_corridor_capability.
- There is no static seed list. Discovery corridors are dynamic and can change over time.

## Tier definitions
- Tier 1: provider_count >= 3 with allowed_b2b=true, success_rate >= 95 percent, freshness P95 <= 30 minutes, block_rate <= 3 percent (rolling window).
- Tier 2: provider_count 1-2, or success_rate < 95 percent, or freshness P95 > 30 minutes, or block_rate > 3 percent.
- Tier 3: discovery corridors with insufficient data or unstable signals.

## Promotion and demotion
- Promote to Tier 1 after meeting Tier 1 criteria for 3 consecutive days.
- Demote from Tier 1 if criteria fail for 2 consecutive days.
- Tier 2 or Tier 3 corridors are not eligible for B2B indices.

## Scheduling rules
- Tier 1 corridors run at the B2B cadence and feed normalization outputs.
- Tier 2 corridors run at reduced cadence.
- Tier 3 corridors run only for discovery.

## B2B eligibility
- B2B indices are generated only from Tier 1 corridors.
- If Tier 1 criteria fail, publish_status becomes quarantined.
