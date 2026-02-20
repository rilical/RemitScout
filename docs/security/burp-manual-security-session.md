# Burp Community Manual Security Session (Staging)

## Purpose
Run a repeatable, staging-only manual security pass using Burp Suite Community Edition to complement automated scanning (`OWASP ZAP`, `Snyk`, `pnpm audit`) and capture evidence for compliance sign-off.

Feedback source: chat transcript (2026-02-20).  
User goal: close pentest/DAST evidence gap with an operator-run manual test session.

## Scope and authoritative references
- Environment: staging only.
- Primary scope docs:
  - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/ARCHITECTURE.md`
  - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/architecture/security.md`
  - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/auth-bypass-paths.md`
  - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/route-validation-audit.md`
  - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/compliance-signoff-2026-02-11.md`

## Safety rules (non-negotiable)
- No destructive payloads.
- No availability-impacting tests (no fuzz storms, no volumetric brute-force, no queue flooding).
- No credential stuffing.
- No writes against production.
- Redact tokens/cookies/PII in evidence artifacts before sharing.

## Preflight checklist
- [ ] Confirm target URLs:
  - `https://staging.remit-scout.com`
  - `https://staging-api.remit-scout.com`
  - Plane C internal test target (staging internal route host) is documented for the session.
- [ ] Confirm staging test users exist:
  - `actor=user` (non-admin)
  - `actor=admin` (admin entitlement)
  - `actor=anonymous` (no login)
- [ ] Confirm rate limits and auth controls are enabled in staging.
- [ ] Confirm latest auth bypass map and route validation audit are reviewed.
- [ ] Confirm the findings register file exists:
  - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/security-findings-register-2026-02.md`

## Burp setup (Community Edition)
1. Launch Burp and start a proxy listener on `127.0.0.1:8080`.
2. Configure browser/system proxy to `127.0.0.1:8080`.
3. Install Burp CA certificate in the test browser trust store.
4. In Burp Target scope, include:
   - `staging.remit-scout.com`
   - `staging-api.remit-scout.com`
5. Disable browser extensions that modify requests.
6. Use Burp tools only:
   - `Proxy` (intercept/history)
   - `Repeater` (manual variant testing)
   - `Dashboard` passive findings

## Manual test matrix
| Category | Actor | Example targets | Burp action | Expected |
|---|---|---|---|---|
| Auth bypass checks | anonymous | Protected prefixes from `auth-bypass-paths.md` (`/api/v1/me`, `/api/v1/billing`, `/api/v1/data`, `/api/v1/account`) | Replay requests without auth headers/cookies | `401/403`; no protected data returned |
| Privilege escalation | user | Admin/ops routes (`/api/v1/admin*`, `/api/v1/ops*`) | Replay user token against admin routes and mutate role claims | `403`; no admin action executed |
| IDOR / tenant boundary | user | Export/data/account endpoints | Swap resource identifiers across accounts | `403/404`; no cross-tenant access |
| Schema/input tampering | anonymous/user | High-risk routes from route audit (`billing/webhook`, `data-export`, `pulse`, `pulse-teaser`) | Modify params/query/body types, enum values, missing fields | Validation failure (`400/422`) or safe reject |
| Token/session handling | user/admin | Login/session-protected routes | Replay stale tokens, missing JWT audience, altered token segments | Rejected token (`401/403`) |
| Rate-limit behavior | anonymous/user | Public and sensitive write routes (`telemetry`, `billing/webhook`, `auth-sensitive`) | Controlled repeated requests in small bursts | Throttled correctly; no fail-open behavior |
| Export / data exfiltration | user | `/api/v1/data/export`, `/api/v1/exports*` | Request unowned data scopes or elevated filters | Access denied and no sensitive payload leakage |
| Plane C internal route access | anonymous/user | Internal publisher validation route | Call without IAM/internal token, then with invalid token | Unauthorized response; no internal data output |

## Required evidence for each finding
Every confirmed issue must include:
- Request/response pair (sanitized).
- Endpoint.
- Actor role.
- Expected vs actual behavior.
- Severity (`critical|high|medium|low`).
- Reproducibility (`always|intermittent|one-off`).
- Suggested fix.
- Link into findings register.

Use this capture template:

```md
### Finding: <ID>
- Endpoint: <METHOD PATH>
- Actor: <anonymous|user|admin>
- Category: <auth-bypass|priv-esc|idor|validation|session|rate-limit|data-exfil|internal-auth>
- Expected: <expected secure behavior>
- Actual: <observed behavior>
- Severity: <critical|high|medium|low>
- Reproducibility: <always|intermittent|one-off>
- Evidence link: <artifact path or issue URL>
- Suggested fix: <one concrete remediation>
```

## Session closeout checklist
- [ ] All matrix categories executed at least once.
- [ ] All confirmed findings logged in:
  - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/security-findings-register-2026-02.md`
- [ ] False positives marked explicitly.
- [ ] Unclear cases converted into follow-up API/infra checks.
- [ ] Summary posted to compliance sign-off thread/doc.

