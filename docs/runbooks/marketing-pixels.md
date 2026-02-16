# Marketing pixels + attribution (launch baseline)

This repo supports client-side pixels plus server-side event persistence to Silver for debugging and attribution.
All third-party pixels are **disabled by default** until you provide real IDs and the user has granted consent.

## Runtime variables (frontend)

These are safe to be empty; when empty, scripts do not load.

- `PUBLIC_GA4_MEASUREMENT_ID`
- `PUBLIC_GOOGLE_ADS_CONVERSION_ID`
- `PUBLIC_META_PIXEL_ID`
- `PUBLIC_LINKEDIN_PARTNER_ID`
- `PUBLIC_TIKTOK_PIXEL_ID`
- `PUBLIC_CLARITY_PROJECT_ID`

## Runtime variables (backend)

These are safe to be empty; when empty, the server will still record events but will not forward to ad networks.

- `META_CAPI_ACCESS_TOKEN` (Meta CAPI)
- `META_CAPI_TEST_EVENT_CODE` (optional)
- `TIKTOK_EVENTS_ACCESS_TOKEN` (future: TikTok Events API)
- `TIKTOK_EVENTS_TEST_CODE` (optional)
- `LINKEDIN_CONVERSIONS_ACCESS_TOKEN` (future: LinkedIn CAPI)
- `LINKEDIN_CONVERSIONS_TEST_CODE` (optional)

## Consent gating

Scripts load only when:

- analytics tools: `analyticsConsent=true` + `analyticsEnabled=true`
- marketing tools: `marketingConsent=true`

Consent state is stored in `rs:privacy:settings` and synced via `/account/privacy` for logged-in users.

## Attribution persistence

We persist click IDs and UTM params best-effort:

- `utm_*`
- `gclid`, `fbclid`, `msclkid`
- `ttclid` (TikTok)
- `li_fat_id` (LinkedIn)

Tables:

- `silver.telemetry_session`
- `silver.telemetry_search_event`
- `silver.telemetry_outbound_click`
- `silver.telemetry_affiliate_conversion`
- `silver.telemetry_provider_visit`
- `silver.telemetry_marketing_event`

Migration:

- `backend/db/migrations/076_more_attribution_fields.sql`

## Debugging tips

1. Verify BFF proxy allows `/marketing/*`:
   - `frontend/server/api/[...path].ts` includes `/marketing`
2. Verify backend is recording marketing events:
   - `POST /api/v1/marketing/meta` (and `/tiktok`, `/linkedin`, `/google`)
3. If pixels “don’t fire”, check consent first, then check IDs are non-empty.

