# Frontend UI System Rules (Tokens + Icons + Component Conventions)

Feedback source: chat transcript (task `task-1770395461-dd1b`).

Goal: define a small, enforceable UI rule set that reduces inconsistency fast (Expedia-level “boring, trustworthy” polish) without a rewrite.

Non-goals:
- No wholesale restyling or page rewrites in this slice.
- No new UI framework (we stay on Tailwind + Vue components).
- No breaking changes to backend contracts or page routing.

## 0) Current reality (repo facts)

- **Styling system**: Tailwind CSS.
  - Theme tokens live in `frontend/tailwind.config.js` (notably: `colors.brand`, `colors.neutral`, `fontSize.scale-*`, `minHeight.btn`, `borderRadius.btn`).
  - Global CSS entry is `frontend/assets/css/tailwind.css` (adds `.btn-primary`, `.btn-secondary`, `.container`, animation utilities, and other global classes).

- **Icon system**: Heroicons.
  - Dependency: `@heroicons/vue` (`frontend/package.json`).
  - Current usage is primarily direct imports from `@heroicons/vue/24/outline` (e.g., `frontend/pages/faq.vue`, `frontend/components/home/PlusPulseStrip.vue`).
  - There is still significant **inline SVG** usage in components (example: `frontend/components/shared/UniversalDropdown.vue`).

- **Observed inconsistency drivers** (examples):
  - Token drift: `frontend/components/shared/Badge.vue` uses `gray|green|yellow|red` instead of repo tokens like `neutral|success|warning|danger`.
  - Arbitrary values: `max-w-[1200px]` and `max-w-[960px]` show up in UI (e.g., `frontend/components/home/TopProvidersGrid.vue`, `frontend/components/home/ExchangeRateTable.vue`) even though `maxWidth.1200` and `maxWidth.960` exist in `frontend/tailwind.config.js`.
  - Duplicate button styles: `btn-primary/btn-secondary` are defined globally in `frontend/assets/css/tailwind.css`, but local copies exist too (e.g., `frontend/components/home/IntroSeoText.vue`, `frontend/components/home/FeaturedProviders.vue`).

Business impact: inconsistent spacing, colors, and icons reads as “unfinished” and reduces trust/conversion.

## 1) Principles (the rules behind the rules)

1. **Consistency beats cleverness**: we prefer a smaller palette and fewer variants.
2. **Tokens or it doesn’t exist**: avoid raw hex, `z-[9999]`, or one-off spacing unless it’s truly unique.
3. **Composition over copy/paste**: repeatable patterns become components, not duplicated Tailwind strings.
4. **Accessibility is a feature**: focus states, hit targets, and semantics are part of “polish”.

## 2) Design tokens (CSS variables) + Tailwind mapping

We already have a good start in Tailwind theme tokens. The fastest path to consistency is:

- **Source of truth**: CSS variables in a single file.
- **Consumption**: Tailwind theme references those vars (or we keep Tailwind values but mirror them into vars for future theming).

### 2.1 Token file (proposed)

Create (Phase 1) a single tokens file:

- `frontend/assets/css/tokens.css`

Recommended token namespaces (keep them boring):

- Colors: `--color-brand-*`, `--color-neutral-*`, `--color-success-*`, `--color-warning-*`, `--color-danger-*`, `--color-surface-*`
- Typography: `--font-sans`, `--text-*` (optional; Tailwind can remain primary)
- Radii: `--radius-*`
- Shadows: `--shadow-*`
- Z-index: `--z-*` (or Tailwind `z-*` scale)
- Spacing (optional): `--space-*` only if we truly need non-Tailwind spacing

### 2.2 Tailwind token usage rules (enforced immediately)

Even before adding `tokens.css`, enforce these conventions in PR review:

- **Colors**:
  - Use `brand|primary|neutral|success|warning|danger|accent|surface` from `frontend/tailwind.config.js`.
  - Avoid `slate|gray|blue|red|green|yellow` unless it is chart-specific.
  - Avoid raw hex (`bg-[#...]`, `border-[#...]`) for product UI.

- **Radii and hit targets**:
  - Buttons/inputs should use `min-h-btn` and `rounded-btn` (both exist in `frontend/tailwind.config.js`).
  - Minimum clickable target: **44px** height (already captured by `minHeight.btn`).

- **Arbitrary values** (`[...]`) are last resort:
  - If `max-w-[1200px]` is needed, prefer `max-w-1200` (already defined).
  - If `max-w-[960px]` is needed, prefer `max-w-960` (already defined).
  - If you find yourself typing `text-[10px]` repeatedly, that’s a token candidate (or a component/pattern).

## 3) Typography rules (make the UI feel “designed”)

Baseline:
- `fontFamily.sans` is `Inter` in `frontend/tailwind.config.js`.

Rules:
- **Use the scale**: prefer `text-scale-1..text-scale-8` (defined in `frontend/tailwind.config.js`) rather than ad-hoc `text-[11px]`.
- **Semantic usage** (recommended mapping):
  - Body: `text-scale-2` (16px)
  - Secondary / helper: `text-scale-1` (14px)
  - Section heading: `text-scale-4` (20px) + `font-semibold`
  - Page heading: `text-scale-6` (28px) + `font-bold`
  - Micro-labels: avoid < 12px unless it’s a badge/legend; if required, centralize it.

Copy-related note: typography only works if headings/labels follow a consistent voice; see `docs/refactor/frontend/04-ux-copy-audit.md`.

## 4) Spacing + layout rules (density without chaos)

We should treat spacing as part of the “brand”.

Rules:
- Prefer Tailwind’s spacing steps; avoid bespoke spacing unless justified.
- Use consistent layout rails:
  - Use `.container` (defined in `frontend/assets/css/tailwind.css`) or standardize on `max-w-1200` + `px-4 sm:px-6 lg:px-8`.
  - Avoid mixed rails on the same page (e.g., `max-w-[1200px]` in one section and `.container` in another).

Recommendation (Phase 2): introduce a single wrapper component (e.g., `frontend/shared/ui/PageFrame.vue`) to normalize:
- max width
- horizontal padding
- top spacing
- default page title block

## 5) Color + elevation rules (stop mixing palettes)

Rules:
- Prefer `neutral-*` for text and borders (repo defines `neutral.50..900`).
- `brand-*` is for primary CTAs and highlights (avoid “random blue”).
- Use semantic colors for meaning:
  - Success: `success-*`
  - Warning: `warning-*`
  - Danger: `danger-*`

Elevation:
- Limit shadows to a small set (recommend: `shadow-sm`, `shadow-md`, `shadow-lg`).
- Avoid bespoke “glass” effects except for intentional hero areas (we already have `.glass-effect` in `frontend/assets/css/tailwind.css`).

## 6) Icon discipline (single source of truth)

Current baseline: Heroicons outline is already the dominant icon library.

Rules:
- **Approved library**: `@heroicons/vue/24/outline` only.
- **No inline SVG for UI icons** (dropdown chevrons, info icons, etc). Inline SVG is allowed for:
  - provider logos
  - illustrations
  - marketing artwork

Sizing rules (use consistent sizes everywhere):
- Inline with text: `h-4 w-4`
- Default UI icon: `h-5 w-5`
- Large/hero icon: `h-6 w-6` or `h-8 w-8` (rare)

Accessibility rules:
- Decorative icons: `aria-hidden="true"`.
- Meaningful icons: include an accessible label (`aria-label`) or visible text.

Recommended addition (Phase 1): a tiny wrapper component:
- `frontend/shared/ui/Icon.vue`

Minimal API:
- Props: `name`, `size`, `class`, `title?`, `decorative?`
- Internals: a centralized icon map so pages/components stop importing icons ad-hoc.

This lowers duplication and makes it possible to change icon sizing/styling globally.

## 7) Component conventions (make reuse the default)

### 7.1 Component categories

Until the DDD folder structure lands (see `docs/refactor/frontend/03-ddd-domain-map.md`), use these conventions:

- **Primitives / system UI** (should be small and stable):
  - Target folder: `frontend/shared/ui/` (Phase 1 creation).
  - Examples: `Button`, `Card`, `Badge`, `Icon`, `Modal`, `Tabs`, `PageFrame`.

- **Shared composites** (product-ish, but reused broadly):
  - Current home: `frontend/components/shared/` (existing).
  - Examples: `CompareWidget`, `ProviderCard`, `UniversalDropdown`.

- **Domain UI** (feature-specific):
  - Current home: `frontend/components/<area>/`.
  - Future home: `frontend/domains/<domain>/ui/`.

### 7.2 Props + variants (reduce CSS churn)

Rules:
- Prefer `variant`/`size` props over callers passing large `class` strings.
- Variants must be limited and semantic (e.g., `primary|secondary|danger`, not `blue|purple|gradient`).
- Use `withDefaults(defineProps<...>(), ...)` consistently.

Anti-pattern:
- Copy/pasting 30+ Tailwind classes in multiple places (it becomes unreviewable).

### 7.3 Loading / error / empty states (golden pattern)

We already have some state components (`frontend/components/shared/SkeletonRow.vue`, `frontend/components/shared/SuccessToast.vue`), but usage is not consistent.

Rules:
- Every data-backed section must have explicit:
  - Loading
  - Empty
  - Error

Recommended addition (Phase 1): `frontend/shared/ui/states/` components:
- `LoadingState.vue`
- `EmptyState.vue`
- `ErrorState.vue`

This is one of the highest ROI “polish multipliers” because it standardizes perceived quality without touching business logic.

## 8) Motion rules (feel fast, not flashy)

We already respect reduced motion via `frontend/assets/css/reduced-motion.css`.

Rules:
- No infinite animations on core workflows (send-money, dashboard) unless they communicate loading.
- Prefer subtle transitions (`transition-colors`, `transition-shadow`) over scale/translate everywhere.
- If using animation helper classes from `frontend/assets/css/tailwind.css`, keep them limited to marketing/hero sections.

## 9) Tooling recommendations (small additions that pay back)

Not in this doc-only slice, but good fits for controlling drift:

- **Tailwind linting**: add `eslint-plugin-tailwindcss` to catch arbitrary values, invalid class names, and enforce ordering (we already have `prettier-plugin-tailwindcss`).
- **Accessible headless primitives**: consider `@headlessui/vue` (menus, dialogs) to reduce bespoke accessibility work.
- **Popover positioning**: consider `@floating-ui/dom` to replace manual `getBoundingClientRect` + `z-[9999]` patterns (example smell: `frontend/components/shared/UniversalDropdown.vue`).
- **Rich text consistency**: consider `@tailwindcss/typography` for long-form content surfaces.

## 10) Adoption plan (phased, low risk)

### Phase 0 (now): stop the bleeding

- Treat this document as “UI code review law”.
- No new raw hex colors or `z-[9999]`.
- Prefer repo palette tokens (`brand|neutral|success|warning|danger`).
- Prefer configured sizes (`max-w-960`, `max-w-1200`) over bracket values.

### Phase 1 (1–2 PRs): establish the golden primitives

- Add `frontend/assets/css/tokens.css` and wire it in `frontend/nuxt.config.ts`.
- Add `frontend/shared/ui/Icon.vue` and migrate 1–2 high-visibility areas.
- Add `frontend/shared/ui/Button.vue` (wrapping the intent of `.btn-primary`/`.btn-secondary`).
- Add `frontend/shared/ui/states/*` and apply to one dashboard section.

### Phase 2 (target: Dashboard → Plus → Pulse)

- Replace duplicated button CSS with shared primitives.
- Normalize layout rails with `PageFrame` (or equivalent).
- Reduce arbitrary Tailwind values by using (or adding) theme tokens.

### Phase 3 (DDD migration support)

- Move “UI system primitives” under `frontend/shared/ui/` permanently.
- Migrate feature UI to `frontend/domains/<domain>/ui/`.
- Add lint rules to enforce boundaries and Tailwind conventions.

