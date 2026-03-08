# Billing Plan-State Contract

## Canonical matrix

| Stored tier | Stored status | Effective tier | Paid capabilities | Recovery UI |
| --- | --- | --- | --- | --- |
| `free` | `active` or default | `free` | Free only | None |
| `plus` or `enterprise` | `active` | Stored tier | Enabled | None |
| `plus` or `enterprise` | `trialing` | Stored tier | Enabled | None |
| `plus` or `enterprise` | `active` or `trialing` with `cancel_at_period_end=true` | Stored tier | Enabled until `current_period_end` | Show scheduled-cancel copy and billing portal CTA |
| `plus` or `enterprise` | `past_due` | `free` | Disabled immediately | Show recovery banner and billing portal CTA |
| `plus` or `enterprise` | `canceled`, `unpaid`, `incomplete_expired`, `expired`, or `inactive` | `free` | Disabled | Billing portal if Stripe customer exists, otherwise upgrade CTA |
| Any tier | Internal admin override | `enterprise` | Enabled | None |

## Contract

- `plan.plan_code` is the stored purchased tier and must not be rewritten to `free` when a paid subscription lapses.
- `plan.status` is the stored billing status.
- `plan_effective.plan_code` is the only capability-driving plan field.
- `plan_effective.is_active` is true only for active/trialing capability states and the internal admin override.
- `plan_effective.lifecycle_state` is the canonical lifecycle enum:
  - `active`
  - `trialing`
  - `scheduled_cancel`
  - `past_due`
  - `canceled`
  - `unpaid`
  - `incomplete_expired`
  - `expired`
  - `inactive`
- `plan_effective.recovery_available` and `plan_effective.recovery_action` drive recovery UI:
  - `none`
  - `billing_portal`
  - `upgrade`
- `billing.current_period_end` and `billing.cancel_at_period_end` are billing-facing fields only. Capability gating follows `plan_effective`.

## Capability rules

- Free capabilities: basic alerts, watchlist limit 3, history 30 days, no exports, no Pulse, no Enterprise controls.
- Plus capabilities:
  - Alerts: daily and smart alerts.
  - Exports: standard user exports only.
  - History: 90 days.
  - Watchlist: 16 items.
  - Pulse: lite only.
- Enterprise capabilities: Plus plus embeds, TEER / RCI / RVI exports, API keys/API access, index-threshold alerts, and Pulse full.
- Plus must never see Enterprise-only controls.

## Route, page, and control matrix

| Surface | Capability | Expected access | Actual access | Backend guard | Frontend gate | Error code(s) | Fix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/api/v1/me` | Hydration | Raw plan and effective plan never disagree semantically | Previously lacked lifecycle and recovery metadata | [`backend/plane-a/src/routes/me.ts`](../../backend/plane-a/src/routes/me.ts) via `resolveEffectiveEntitlements()` | [`frontend/composables/useEntitlements.ts`](../../frontend/composables/useEntitlements.ts) | N/A | `/me` now returns raw `plan`, canonical `plan_effective`, and billing recovery fields |
| `/api/v1/me/api-keys` | `api_access` | Only active Enterprise or admin override | Previously inactive Enterprise collapsed to `enterprise_required` | [`backend/plane-a/src/routes/me.ts`](../../backend/plane-a/src/routes/me.ts) | [`frontend/composables/useEnterpriseApiKeys.ts`](../../frontend/composables/useEnterpriseApiKeys.ts) | `plan_inactive`, `enterprise_required` | Inactive paid plans now fail with canonical plan-state details |
| `/api/v1/me/export-jobs*` | `bulk_export`, `indices_exports_enabled` | Only active Enterprise; indices exports require Enterprise indices entitlement | Previously inactive Enterprise collapsed to tier-only failures | [`backend/plane-a/src/routes/me.ts`](../../backend/plane-a/src/routes/me.ts) | [`frontend/composables/useEnterpriseExports.ts`](../../frontend/composables/useEnterpriseExports.ts) | `plan_inactive`, `enterprise_required`, `indices_export_enterprise_only` | Shared denial helper preserves legacy top-level codes and adds canonical detail fields |
| `/api/v1/billing/portal` | Recovery | Recoverable inactive paid users get actionable billing errors | Previously `customer_not_found` could be flattened into generic 500 handling | [`backend/plane-a/src/routes/billing/portal.ts`](../../backend/plane-a/src/routes/billing/portal.ts) | [`frontend/composables/useBilling.ts`](../../frontend/composables/useBilling.ts) | `customer_not_found` | Validation/App errors now pass through intact |
| `/api/v1/billing/history` | Recovery | Recoverable inactive paid users can fetch invoice history or get precise recovery errors | Previously `customer_not_found` could be flattened into generic 500 handling | [`backend/plane-a/src/routes/billing/history.ts`](../../backend/plane-a/src/routes/billing/history.ts) | [`frontend/domains/dashboard/ui/DashboardSignedIn.vue`](../../frontend/domains/dashboard/ui/DashboardSignedIn.vue) | `customer_not_found` | Validation/App errors now pass through intact |
| Checkout / verify-session / webhook | Purchase + lifecycle transitions | Checkout rejects unsupported plan codes and duplicate active/trialing Plus; webhook preserves stored tier while effective access falls back | Previously canceled webhook updates rewrote stored paid plan to `free` | [`backend/plane-a/src/routes/billing/checkout-session.ts`](../../backend/plane-a/src/routes/billing/checkout-session.ts), [`backend/plane-a/src/routes/billing/verify-session.ts`](../../backend/plane-a/src/routes/billing/verify-session.ts), [`backend/plane-a/src/routes/billing/webhook.ts`](../../backend/plane-a/src/routes/billing/webhook.ts) | [`frontend/domains/plus/ui/PlusPage.vue`](../../frontend/domains/plus/ui/PlusPage.vue) | `unsupported_plan_code`, `session_mismatch` | Stored tier is preserved, active/trialing conflicts are blocked, and recovery UI uses raw vs effective plan correctly |
| Alerts create/edit + `SaveAlertModal` | `daily_alerts_enabled`, `smart_alerts_enabled`, `index_threshold_alerts_enabled` | Free keeps basic weekly alerts; Plus gets daily/smart; Enterprise only gets index-threshold alerts | Previously lock copy was Plus-centric and Enterprise threshold options could leak via generic UI logic | [`backend/plane-a/src/routes/alerts/alerts-crud.ts`](../../backend/plane-a/src/routes/alerts/alerts-crud.ts) | [`frontend/components/shared/SaveAlertModal.vue`](../../frontend/components/shared/SaveAlertModal.vue) | `plan_inactive`, `plus_required`, `enterprise_required` | Control list is capability-driven and Enterprise-only threshold options stay hidden for Plus |
| Watchlist + history | Shared paid limits | Inactive paid users revert to free limits consistently | Previously route-local active/trialing checks duplicated resolver behavior | [`backend/plane-a/src/routes/watchlist.ts`](../../backend/plane-a/src/routes/watchlist.ts), [`backend/plane-a/src/routes/alerts/shared.ts`](../../backend/plane-a/src/routes/alerts/shared.ts) | [`frontend/composables/useEntitlements.ts`](../../frontend/composables/useEntitlements.ts) | N/A | Canonical effective plan helpers now drive limit selection |
| Dashboard account/billing | Recovery visibility | Stored paid tier remains visible even when paid capabilities are inactive | Previously inactive paid users collapsed to “Free” and lost recovery/manage-billing affordances | [`backend/plane-a/src/routes/me.ts`](../../backend/plane-a/src/routes/me.ts) | [`frontend/domains/dashboard/ui/DashboardSignedIn.vue`](../../frontend/domains/dashboard/ui/DashboardSignedIn.vue) | `customer_not_found`, `plan_inactive` | Billing card now separates stored tier, lifecycle status, and recovery action |
| Plus page | Upgrade vs recovery CTA | Active Plus shows current plan; recoverable inactive Plus shows manage/reactivate; non-recoverable expired Plus shows upgrade again | Previously CTA logic depended on loose `isPlus` inference | N/A | [`frontend/domains/plus/ui/PlusPage.vue`](../../frontend/domains/plus/ui/PlusPage.vue) | Billing route errors | CTA state now follows stored tier plus recovery action |
| Pulse share/embed/chart export controls | `pulse_access`, `pulse_embeds_enabled`, `indices_exports_enabled` | Plus gets Pulse lite only; Enterprise-only embeds and chart exports never surface for Plus | Previously some flows depended on ad hoc forbidden handling | Existing route capability checks plus canonical error details | [`frontend/components/pulse/PulseShareModal.vue`](../../frontend/components/pulse/PulseShareModal.vue), [`frontend/pages/pulse/charts/[chartId].vue`](../../frontend/pages/pulse/charts/[chartId].vue) | `plan_inactive`, `enterprise_required`, `forbidden` | Shared frontend mapper normalizes plan-state failures and keeps Enterprise controls hidden for Plus |

## Error contract

- Preserve existing top-level `error` values where callers already depend on them.
- Add canonical plan-state detail fields on capability failures:
  - `details.plan_failure`
  - `details.required_plan`
  - `details.capability`
  - `details.lifecycle_state`
  - `details.recovery_action`
  - `details.purchased_plan`
  - `details.effective_plan`
- Frontend error mapping must prefer `details.plan_failure` and only fall back to legacy `error`.

## Tests

- Backend:
  - [`backend/tests/effective-entitlements-lifecycle.test.ts`](../../backend/tests/effective-entitlements-lifecycle.test.ts)
  - [`backend/tests/api-me.test.ts`](../../backend/tests/api-me.test.ts)
  - [`backend/tests/require-entitlement-status.test.ts`](../../backend/tests/require-entitlement-status.test.ts)
  - [`backend/tests/me-plan-state-routes.test.ts`](../../backend/tests/me-plan-state-routes.test.ts)
  - [`backend/tests/billing-checkout.test.ts`](../../backend/tests/billing-checkout.test.ts)
  - [`backend/tests/billing-portal.test.ts`](../../backend/tests/billing-portal.test.ts)
  - [`backend/tests/billing-history.test.ts`](../../backend/tests/billing-history.test.ts)
  - [`backend/tests/billing-webhook.test.ts`](../../backend/tests/billing-webhook.test.ts)
- Frontend:
  - [`frontend/tests/unit/composables/useEntitlements.test.ts`](../../frontend/tests/unit/composables/useEntitlements.test.ts)
  - [`frontend/tests/unit/composables/usePlanStateError.test.ts`](../../frontend/tests/unit/composables/usePlanStateError.test.ts)
  - [`frontend/tests/unit/domains/dashboard/DashboardSignedIn.alerts.test.ts`](../../frontend/tests/unit/domains/dashboard/DashboardSignedIn.alerts.test.ts)
  - [`frontend/tests/unit/components/shared/SaveAlertModal.test.ts`](../../frontend/tests/unit/components/shared/SaveAlertModal.test.ts)
  - [`frontend/tests/unit/components/pulse/PulseShareModal.test.ts`](../../frontend/tests/unit/components/pulse/PulseShareModal.test.ts)
  - [`frontend/tests/unit/pages/plus-page.test.ts`](../../frontend/tests/unit/pages/plus-page.test.ts)
  - [`frontend/tests/unit/pages/pulse-chart-page.test.ts`](../../frontend/tests/unit/pages/pulse-chart-page.test.ts)

## Migration note for other threads

- Do not branch on raw `plan.plan_code` or raw Stripe `billing.status` to decide capabilities.
- Use `plan_effective.plan_code` or explicit entitlement flags for capability decisions.
- Use `storedPlanCode`, `planLifecycleState`, `recoveryAvailable`, and `recoveryAction` only for billing/recovery presentation.
- Use the shared frontend mapper in [`frontend/composables/usePlanStateError.ts`](../../frontend/composables/usePlanStateError.ts) for plan-state failures.
