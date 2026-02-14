# UI System (Golden Patterns)

This is the Phase 2 UI system for Remit-Scout. The goal is a consistent, production-grade UI:

- One layout wrapper: `CenteredPage`
- One icon system: `Icon` (no direct Heroicons imports in Phase 2 pages/domains)
- One table system: `DataTable` (terminal + consumer variants)
- One set of states: `EmptyState`, `LoadingState`, `ErrorState`
- One formatting surface: `shared/lib/format/*` (no inline `Intl.NumberFormat` in migrated UI)

## CenteredPage

Use for every product page container.

```vue
<CenteredPage
  title="Your transfer dashboard"
  subtitle="Track rates, set alerts, and compare providers."
>
  <template #actions>
    <button class="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white">
      New alert
    </button>
  </template>

  <section class="space-y-4">
    ...
  </section>
</CenteredPage>
```

## Icon

Use `Icon` for any iconography in Phase 2 pages/domains.

```vue
<Icon name="bolt" :size="20" />
<Icon name="lock" :size="16" class="text-neutral-500" />
```

Rules:
- Do not import `@heroicons/vue/**` in Phase 2 pages/domains. Use the wrapper.
- Sizes are fixed: `16`, `20`, `24`.

## States

Standard primitives:
- `EmptyState` (neutral “nothing here yet”)
- `LoadingState`
- `ErrorState`

```vue
<EmptyState title="No watchlist yet" message="Save a corridor to track it here." />
<LoadingState message="Loading dashboard…" />
<ErrorState title="Could not load" message="Please refresh and try again." />
```

Use `variant="terminal"` when rendering inside dark/terminal surfaces.

## DataTable

Two variants:
- `terminal`: dense, minimal chrome, dark
- `consumer`: airy, white cards

```vue
<DataTable
  variant="consumer"
  :columns="[
    { key: 'provider', label: 'Provider' },
    { key: 'fee', label: 'Fee', align: 'right' },
  ]"
  :rows="rows"
  :row-key="(row, i) => String((row as any).id ?? i)"
  :empty="{ title: 'No results', message: 'Try a different filter.' }"
/>
```

Sorting and pagination are controlled:
- `:sort` + `:on-sort-change`
- `:pagination` + `:on-page-change`

## Charts

Use `ChartCard` as the wrapper for chart + optional table surfaces. It enforces:
- consistent header/title/subtitle layout
- consistent Empty/Loading/Error states
- honest freshness label via `formatUpdatedLabel(updatedAt)` (no `new Date()` fallbacks)

```vue
<ChartCard
  variant="terminal"
  title="FX markup"
  subtitle="Best provider vs bank benchmark"
  range-label="Last 30 days"
  :updated-at="updatedAt"
  :loading="loading"
  :error="error"
  :data-available="series.length > 0"
>
  <template #chart>
    <MyChart :series="series" />
  </template>
  <template #table>
    <DataTable ... />
  </template>
</ChartCard>
```

## Formatting

Use `shared/lib/format/*` helpers:
- `formatMoney`
- `formatNumber`, `formatCompactNumber`, `formatPercent`
- `formatDate`, `formatDateTime`, `formatShortDateTime`, `formatRelativeTime`
- `formatUpdatedLabel`

Rule: for migrated product UI, do not format numbers with inline `toLocaleString()`/`Intl.NumberFormat`.
