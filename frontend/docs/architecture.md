# Frontend Architecture (Nuxt 3) — DDD + UI System Proposal

Feedback source: chat transcript
Goal: production-grade frontend DDD refactor + design-system uplift

This frontend is **Nuxt 3 (Vue 3) + TypeScript + Tailwind + Pinia**. The refactor plan below keeps Nuxt conventions (SSR/ISR, pages-based routing) while introducing **bounded contexts** and **strict module boundaries** to reduce duplication and make future changes safer.

## 1) Current stack + wiring (observed)

- **Framework**: Nuxt 3 (`frontend/nuxt.config.ts`, `frontend/app.vue`)
- **Routing**: filesystem routes under `frontend/pages/**`
- **State**: Pinia (`frontend/stores/**`, `@pinia/nuxt`)
- **Styling**: Tailwind (`frontend/tailwind.config.js`) with some token groundwork (`colors.brand`, `neutral`, `fontSize.scale-*`)
- **Data access**:
  - Client/server fetch wrapper: `frontend/composables/useApi.ts`
  - Server-side proxy: `frontend/server/utils/backendProxy.ts`
- **Testing**: Vitest + Playwright (`frontend/vitest.config.ts`, `frontend/playwright.config.ts`)

Business note: there’s a heavy **SEO/marketing/content** surface (provider reviews, learn pages). We need to improve maintainability without hurting SEO outputs or indexing stability.

## 2) Slop inventory: top “god files” (by LOC)

Biggest sources of complexity are **route pages** that mix:
UI composition + data fetching + formatting + business rules + large static content.

Top offenders (non-exhaustive, generated from `wc -l` on tracked files):

1. `frontend/pages/dashboard.vue` (~6134)
2. `frontend/pages/send-money/[from]-to-[to].vue` (~4231)
3. `frontend/pages/methodology.vue` (~1937)
4. `frontend/pages/pulse.vue` (~1801)
5. `frontend/pages/partnerships.vue` (~1791)
6. `frontend/pages/learn/providers/placid.vue` (~1590)
7. `frontend/pages/learn/providers/singx.vue` (~1578)
8. `frontend/pages/learn/providers/worldremit.vue` (~1547)
9. `frontend/pages/learn/providers/xoom.vue` (~1524)
10. `frontend/pages/learn/providers/xe-money.vue` (~1510)

Observation: most `frontend/pages/learn/providers/*.vue` share an almost identical structure (hero/breadcrumbs, score card, CTA buttons, FAQ sections). They should be **templated** from data, not copy/paste pages.

## 3) Duplicated patterns worth centralizing

These are high ROI because they reduce both bugs and future change cost:

- **HTTP base join + retry/backoff** duplicated between `frontend/composables/useApi.ts` and `frontend/server/utils/backendProxy.ts`.
- **Request IDs + forwarded headers** are implemented in multiple places; should be a single platform concern.
- **Formatting** (money, time, currencies, country/flag/corridor labels) appears spread across pages/components; should be shared utilities.
- **SEO structured data** is centralized nicely in `frontend/composables/useStructuredData.ts`, but many pages still hardcode long SEO blocks; split “SEO recipe” vs “page content”.
- **Provider review pages** are effectively a static CMS implemented as Vue SFCs; move to a single template + per-provider data.

## 4) Proposed bounded contexts (5–8)

This map matches product flows + operational concerns:

1. **Quotes**: send-money flow, provider quotes, method filtering, amount buckets.
2. **Providers**: provider directory, provider profiles, scoring, display rules.
3. **Pulse**: pulse dashboards, charts, indices, corridor selection state.
4. **Account**: auth, entitlements, plan gating, watchlist/alerts.
5. **Telemetry**: analytics events, click/session/search tracking.
6. **Content**: learn pages, methodology, provider reviews (SEO-heavy).

Optional (only if it meaningfully reduces complexity):
- **Marketing**: partnerships, landing pages, affiliate/ads wiring.

## 5) Target module layout (Nuxt-compatible)

Introduce a new structure under `frontend/` (incrementally, page-by-page):

```
frontend/
  domains/
    quotes/
      domain/               # types + invariants (no Nuxt, no UI)
      application/          # use-cases + composables (server-state)
      infrastructure/       # API adapters (calls platform/http)
      ui/                   # components used by pages
      index.ts              # public exports ONLY
      docs/README.md        # boundaries + usage

    providers/
    pulse/
    account/
    telemetry/
    content/

  shared/
    ui/                     # primitives + golden patterns
    lib/                    # formatting, mapping, helpers
    types/
    config/
    docs/

  platform/
    http/                   # fetch/proxy, retries, requestId, headers
    logging/
    feature-flags/
    telemetry/

  pages/                    # stays, but becomes thin route shells
  components/               # legacy; migrate to domains/shared
  composables/              # legacy; migrate to domains/platform/shared
```

### “Thin pages” rule (pragmatic)
`frontend/pages/**` should become *route shells only*:
- route param parsing
- call domain `application` composables
- render a domain `ui` Page component

This keeps Nuxt routing stable (business need: SEO + minimal routing regressions) while allowing real modularization.

## 6) Boundary rules (enforced direction)

Target dependency direction:

1. `pages/**` → `domains/**` → `shared/**` + `platform/**`
2. `shared/**` must not import from `domains/**`
3. `domains/*/domain/**` must not import Nuxt, UI, or infrastructure
4. UI must not call backend directly. UI uses `domains/*/application` composables.
5. Infrastructure adapters call `platform/http` only.

Nuxt caveat: auto-imported components/composables bypass static import graphs. For strict enforcement, we should move toward explicit imports for domain code (or at least avoid auto-import for domain code).

## 7) High-impact “Content” domain plan (reduces thousands of LOC)

Provider review pages are ideal for a templating approach:

- Create a single route `frontend/pages/learn/providers/[slug].vue`.
- Render via `domains/content/ui/ProviderReviewPage.vue`.
- Back it with `domains/content/domain/providerReviews.ts` (or JSON files) containing:
  - hero copy, provider slug/name, rating bars, pros/cons
  - FAQ entries
  - disclosures/affiliate flags

This keeps the HTML output deterministic for SEO while eliminating copy/paste UI logic.

## 8) Next slices (PR-sized)

Recommended sequencing (keeps business risk low):

1. Scaffold `frontend/domains`, `frontend/shared`, `frontend/platform` with docs + empty `index.ts` public surfaces.
2. Create golden layout wrapper (Nuxt/Vue equivalent of `CenteredPage`) in `frontend/ui` and reuse it in 2 routes. Back it with design tokens in `frontend/assets/css/tokens.css` (documented in `frontend/shared/docs/ui-system.md`).
3. Build a single `DataTable` component (dense vs roomy variants) in `frontend/ui` and reuse it in 2 routes.
4. Migrate one “product” page (`send-money` or `pulse`) to the new structure.
5. Migrate provider review pages to the Content template (biggest LOC win).
