# Composables Conventions

## Loading States (`pending` vs `loading`)

Remit-Scout uses two common loading patterns:

- `pending` from `useAsyncData()`: Prefer **skeleton placeholders** (content-shaped) because data is expected to arrive during SSR/hydration. Avoid full-page spinners unless the entire page is blocked.
- `loading` as a manual `ref<boolean>`: Prefer **`<LoadingState />`** for user-initiated actions (refresh buttons, explicit fetches). For automatic background loads, prefer skeleton placeholders.

Accessibility requirements:

- Every loading UI must expose `role="status"` and `aria-live="polite"` (or use `LoadingState`, which already does).
- For long-running actions, consider also setting `aria-busy="true"` on the container that is being updated (tables, result regions).

