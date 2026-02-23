# Production Launch Ultimate Runbook (Current State)

Last updated: 2026-02-22  
Owner: Remit-Scout platform

## 1) What is already done

### Infrastructure and cost posture
- `staging` and `prod` stacks exist and are deployed.
- DB + Redis were downscaled to reduce baseline cost:
  - `staging` Aurora: `db.t4g.medium`
  - `prod` Aurora: `db.t4g.medium` (Multi-AZ writer/reader)
  - `staging` Redis: `cache.t4g.micro`
  - `prod` Redis: `cache.t4g.small` (2 nodes)
  - NAT gateways: `1` per environment

### GitHub environment wiring
- `staging` and `prod` have core deploy vars and secrets populated (AWS role, buckets, Supabase, Stripe, SES/SNS ARNs, Ezoic/GA/GTM public vars).
- `SENTRY_SECRET_ARN` and `SENTRY_SECRET_JSON_KEY` are set in both `staging` and `prod` GitHub environment vars.

### AWS Secrets created for Sentry backend DSN
- Staging: `arn:aws:secretsmanager:us-east-1:010630709504:secret:remit-scout/staging/sentry-6p5mPh`
- Prod: `arn:aws:secretsmanager:us-east-1:938998270127:secret:remit-scout/prod/sentry-IFPIVp`
- Secret payload key: `SENTRY_DSN`

### Code/workflow changes applied
- Deploy workflow now exports Sentry vars/secrets into staging/prod jobs:
  - `SENTRY_SECRET_ARN`
  - `SENTRY_SECRET_JSON_KEY`
  - `SENTRY_AUTH_TOKEN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `NUXT_PUBLIC_SENTRY_DSN`
- Deploy workflow now fails fast if `SENTRY_SECRET_ARN`/`SENTRY_SECRET_JSON_KEY` are missing for staging/prod.
- Frontend Ezoic enablement now accepts `1`/`0` as expected (`PUBLIC_ENABLE_EZOIC=1` works).

## 2) Values currently in use

### Sentry DSNs
- Frontend DSN (`NUXT_PUBLIC_SENTRY_DSN`):
  - `https://e2b7d2fae466cb8d4131fe7e7e454e46@o4510899690274816.ingest.us.sentry.io/4510899713605632`
- Backend DSN (`SENTRY_DSN` in AWS secret):
  - `https://48372ee89031b04f263e1ef0383fbbc1@o4510899690274816.ingest.us.sentry.io/4510899736150016`

### Google analytics/ads ids
- GA4 measurement id: `G-9F9QHZLVGB`
- GTM container id: `GTM-NWHP6CR5`
- AdSense publisher id: `pub-1142571612710341`

## 3) What I cannot do from this workspace (you must do)

### A) Stripe custom domain DNS records
Your Route53 zones in `rs-staging` / `rs-prod` do not host `remit-scout.com`, so DNS must be changed where your domain is actually managed.

Add exactly:
1. `pay.remit-scout.com`  
   - Type: `CNAME`  
   - Value: `hosted-checkout.stripecdn.com`  
   - TTL: `300`
2. `_acme-challenge.pay.remit-scout.com`  
   - Type: `TXT`  
   - Value: `XmUlz9HNM127e31vlDUXsf0L7SLYK0hsBaxrX9BUKk0`  
   - TTL: `300`

Then click **Verify** in Stripe custom domains.

### B) SES verification completion
SES identities exist but must be fully verified for sending:
1. Open SES in each account (`staging`, `prod`) and check identity `remit-scout.com`.
2. Publish all SES DKIM records + MAIL FROM/SPF/DMARC DNS records at your DNS host.
3. Wait until `VerifiedForSendingStatus=true`.
4. Ensure SES production access is approved (not sandbox-limited).

### C) Sentry token/project confirmation
I could not verify project slugs via API using the token you pasted (insufficient org/API permission from CLI check).  
You must confirm these repo secrets in GitHub:
- `SENTRY_AUTH_TOKEN` (token with release upload scope)
- `SENTRY_ORG=remit-scout`
- `SENTRY_PROJECT=<frontend-project-slug>`

If `SENTRY_PROJECT` is wrong, sourcemap upload is skipped/failed.

### D) Real Ezoic placement IDs
Current placement vars still use fallback `101`. Replace with real IDs from Ezoic dashboard:
- `PUBLIC_EZOIC_COMPARE_INLINE_IDS`
- `PUBLIC_EZOIC_COMPARE_SIDEBAR_IDS`
- `PUBLIC_EZOIC_HOME_INLINE_IDS`
- `PUBLIC_EZOIC_DASHBOARD_INLINE_IDS`
- `PUBLIC_EZOIC_CORRIDOR_INTERSTITIAL_IDS`
- `PUBLIC_EZOIC_CORRIDOR_BELOW_FAQ_IDS`
- `PUBLIC_EZOIC_CORRIDOR_FOOTER_IDS`
- `PUBLIC_EZOIC_BLOG_SIDEBAR_IDS`
- `PUBLIC_EZOIC_BLOG_INLINE_IDS`
- `PUBLIC_EZOIC_BLOG_BANNER_IDS`

## 4) GA4 UI actions you still need to do

In GA4 (`G-9F9QHZLVGB`):
1. Mark key events (star them):
   - `purchase`
   - `begin_checkout`
   - `sign_up`
   - `generate_lead`
2. Create audiences:
   - `Purchased Plus` (purchase in last 30d)
   - `Checkout No Purchase` (begin_checkout in 14d, exclude purchase 14d)
   - `Signed Up No Purchase` (sign_up in 30d, exclude purchase 30d)
   - `High Intent Transfer Shoppers` (2+ qualifying views/searches in 7d, exclude purchase 30d)

## 5) Final deploy order after you finish external items

1. Run `staging/go-live-readiness`.
2. Run `deploy.yml` for `staging`.
3. Verify staging health + billing webhooks + Sentry events.
4. Tag release and run `deploy.yml` for `prod`.
5. Verify:
   - `SENTRY_DSN` present in Lambda/ECS runtime
   - frontend sends client-side errors to Sentry
   - Stripe custom domain is verified and active
   - SES send status healthy
