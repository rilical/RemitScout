# Market Data domain

**Purpose**: exchange rates, pulse feeds, indices + methodology presentation.

## Boundaries

- Owns: market/rates query models, domain-specific formatting and presentation logic.
- Does not own: generic table/layout primitives (shared/ui), auth (platform), HTTP client (platform/http).

## Public exports

- Import from `frontend/domains/market-data/index.ts`.
- Exports: `useFxPairExchangeRates`, `FxPairExchangeRatesPage`, `FxProviderPricingTable`.

## How to add a feature

1. Add domain types/rules in `domain/`.
2. Add composables/use-cases in `application/`.
3. Implement API adapters in `infrastructure/`.
4. Build UI in `ui/` and render via thin Nuxt pages.

## Forbidden

- No direct HTTP calls from `ui/`.
- No Vue/Nuxt imports from `domain/`.
