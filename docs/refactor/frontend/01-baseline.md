# Frontend Baseline (Stack + Wiring)

Feedback source: chat transcript (task `task-1770395433-0030`).

Goal: establish a repo-specific baseline of the frontend stack (framework/build tooling, routing/state approach, UI/icon/chart libraries) so later “slop” audits are anchored in facts.

## Where the frontend lives

- Frontend package root: `frontend/`
- Workspace wiring: `pnpm-workspace.yaml` includes `frontend`.

## Runtime + build tooling

- **Node / pnpm**:
  - Root pins Node 20.18.x via `package.json` (`engines.node`) + Volta (`volta.node`) and `.nvmrc`.
  - Frontend pins Node via `frontend/.nvmrc` and also enforces `engines.node` in `frontend/package.json`.
  - Package manager: `pnpm@10.19.0` (`frontend/package.json`, root `package.json`).

- **Framework build**:
  - `frontend/package.json` scripts use Nuxt CLI: `nuxt dev`, `nuxt build`, `nuxt preview`, `nuxt generate`.
  - Vite is the underlying dev/build tool (Nuxt 3 + Vite); explicit Vite config exists in `frontend/nuxt.config.ts` (`vite.server.hmr`, file watching rules).

- **Lint + formatting**:
  - ESLint Flat Config for Nuxt: `frontend/eslint.config.js`.
  - Prettier: `frontend/.prettierrc` + `frontend/package.json` (`format` script).

- **Testing**:
  - Unit tests: Vitest + jsdom via `frontend/vitest.config.ts` and `frontend/package.json` scripts.
  - E2E tests: Playwright via `frontend/playwright.config.ts` and `frontend/package.json` scripts.

## Framework: Nuxt 3 (Vue 3)

- Nuxt 3: `frontend/package.json` depends on `nuxt` (`^3.20.2`).
- Vue 3: `frontend/package.json` depends on `vue` (`^3.5.x`).
- App entry points:
  - Root app shell: `frontend/app.vue`.
  - Layouts: `frontend/layouts/default.vue`, `frontend/layouts/blank.vue`.
  - Global error page: `frontend/error.vue`.

### Rendering strategy (SSR/SSG/ISR)

- Nitro preset switches to static generation when Nuxt detects an AWS-like environment:
  - `frontend/nuxt.config.ts` sets `nitro.preset = 'static'` when `isAwsEnvironment`.
- Incremental Static Regeneration (ISR) is enabled via route rules in staging/prod:
  - `frontend/nuxt.config.ts` defines `routeRules` with per-route `isr` windows (e.g., `/pulse`, `/send-money/**`).

## Routing approach

- **File-based routing** (Nuxt pages router): `frontend/pages/**`.
  - Examples of key product surfaces:
    - Dashboard: `frontend/pages/dashboard.vue`
    - Plus: `frontend/pages/plus.vue` + checkout flow `frontend/pages/plus/*.vue`
    - Pulse: `frontend/pages/pulse.vue` + embeds `frontend/pages/embed/pulse/[corridor]/chart.vue`
    - Send money: `frontend/pages/send-money/index.vue` and dynamic corridor page `frontend/pages/send-money/[from]-to-[to].vue`

- **Route middleware**:
  - Auth gate middleware: `frontend/middleware/auth.ts` (redirects to `/sign-in` with `redirect` query param).

## State management + data fetching

- **State**: Pinia
  - Pinia module: `frontend/package.json` depends on `pinia` and `@pinia/nuxt`.
  - Store location: `frontend/stores/` (e.g., `frontend/stores/pulse.ts`).

- **Data fetching / API client**:
  - Central client wrapper: `frontend/composables/useApi.ts`.
  - Uses Nuxt runtime config to choose base URL and adds `x-request-id` / CloudFront request ID forwarding.

## Backend integration model (BFF + proxy)

This frontend acts as a small BFF (backend-for-frontend) in front of Plane A.

- **Server-side proxy helper**:
  - `frontend/server/utils/backendProxy.ts` resolves `API_BASE` / `PLANE_A_API_ENDPOINT` / `PUBLIC_API_BASE` and proxies to `.../api/v1/*`.
  - Has retry/backoff and a “non-blocking” mode for telemetry-style endpoints.

- **Catch-all API proxy route**:
  - `frontend/server/api/[...path].ts` proxies any unknown `/api/*` path to the backend.

- **Explicit BFF endpoints**:
  - `frontend/server/api/*.ts` includes handlers like `providers.get.ts`, `pulse/[...path].ts`, `indices/[...path].ts`, Stripe and newsletter routes, etc.

## UI system baseline

- **Utility-first styling**: Tailwind CSS
  - Tailwind module: `frontend/package.json` uses `@nuxtjs/tailwindcss`.
  - Tailwind theme tokens (colors/spacing/typography scales): `frontend/tailwind.config.js`.
  - Global CSS entry: `frontend/nuxt.config.ts` includes `./assets/css/tailwind.css` and `./assets/css/reduced-motion.css`.

- **Component approach**:
  - Nuxt auto-imported component directories are configured in `frontend/nuxt.config.ts` (`components.dirs` includes `~/components/*` including `shared`, `home`, `nav`, `pulse`).
  - No third-party “component framework” (e.g., Vuetify/PrimeVue/Chakra) is declared in `frontend/package.json`; UI appears to be custom Vue components + Tailwind.

## Icons + brand assets

- **Icon library**: Heroicons
  - Dependency: `@heroicons/vue` in `frontend/package.json`.
  - Example imports: `frontend/pages/faq.vue`, `frontend/components/home/PlusPulseStrip.vue`.

- **Logo / provider assets**:
  - Raw assets live under `frontend/png/SVG/**` and are copied into `frontend/public/png/SVG/**` during build via a Nuxt hook in `frontend/nuxt.config.ts`.
  - Provider logos are also mapped into `frontend/public/logos/*` via a slug map in `frontend/nuxt.config.ts`.

## Charts / visualization

- **Charting library**: Apache ECharts
  - Dependencies: `echarts` + `vue-echarts` in `frontend/package.json`.
  - Example usage:
    - `frontend/components/pulse/PulseHeroChart.vue`
    - `frontend/components/pulse/PulseSmartGauge.vue`
    - `frontend/pages/embed/pulse/[corridor]/chart.vue`

## Auth / identity

- **Client auth**: Supabase
  - Dependency: `@supabase/supabase-js` (`frontend/package.json`).
  - Nuxt plugin wiring: `frontend/plugins/supabase.client.ts`.
  - Auth composable: `frontend/composables/useAuth.ts`.
  - Runtime config expects `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` (see `frontend/nuxt.config.ts`).

## Localization (i18n)

- i18n module is installed but currently disabled in Nuxt config:
  - Dependency: `@nuxtjs/i18n` in `frontend/package.json`.
  - `i18n` config block is commented out in `frontend/nuxt.config.ts`.
  - Supporting config file exists: `frontend/i18n.config.ts`.

## SEO + crawling controls

- `robots.txt` is served dynamically (and blocked for non-prod): `frontend/server/routes/robots.txt.ts`.
- `sitemap.xml` is served dynamically: `frontend/server/routes/sitemap.xml.ts`.

## Notable baseline smells (non-blocking, but worth tracking)

- Suspicious directories: `frontend/--host/` and `frontend/--port/` exist (likely accidental local-dev artifacts; verify and remove when safe).
- Nuxt env detection uses `NODE_ENV === 'staging'` in `frontend/nuxt.config.ts`; Node’s conventional values are usually `development|production` and staging is often signaled via a separate `ENVIRONMENT` variable. This is easy to misconfigure and can change ISR/ads/analytics behavior.

