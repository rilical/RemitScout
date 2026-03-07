# Frontend slop inventory (hotspots + duplication map)

Feedback source: chat transcript.
Goal: evidence-based map of frontend “slop” (hotspots, duplication, dead/unfinished areas, boundary violations) to unblock the downstream docs and the prioritized plan.

This is intentionally blunt and biased toward B2C polish: fewer one-off pages, fewer bespoke SVGs, fewer “mega files”, and more repeatable UI primitives.

## 0) Methodology (what this doc measured)

### File set
- Counted LOC for `frontend/**/*.{vue,ts,js}`.
- Excluded generated / cache / deps: `frontend/**/node_modules`, `frontend/.nuxt`, `frontend/.output`, and the local artifacts `frontend/--host`, `frontend/--port`.

### Heuristics for “complexity hotspots”
- **Size**: LOC is the most reliable proxy for refactor cost.
- **Reactive surface area**: rough complexity via counts of `computed(` and `watch(`.
  - Example: `frontend/pages/send-money/[from]-to-[to].vue` has `computed(` ~= `107` and `watch(` ~= `18`.

### Heuristics for “duplication”
- Repeated literal chunks (SVG paths, component callsites) via `rg` counts.
  - Example: checkmark icon path `d="M5 13l4 4L19 7"` appears ~`208` times.
  - Example: `<CompareWidget />` appears ~`45` times across pages.

## 1) Top hotspots (product/logic pages & shared components)

These are the files that will cost the most to change safely because they combine layout, copy, and business logic in one place.

> LOC snapshot derived from local `wc -l`; treat as directional.

| Rank | File | LOC | Why it’s slop (symptoms) | Pragmatic fix direction |
|---:|---|---:|---|---|
| 1 | `frontend/pages/dashboard.vue` | 6134 | “God page”: signed-out marketing + signed-in app + account management + ops + enterprise; inline SVG components; local formatting helpers; cache state; too many concerns to QA confidently. Also contains inline DOM injection in `img onerror` (see below). | Split by tab into `components/dashboard/*` and/or child routes; move formatting to shared formatters; enforce shared empty/loading/error states; remove DOM injection. |
| 2 | `frontend/pages/send-money/[from]-to-[to].vue` | 4231 | Corridor page is doing UI + quote-refresh orchestration + polling/timers + chart rendering + watchlist/alerts hooks. Reactive surface is huge (`computed`~107, `watch`~18). | Extract “quote refresh state machine” to a composable/service; extract chart into a single chart component; centralize corridor formatting + validation. |
| 3 | `frontend/pages/methodology.vue` | 1937 | Long-form content page with lots of bespoke inline SVG and layout; likely SEO content but still coded as a giant Vue file. | Move content to a content system (MD/JSON) + a single article template component. |
| 4 | `frontend/pages/pulse/index.vue` | 1801 | Plus gating UX + feature explanation + dashboard UI in one file; repeated icon/copy patterns with `dashboard.vue` and `plus.vue`. | Create a reusable “PlusGate/Upsell” component; standardize feature list patterns. |
| 5 | `frontend/pages/partnerships.vue` | 1791 | Large marketing/sales page; high chance of copy drift and inconsistent CTA patterns. | Move to content + a shared “marketing page” layout; centralize CTA components. |
| 6 | `frontend/components/home/HeroDualTab.vue` | 1322 | Heavy animated SVG + form logic + stepper UX; likely fragile; lots of embedded UI tokens and repeated input patterns. | Split: `HeroMap` (visual), `CompareForm` (logic), `HeroCopy` (content). |
| 7 | `frontend/pages/send-money/index.vue` | 1213 | Country/corridor selection + routing logic + marketing copy + layout. | Use shared form components and a single routing helper; keep page thin. |
| 8 | `frontend/components/shared/SaveAlertModal.vue` | 1196 | Modal does selection UX + eligibility logic + fetches + data formatting + watchlist coupling (“This also saves the item…”). Hard to reuse/maintain. | Split into `AlertRuleForm` + `CorridorPicker` + `AlertService` composable; use shared modal shell component. |
| 9 | `frontend/pages/plus.vue` | 1129 | Pricing page mixes copy, pricing math, toggles, auth state, entitlements, and checkout wiring; duplicates feature list patterns from `pulse.vue` and `dashboard.vue`. | Pull plan cards into `components/billing/*`; unify copy blocks; reuse the same plan-comparison component across surfaces. |
| 10 | `frontend/pages/about.vue` | 1124 | Large content page; repeats patterns from other content pages; inline `onerror` handling for images. | Move to content-driven layout; keep only data bindings in page. |
| 11 | `frontend/pages/how-we-make-money.vue` | 1117 | Another large content page; likely SEO content but implemented as a bespoke Vue file. | Content system + shared article shell. |
| 12 | `frontend/pages/enterprise/exports.vue` | 971 | B2B-ish surface embedded in consumer app; likely high wiring risk (exports, auth, entitlements). | Ensure strict entitlement gating; isolate to `enterprise` domain and shared API client. |
| 13 | `frontend/pages/contact.vue` | 755 | Form + copy + submission wiring; likely repeated validation/submit UX elsewhere. | Standardize form + submit states + validation rules. |
| 14 | `frontend/pages/faq.vue` | 702 | Uses `v-html` for answers via FAQ components (see security section below). | Ensure sanitization; prefer structured content rendering. |
| 15 | `frontend/components/corridor/CorridorStickyBar.vue` | 696 | Likely duplicated “sticky compare” patterns across corridor and home. | Consolidate sticky compare UX into one component. |
| 16 | `frontend/pages/pulse/charts/[chartId].vue` | 578 | Dynamic chart page; risk of inconsistent encodings/patterns (charts audit will go deeper). | Standardize chart scaffolding + empty/error/loading + legend rules. |
| 17 | `frontend/components/home/RateAlertForm.vue` | 558 | Alert creation UI likely overlaps with `SaveAlertModal.vue`. | Reuse a single alert form component between modal and standalone form. |
| 18 | `frontend/components/home/BankVsSpecialistDynamic.vue` | 538 | “Interactive marketing” component: both copy + data + UI. | Separate content from data fetching; adopt shared “data panel” primitives. |
| 19 | `frontend/composables/useAuth.ts` | 471 | Authentication is a cross-cutting dependency; changes here are high blast radius. | Ensure single source of truth and consistent error semantics; avoid UI-driven special cases. |
| 20 | `frontend/pages/admin/analytics.vue` | 473 | Admin surface in the main app; higher risk + often bypasses patterns. | Isolate admin domain + layout + entitlement checks; do not let admin patterns leak into consumer UI. |

## 2) Top hotspots (SEO/content duplication)

### Provider review pages are massively duplicated

- Folder: `frontend/pages/learn/providers/*.vue` (23 static provider pages)
- Examples by LOC:
  - `frontend/pages/learn/providers/placid.vue` (1590)
  - `frontend/pages/learn/providers/worldremit.vue` (1547)
  - `frontend/pages/learn/providers/remitly.vue` (1438)

**Why this is slop**
- High copy drift risk: “same structure, slightly different claims.”
- Repeated “provider review” hero, breadcrumb nav, badges, star SVG path, CTA blocks.

**Most important signal: this is already half-migrated**
- Dynamic provider route exists: `frontend/pages/learn/providers/[slug].vue`.
- Yet the 23 static pages remain, implying either:
  - SEO experiments in parallel, or
  - migration started but never finished.

**Pragmatic direction**
- Choose one:
  1) fully dynamic route + content registry (preferred), or
  2) keep static pages, but generate them from a single template (build-time) so they don’t diverge.

## 3) Duplication map (3+ repeats, concrete examples)

### 3.1 Inline SVG icon duplication (no icon discipline)

- Checkmark icon path repeats ~`208` times across the app: `d="M5 13l4 4L19 7"`.
- Star/badge icon path repeats ~`36` times: `M9.049 2.927...`.

Impact: inconsistent sizing/stroke, large diffs for tiny UI tweaks, and higher accessibility risk.

Recommendation: standardize on one icon system (Heroicons is already present per baseline) and ban inline SVG paths in pages (allow in one `Icon` wrapper only).

### 3.2 Layout-level duplication (CompareWidget)

- `<CompareWidget />` appears ~`45` times in `frontend/pages/**`.

Impact: every “content page” starts with the same widget; layout changes require editing dozens of pages.

Recommendation: promote to a shared layout (e.g., `layouts/learn.vue` / `layouts/marketing.vue`) so pages only provide content.

### 3.3 Duplicate formatting utilities (single responsibility violation)

- Two overlapping formatting composables exist:
  - `frontend/composables/useLocaleFormat.ts`
  - `frontend/composables/useLocalizedFormat.ts`
- `dashboard.vue` reimplements formatting helpers instead of using shared utilities.

Impact: inconsistent numeric rendering (“—” vs “N/A”), rounding drift, and localization inconsistencies.

Recommendation: consolidate to one formatter composable and enforce usage (lint rule or code review gate).

### 3.4 Duplicate “share/save modal” patterns

- Multiple modal-ish components exist with overlapping responsibilities:
  - `frontend/components/shared/ShareModal.vue`
  - `frontend/components/pulse/PulseShareModal.vue`
  - `frontend/components/shared/SaveAlertModal.vue`

Impact: repeated modal shells, focus management, ESC handling, and inconsistent UX.

Recommendation: create one `ModalShell` + one set of shared states, then compose content inside.

### 3.5 Provider page duplication vs dynamic route

- Dynamic provider page: `frontend/pages/learn/providers/[slug].vue`
- Duplicated static provider pages: `frontend/pages/learn/providers/*.vue`

Recommendation: pick one approach; do not maintain both.

## 4) Unfinished / dead / low-signal areas (cleanup candidates)

These aren’t necessarily “bugs”, but they increase cognitive load and ship risk.

### 4.1 “Old page” left in place

- `frontend/pages/about-old.vue`

Recommendation: remove or clearly gate/redirect; otherwise it will rot.

### 4.2 Local build artifacts that create confusion

These exist locally and can mislead devs about “what’s the real app root”:
- `frontend/--host/` and `frontend/--port/` (contain only ignored `.nuxt` + `node_modules`)
- `frontend/frontend/` (appears to be an empty nested app root)

Recommendation: delete locally; add explicit ignores if they can reappear.

## 5) Boundary violations (UI vs business vs infra)

### 5.1 Pages/components mixing business logic, data fetching, and UI

- `frontend/pages/dashboard.vue`: entitlements + sessions + exports + watchlist/alerts + ops + account management inside one page.
- `frontend/pages/send-money/[from]-to-[to].vue`: polling/timers + quote refresh orchestration + chart rendering.
- `frontend/components/shared/SaveAlertModal.vue`: modal UX + corridor eligibility + API wiring + watchlist coupling.

Business impact: extremely hard to test and iterate without regressions; slows “Expedia-level polish” work because every design tweak requires touching logic-heavy files.

Recommendation: enforce “thin page” rule:
- Pages orchestrate; composables/services own business logic; components own rendering.

### 5.2 Unsafe HTML / DOM injection surfaces

- `frontend/pages/dashboard.vue`: `img onerror` injects a giant HTML string via `this.parentElement.innerHTML = ...`.
  - This bypasses Vue rendering and is a potential injection vector.
- `v-html` is used ~`15` times, including:
  - `frontend/pages/learn/[...slug].vue` (`<div v-html="article?.content" />`)
  - `frontend/components/shared/FaqAccordion.vue`
  - `frontend/components/faq/FaqCategory.vue`

Business impact: if any of these strings become remotely user-controlled (or CMS-controlled), this becomes an XSS risk.

Recommendation:
- Treat `v-html` as “security exception” requiring sanitization at the boundary.
- Remove DOM injection from templates entirely.

## 6) “If we do nothing else” shortlist (highest ROI)

1) **Kill the mega-pages**: split `dashboard.vue` and the send-money corridor page into tab/section components.
2) **Pick a provider content strategy**: dynamic `[slug]` + content registry, or generated static pages — but not both.
3) **Standardize icons**: remove inline SVG paths from pages; use one icon wrapper.
4) **Standardize shared states**: empty/loading/error banners and “Plus gate” upsell panels.
5) **Clamp unsafe HTML**: sanitize or remove `v-html` and remove dashboard DOM injection.
