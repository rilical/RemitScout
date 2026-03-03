# LLM-First SEO: Phase 2+3 Design

## Status

- **Phase 1**: Complete (branch `feature/llm-first-seo-phase1`)
  - `llms.txt` + `llms-full.txt` created
  - `robots.txt` updated with AI crawler rules
  - Structured data wired on corridor, comparison, and provider review pages
  - Tests: 114/114 passing

## Phase 2: In-Place Crawlability

Principle: No new standalone pages or components that duplicate data flow. Everything added inside existing pages, extending what's already there.

### 2.1 In-place SEO verdict block

Add a `<section class="corridor-verdict">` inside the existing corridor page template (`frontend/pages/send-money/[from]-to-[to].vue`), between the hero section (~line 190, after flags/amounts) and the comparison content (~line 575, "Compare N Providers" heading).

This is NOT a separate Vue component. It's inline template markup in the existing page.

**Content** (server-rendered, uses existing reactive data):

```
Based on live quotes from {providerCount} providers, the cheapest way to
send ${amount} from {from} to {to} is {bestProvider} at ${fee} total cost
({recipientGets} {toCurrency}). The fastest is {fastestProvider} with
delivery in {speed}.
```

- 40-70 word paragraph that directly answers "what's the best way to send money from X to Y?"
- Reuses existing computed properties: `content.table.rows[0]`, `providerCount`, `recipientRange`, `bestQuote`, `bestRateLabel`
- Only renders when `hasApiQuotes` is true (same guard as the comparison section)
- No new data fetching or composables

**File**: `frontend/pages/send-money/[from]-to-[to].vue` (template section only)

### 2.2 Extend existing FAQ block

Keep the current `<FaqSection>` at line 1620 and the existing FAQ generation (`corridorFaqsRaw` / `defaultCorridorFaqs` at line 3620). Expand `defaultCorridorFaqs` with 2-3 additional live-data-aware FAQ items:

1. "Which provider has the best exchange rate for {fromCurrency}/{toCurrency}?"
   - Answer uses `bestRateLabel` computed
2. "Can I send money from {from} to {to} for cash pickup?"
   - Answer lists providers offering cash method (derived from `content.table.rows` filtering on delivery method)
3. "How many providers support {from} to {to} transfers?"
   - Answer uses `providerCount`

These flow into the existing `jsonLdFaq()` call at line 3929 with zero schema changes.

**File**: `frontend/pages/send-money/[from]-to-[to].vue` (script section, `defaultCorridorFaqs` computed)

### 2.3 Visible freshness timestamp + dateModified

Add a visible "Rates last updated: {timestamp}" line near the Live Insights Grid (~line 1233), after the existing stat cards. Use `seoUpdatedLabel` computed or derive from `content.value.lastUpdated`.

Update existing structured data calls to include `dateModified`:
- `addRemittanceCorridorSchema()` already accepts `lastUpdated` param — pass it
- `addFinancialProductSchema()` — pass timestamp if available

**Files**: `frontend/pages/send-money/[from]-to-[to].vue` (template + script)

### 2.4 SR-only semantic comparison table

Add a `<table class="sr-only">` near the interactive comparison area (~line 670). Visually hidden but crawlable by AI bots that don't execute JavaScript.

```html
<table class="sr-only" aria-label="Top providers for {from} to {to} transfers">
  <caption>Top 5 money transfer providers: {from} to {to} (${amount})</caption>
  <thead>
    <tr>
      <th>Provider</th><th>Fee</th><th>Exchange Rate</th>
      <th>Recipient Gets</th><th>Delivery Speed</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="row in content.table.rows.slice(0, 5)">...</tr>
  </tbody>
</table>
```

Data from `content.table.rows.slice(0, 5)`. Keep the interactive widget unchanged.

**File**: `frontend/pages/send-money/[from]-to-[to].vue` (template section only)

---

## Phase 3: Incremental Best-Of Pages

Principle: Thin wrappers reusing corridor data, staged rollout, non-disruptive.

### 3.1 Best-of page as thin wrapper

`frontend/pages/best/[corridor].vue` — reuses the same API/data composables as the corridor page. Only changes narrative framing.

**Structure**:
1. H1: "Best Money Transfer Services: {from} to {to} ({year})"
2. 50-word editorial verdict (same data as verdict block in 2.1)
3. Comparison table (same data, editorial layout with semantic HTML)
4. Mini-review blurbs per top 5 providers (2-3 sentences from score data + live quote)
5. Link to live comparison tool: `/send-money/{from}-to-{to}`
6. Reuses corridor FAQ data
7. Freshness date: "Last reviewed: {date}"

**JSON-LD**: `ItemList` + `FinancialProduct` per provider + `FAQPage` + `BreadcrumbList`

**Slug mapping**: `/best/money-transfer-us-to-mexico` maps to corridor `{ from: 'US', to: 'MX' }`. Utility function in `frontend/utils/best-corridor-slugs.ts`.

**File**: `frontend/pages/best/[corridor].vue` (new)

### 3.2 Start with 10-12 corridors

Launch with highest-traffic corridors only:

```
US->MX, US->IN, US->PH, US->NG, US->PK
GB->IN, GB->NG, GB->PK
CA->IN, CA->PH
AE->IN, AU->IN
```

Expand in a second pass after templates are validated in staging.

### 3.3 Hub page + sitemap

- `frontend/pages/best/index.vue` — "Best Money Transfer Services" directory linking all generated routes
- Update `sitemap.xml.ts` with `/best/*` pages (priority 0.9, daily frequency)
- Add corridor slugs to `BEST_CORRIDOR_SLUGS` in `frontend/server/utils/seo-constants.ts`

**Files**: `frontend/pages/best/index.vue` (new), `frontend/server/routes/sitemap.xml.ts`, `frontend/server/utils/seo-constants.ts`

### 3.4 Provider comparison expansion

Add 6-8 new validated comparison slugs to the shared `PROVIDER_COMPARISONS` array in `frontend/server/utils/seo-constants.ts`:

```
remitly-vs-xoom, wise-vs-worldremit, western-union-vs-ria,
remitly-vs-worldremit, wise-vs-xe-money, western-union-vs-xoom
```

The comparison page template (`/compare/[a]-vs-[b].vue`) already handles any valid slug pair. Only need to add slugs to the constant and validate rendering.

**File**: `frontend/server/utils/seo-constants.ts`

### 3.5 Staging-safe rollout

1. Deploy 1 best-of corridor (`/best/money-transfer-us-to-mexico`) + 2 new comparison slugs to staging
2. Validate crawl/render quality: `curl -s staging/best/money-transfer-us-to-mexico | grep -c "application/ld+json"`
3. Check SR-only table renders in view-source
4. Scale to all 10-12 corridors + remaining comparisons after validation

---

## Files Summary

| File | Phase | Change |
|------|-------|--------|
| `frontend/pages/send-money/[from]-to-[to].vue` | 2 | Verdict block, extend FAQs, freshness timestamp, SR-only table |
| `frontend/pages/best/[corridor].vue` | 3 | New — thin wrapper best-of page |
| `frontend/pages/best/index.vue` | 3 | New — hub/directory |
| `frontend/utils/best-corridor-slugs.ts` | 3 | New — slug-to-corridor mapping |
| `frontend/server/utils/seo-constants.ts` | 3 | Add BEST_CORRIDOR_SLUGS + expand PROVIDER_COMPARISONS |
| `frontend/server/routes/sitemap.xml.ts` | 3 | Add /best/* pages |

## Verification

### Phase 2
- View source on corridor page: verify `<section class="corridor-verdict">` with extractable text
- SSR check: `curl -s localhost:3000/send-money/united-states-to-mexico | grep "cheapest way"`
- SR-only table: `curl ... | grep '<table class="sr-only"'`
- Freshness timestamp visible in browser
- FAQ count increased (check `jsonLdFaq` output)
- `cd frontend && pnpm test -- --run` passes
- `cd frontend && pnpm lint` passes

### Phase 3
- `/best/money-transfer-us-to-mexico` renders editorial layout
- View source: JSON-LD scripts with ItemList, FinancialProduct, FAQPage, BreadcrumbList
- `/best` hub page links to all corridor pages
- Sitemap includes `/best/*`: `curl -s localhost:3000/sitemap.xml | grep "/best/"`
- New comparison slugs render correctly
- All tests pass
