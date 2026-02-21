# Third-Party Sub-Processors

**Owner:** DPO / Engineering Lead
**Last reviewed:** 2026-02-21
**Review cadence:** Quarterly or upon adding/removing a processor

---

## Purpose

Under GDPR Article 28, RemitScout as a data processor/controller must maintain a list of
sub-processors that process personal data on our behalf. This document serves as the
authoritative registry.

---

## Active Sub-Processors

| Processor | Purpose | Data Categories | DPA Status | Data Location | Added |
|-----------|---------|-----------------|------------|---------------|-------|
| **Amazon Web Services (AWS)** | Cloud infrastructure (compute, storage, database, CDN, WAF) | All platform data | AWS DPA (incorporated into service terms) | us-east-1 (primary) | Launch |
| **Supabase** | Authentication and user identity management | Email, auth tokens, user profile | Supabase DPA signed | US (AWS-hosted) | Launch |
| **Stripe** | Payment processing and billing | Name, email, payment method, billing address | Stripe DPA (incorporated into service terms) | US/EU | Launch |
| **Sentry** | Error monitoring and application performance | IP address (anonymized), device info, error stack traces | Sentry DPA signed | US | Launch |
| **Ezoic** | Ad serving and revenue optimization | IP address, cookies, browsing behavior | Ezoic DPA signed | US/EU | Launch |
| **Google Analytics (GA4)** | Website analytics and user behavior | IP address (anonymized), cookies, page views, events | Google DPA (Data Processing Amendment) | US/EU | Launch |
| **Cloudflare** | DNS and DDoS protection (if used) | IP address, request metadata | Cloudflare DPA signed | Global edge | Launch |

---

## Data Categories Reference

| Category | Description | Retention |
|----------|-------------|-----------|
| Authentication data | Email, hashed password, JWT tokens | Account lifetime + 30 days |
| Usage data | Page views, searches, clicks, sessions | 90 days (raw), 2 years (aggregated) |
| Payment data | Stripe customer ID, subscription status | Account lifetime + 7 years (legal) |
| Technical data | IP address, user agent, error logs | 90 days |
| Quote comparison data | Corridors searched, providers viewed | 90 days |

---

## DPA Requirements Checklist

For each sub-processor, verify:
- [ ] Written DPA or equivalent contractual clauses in place
- [ ] Adequate safeguards for international transfers (SCCs if outside EU/EEA)
- [ ] Technical and organizational security measures documented
- [ ] Sub-processor's own sub-processor list reviewed
- [ ] Breach notification obligations defined
- [ ] Data deletion/return obligations on termination

---

## Change Management

When adding a new sub-processor:
1. Conduct data protection impact assessment (if high-risk processing)
2. Execute DPA with the processor
3. Update this document
4. Notify existing users if required by contract/regulation (30-day notice)
5. Update privacy policy on website

When removing a sub-processor:
1. Confirm data deletion/return per DPA terms
2. Obtain deletion confirmation in writing
3. Update this document
4. Update privacy policy on website

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-02-21 | Initial version | Engineering |
