# UI System (Tokens + Layout Primitives)

This is the frontend UI foundation layer: a small set of semantic tokens and a few reusable layout primitives.

Goals:
- Keep styling consistent and predictable across routes.
- Avoid page-by-page Tailwind “inventing spacing”.
- Enable incremental migrations without breaking existing pages.

## Design tokens

Tokens live in `frontend/assets/css/tokens.css` as CSS variables.

Currently provided tokens:
- Layout: `--rs-page-max-width`, `--rs-space-page-x`, `--rs-space-page-y`, `--rs-space-stack`
- Color: `--rs-color-bg`, `--rs-color-surface`, `--rs-color-fg`, `--rs-color-muted`, `--rs-color-border`, `--rs-color-brand`
- Radii: `--rs-radius-md`, `--rs-radius-lg`

### Tailwind wiring

Tailwind exposes token-backed utilities (see `frontend/tailwind.config.js`):
- `max-w-page`
- `px-page-x`, `py-page-y`
- `gap-y-stack`
- `text-rs-fg`, `bg-rs-bg`, `bg-rs-surface`, `text-rs-muted`, `border-rs-border`
- `rounded-rs-md`, `rounded-rs-lg`

## `CenteredPage`

`CenteredPage` is the golden layout wrapper for page shells.

Path: `frontend/shared/ui/CenteredPage.vue`

Contract:
- Centers content with a consistent max-width and gutters.
- Provides consistent vertical rhythm via a default stack gap.
- Slots:
  - `header`
  - default (page content)
  - `footer`

Usage:

```vue
<CenteredPage>
  <template #header>
    <h1 class="text-scale-6 font-semibold">Page title</h1>
  </template>

  <div class="rounded-rs-lg bg-rs-surface border border-rs-border p-6">
    ...
  </div>
</CenteredPage>
```

