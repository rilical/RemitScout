# Frontend Architecture (DDD) — Module Layout + Boundaries

Feedback source: chat transcript
Goal: frontend DDD domain map + module layout proposal

This doc proposes a **bounded-context map** and a pragmatic module layout for the Nuxt frontend. It is intentionally **doc-only** and scoped to be actionable for the next refactor slices (scaffolding folders, then migrating 1–2 pages).

## Why we’re doing this

- **Business**: reduce UI regressions + speed up feature delivery by cutting duplication and making ownership obvious.
- **Engineering**: stop “god pages” (e.g. `frontend/pages/dashboard.vue`) from accumulating mixed responsibilities.
- **UX**: enforce consistent layout + table patterns (via `ui/CenteredPage` + `ui/DataTable`).

## Nuxt constraint (important)

Nuxt uses `frontend/pages/**` as the router. We should not fight that.

**Policy**: treat `frontend/pages/**` as the **app layer** (route shells).

- Pages should be **thin**: parse route params, set SEO, render a domain “page component”.
- Pages should not: call `fetch`/`$fetch`, contain data-mapping business logic, or implement table rendering logic.

## Target folder layout (under `frontend/`)

```txt
frontend/
  pages/                      # Nuxt routes (thin shells only)
  layouts/                    # Nuxt layouts (thin)

  domains/
    <domain>/
      domain/                 # pure business rules (no Vue, no Nuxt, no HTTP)
      application/            # use-cases + orchestration (composables ok, but no UI)
      infrastructure/         # API adapters, persistence, backend proxy clients
      ui/                     # Vue components/pages using application layer
      docs/README.md          # domain boundary + how-to
      index.ts                # ONLY public exports

  shared/
    ui/                       # reusable UI primitives (e.g. DataTable, CenteredPage)
    lib/                      # formatting/helpers (money, dates, etc)
    types/                    # shared types (DTOs that span domains)
    config/                   # constants, feature flags (non-secret)
    docs/                     # architecture + UI system docs

  platform/
    http/                     # single HTTP client + backend contract helpers
    telemetry/                # analytics/event helpers
    auth/                     # auth/session primitives used across domains
    runtime/                  # env/runtime config helpers

  server/                     # Nuxt server routes/proxy (treat as platform boundary)
```

## Bounded contexts (proposed)

These are grounded in existing route structure under `frontend/pages/**`.

### 1) Transfers (Quote + Comparison)

**Purpose**: corridor selection, amount/method inputs, quote lists, “recipient gets”, rankings.

- Routes: `frontend/pages/send-money/**`, legacy redirects in `frontend/pages/compare/**`
- Likely submodules later: `quotes`, `methods`, `provider-ranking`, `corridor-slugs`

### 2) Market Data (Rates / Pulse / Indices)

**Purpose**: exchange rates, pulse feeds, index methodology pages and visualizations.

- Routes: `frontend/pages/exchange-rates/**`, `frontend/pages/pulse.vue`, `frontend/pages/indices-methodology.vue`, `frontend/pages/methodology.vue`

### 3) Account (Auth + Billing)

**Purpose**: sign-in/up, password reset, OAuth callback, subscriptions.

- Routes: `frontend/pages/sign-in.vue`, `frontend/pages/sign-up.vue`, `frontend/pages/forgot-password.vue`, `frontend/pages/reset-password.vue`, `frontend/pages/auth/**`, `frontend/pages/plus/**`, `frontend/pages/plus.vue`

### 4) Dashboard (Saved Corridors, Alerts, History)

**Purpose**: authenticated user home, watchlist, alerts, personal insights.

- Routes: `frontend/pages/dashboard.vue` (contains watchlist + alerts via tabs)
- Redirect helpers: `frontend/pages/watchlist.vue`, `frontend/pages/alerts.vue`

### 5) Providers (Directory + Reviews + Affiliate Outbound)

**Purpose**: provider directory, provider profile/reviews, outbound affiliate tracking.

- Routes: `frontend/pages/providers.vue`, `frontend/pages/reviews/**`, `frontend/pages/go/[provider].vue`

### 6) Enterprise (Exports + Institutions)

**Purpose**: enterprise plan marketing + gated features like exports.

- Routes: `frontend/pages/enterprise/exports.vue`, `frontend/pages/institutions/**`

### 7) Admin (Internal Consoles)

**Purpose**: internal telemetry, audit, enterprise admin.

- Routes: `frontend/pages/admin/**`

### 8) Content (Marketing + Legal + Support)

**Purpose**: SEO/content pages and support surfaces that shouldn’t leak business logic.

- Routes: `frontend/pages/learn/**`, `frontend/pages/legal/**`, `frontend/pages/about.vue`, `frontend/pages/contact.vue`, `frontend/pages/faq.vue`, `frontend/pages/partnerships.vue`, etc.

## Dependency rules (strict)

The goal is one-way dependencies and preventing “UI reaches into infra” spaghetti.

### Allowed

- `pages/**` → `domains/**` + `shared/**` + `platform/**`
- `domains/<x>/ui/**` → `domains/<x>/application/**` + `shared/**` + `platform/**`
- `domains/<x>/application/**` → `domains/<x>/domain/**` + `domains/<x>/infrastructure/**` + `shared/**` + `platform/**`
- `domains/<x>/infrastructure/**` → `platform/**` (+ raw DTO types in `shared/types`)

### Forbidden

- `shared/**` → `domains/**` (shared must stay domain-agnostic)
- `domains/<x>/domain/**` importing:
  - `vue`, `nuxt`, `#app`, `~/pages`, `~/components`, `~/server`
  - any HTTP client directly
- `domains/<x>/ui/**` calling HTTP directly (no `fetch/$fetch/axios`): must go through application services/hooks.
- Cross-domain imports (`domains/a` → `domains/b`) unless explicitly defined as a shared contract in `shared/types` (default stance: **avoid**).

## Public API per domain (`index.ts`)

Each domain exposes a **small, intentional** surface. Everything else is private by convention.

Example pattern:

```ts
// frontend/domains/transfers/index.ts
export { TransfersPage } from './ui/pages/TransfersPage.vue'
export { useQuotes } from './application/useQuotes'
export type { Quote, QuoteRequest } from './domain/types'
```

Rules:

- `pages/**` should import from `domains/<domain>/index.ts` whenever possible.
- Domain internals should not be imported directly from outside the domain.
- If we need a new “public thing”, we add it to `index.ts` intentionally.

## Recommended first 2 page migrations (practical)

Pick pages with high table duplication so `ui/DataTable` pays for itself immediately.

1) `frontend/pages/enterprise/exports.vue`
   - Multiple `<table>` blocks; easy win to adopt `CenteredPage` + `DataTable` “dashboard” variant.
   - Natural domain home: `domains/enterprise`.

2) `frontend/pages/admin/analytics.vue`
   - Several tables with repeated “empty row” patterns.
   - Great fit for `DataTable` “terminal” variant (dense, internal-console feel).
   - Natural domain home: `domains/admin`.

If we want a user-facing migration earlier (marketing impact), the next candidate is `frontend/pages/send-money/**` in `domains/transfers`.

## Enforcement (next slice, not in this doc-only PR)

To make boundaries real (not aspirational), add mechanical checks:

- **Path aliases**: `~/domains`, `~/shared`, `~/platform` (Nuxt supports this nicely).
- **ESLint boundaries**: use `eslint-plugin-boundaries` (or a small custom rule) to block forbidden imports.
- **File size guardrail**: warn on pages/components exceeding ~300 LOC unless explicitly approved.

## Notes / assumptions

- Frontend is Nuxt (Vue SFC), not React.
- Existing shared primitives already exist:
  - `frontend/components/shared/CenteredPage.vue`
  - `frontend/components/shared/DataTable.vue` (`terminal` / `dashboard` variants)
