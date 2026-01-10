# GA4 Event Map (Aligned With Telemetry)

Purpose: keep GA4 events 1:1 with telemetry events so analytics don’t drift.

Event: `search`
- Source: `POST /telemetry/search`
- Parameters:
  - `corridor_id`
  - `amount`
  - `amount_bucket`
  - `payin`
  - `payout`
  - `page_path`
  - `source_currency` (derived from corridor_id)
  - `dest_currency` (derived from corridor_id)

Event: `select_content`
- Source: `POST /telemetry/click`
- Parameters:
  - `content_type = "provider"`
  - `item_id = provider_id`
  - `corridor_id`
  - `target_url`
  - `quoted_rate`
  - `quoted_fee`
  - `page_path`

Event: `generate_lead`
- Source: `POST /telemetry/conversion`
- Parameters:
  - `provider_id`
  - `corridor_id`
  - `value`
  - `currency`
  - `page_path`

Event: `sign_up`
- Source: `auth.signup` (frontend auth flow)
- Parameters:
  - `method` (email/sso)

Event: `purchase`
- Source: `billing.checkout.success` (Plus conversion)
- Parameters:
  - `value`
  - `currency`
  - `plan = "plus"`

Event: `view_send_money`
- Source: `/send-money` and `/send-money/[from]-to-[to]` page views
- Parameters:
  - `corridor_id` (if known)
  - `page_path`

Event: `begin_checkout`
- Source: `/plus/checkout` submit
- Parameters:
  - `value`
  - `currency`
  - `plan = "plus"`
  - `page_path`

Notes
- GA4 measurement ID is configured via `PUBLIC_GA4_MEASUREMENT_ID`.
- GA4 events must honor privacy settings (analytics opt-out).
