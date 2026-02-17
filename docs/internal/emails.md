# Remit-Scout Email Catalog (B2C + Ops + Institutional)

This document is the single source of truth for:
- Which system sends each email (Supabase vs backend).
- Which identity/address it sends from.
- Where the template lives (code path).
- Which environment variables are required.
- What you must configure in AWS SES to reliably send from `no-reply@remit-scout.com`.

## 1) Owners: Who Sends What

### Supabase Auth (account emails)
Sent by: **Supabase Auth** (not Plane A).
- Email confirmation
- Password reset
- Magic link / OTP (if enabled)

Where to configure templates:
- Supabase dashboard: Auth settings -> Email templates

SMTP provider:
- Configure Supabase to use **your SMTP** (SES SMTP) so emails come from your domain and pass DMARC alignment.

### Plane A / Plane B (product + ops emails)
Sent by: **backend code via AWS SES API**.

Main code paths:
- Billing emails: `backend/plane-a/src/services/billing-email.ts`
- Newsletter emails: `backend/plane-a/src/services/newsletter-email.ts`
- Contact form emails: `backend/plane-a/src/routes/contact.ts`
- Alert emails (ops/user alerts): `backend/plane-a/src/services/alert-notifications.ts` and `backend/shared/config.ts` (SMTP settings)
- Worker notifications: `backend/plane-b/src/notifications/aws-services.ts`

IAM for SES:
- CDK requires explicit SES identity ARNs in staging/prod and grants `ses:SendEmail`/`ses:SendRawEmail` scoped to those identities.
  See: `infrastructure/cdk/lib/iam.ts`

## 2) Email Types (Catalog)

### Billing (Plane A, SES API)
Sender: Plane A -> SES API

Config keys:
- Enable toggle: `BILLING_EMAIL_ENABLED` (defaults on unless `0`/`false`)
- From address:
  - `BILLING_EMAIL_FROM` (preferred), else `SES_FROM_ADDRESS`
- From name: `BILLING_EMAIL_FROM_NAME` (default `Remit-Scout Billing`)
- SES region: `SES_REGION` (fallback `AWS_REGION`, default `us-east-1`)
- Site URL for links: `FRONTEND_BASE_URL`/`PUBLIC_SITE_URL` (via config)

Templates:
- `backend/plane-a/src/services/billing-email.ts`

Events (implemented):
- Plus confirmation: `sendPlusConfirmationEmail(...)`
- Payment failed: `sendPaymentFailedEmail(...)`
- Cancellation: `sendCancellationEmail(...)`
- Cancellation scheduled: `sendCancellationScheduledEmail(...)`
- Chargeback admin alert: `sendChargebackAdminEmail(...)`

### Newsletter (Plane A, SES API)
Sender: Plane A -> SES API

Config keys:
- `NEWSLETTER_EMAIL_ENABLED` (default true)
- `NEWSLETTER_EMAIL_FROM` (preferred), else `SES_FROM_ADDRESS`
- `NEWSLETTER_EMAIL_FROM_NAME` (default `RemitScout Newsletter`)
- `NEWSLETTER_BASE_URL` (links fallback to `FRONTEND_BASE_URL` / `PUBLIC_SITE_URL`)
- `NEWSLETTER_TOKEN_EXPIRY_HOURS` (default 168)
- `NEWSLETTER_WELCOME_ENABLED` (controls welcome email)

Templates:
- Confirmation: `sendConfirmationEmail(...)` in `backend/plane-a/src/services/newsletter-email.ts`
- Welcome: `sendWelcomeEmail(...)` in `backend/plane-a/src/services/newsletter-email.ts`

### “Welcome to Remit-Scout” (product onboarding)
Status: Not a dedicated backend email template today.

Recommended approach:
- If you want it tied to signup: implement it as a **Supabase Auth** template (post-confirm redirect) OR add a Plane A endpoint invoked after first login.
- If you want it tied to Plus purchase: billing confirmation already exists.

## 3) Standard “From” Policy (Recommended)

Use a single verified domain identity and a consistent address.

Recommended:
- `SES_FROM_ADDRESS=no-reply@remit-scout.com`
- `SES_FROM_NAME=Remit-Scout`
- `BILLING_EMAIL_FROM=no-reply@remit-scout.com`
- `NEWSLETTER_EMAIL_FROM=no-reply@remit-scout.com`
- Reply-to (optional): `SES_REPLY_TO=support@remit-scout.com`

Notes:
- You do not need a real mailbox for `no-reply@...` unless you expect replies to be read.
- If you do not want replies, set a Reply-To that is monitored, or omit Reply-To and rely on “no-reply” UX.

## 4) AWS SES Setup Checklist (to send from `no-reply@remit-scout.com`)

Do this in the SES region you send from (commonly `us-east-1`).

1. Verify the domain identity:
   - Identity: `remit-scout.com`
2. Enable DKIM:
   - Publish the DKIM CNAME records SES provides.
3. Publish SPF:
   - TXT at root: `v=spf1 include:amazonses.com -all`
4. Publish DMARC:
   - TXT at `_dmarc.remit-scout.com`
   - Start conservative:
     - `v=DMARC1; p=none; rua=mailto:dmarc@remit-scout.com; adkim=s; aspf=s`
   - After you confirm alignment and low failures, move to `quarantine` then `reject`.
5. (Recommended) Configure a custom MAIL FROM domain:
   - e.g. `mail.remit-scout.com`
   - Add the MX/TXT SES requires.
6. Ensure SES production sending:
   - If SES account is in sandbox, request production access.
7. Bounce/complaint handling:
   - Verify SNS topics + subscription endpoints if you want automated suppression.
   - In-app suppression exists as `silver.email_suppression` and is checked by billing/newsletter.

## 5) Supabase Auth Email Setup (to send from your domain)

Configure Supabase to use your SMTP so Auth emails originate from your domain:

1. Create SES SMTP credentials:
   - SES -> SMTP settings -> Create SMTP credentials
2. Set Supabase SMTP:
   - Host: `email-smtp.<region>.amazonaws.com` (example: `email-smtp.us-east-1.amazonaws.com`)
   - Port: `587`
   - TLS: enabled
   - Username/Password: SES SMTP creds
3. Set “From” in Supabase:
   - `no-reply@remit-scout.com` (plus a display name if supported)
4. Customize templates:
   - Confirmation, Reset password, Magic link as needed.

## 6) Runtime Configuration Quick Reference

Backend (Plane A / Plane B):
- `SES_REGION`
- `SES_FROM_ADDRESS`
- `SES_FROM_NAME`
- `SES_REPLY_TO` (optional)
- Billing:
  - `BILLING_EMAIL_ENABLED`
  - `BILLING_EMAIL_FROM`
  - `BILLING_EMAIL_FROM_NAME`
- Newsletter:
  - `NEWSLETTER_EMAIL_ENABLED`
  - `NEWSLETTER_EMAIL_FROM`
  - `NEWSLETTER_EMAIL_FROM_NAME`
  - `NEWSLETTER_BASE_URL`
  - `NEWSLETTER_WELCOME_ENABLED`

Supabase:
- Configure SMTP + templates in Supabase UI (not via these env vars).

## 7) Testing (Pragmatic)
- Use a staging SES identity first, send to a real mailbox (Gmail + institutional mailbox) and verify:
  - DKIM/SPF pass
  - DMARC alignment (From domain aligns)
  - No clipping / links correct
- Trigger known flows:
  - Newsletter subscribe -> confirm -> welcome
  - Stripe payment failed webhook -> payment failed email
  - Stripe subscription cancel -> cancellation email

