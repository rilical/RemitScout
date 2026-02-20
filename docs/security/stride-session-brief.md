# Claude STRIDE Session Brief (1 Hour, Staging)

## Objective
Run a time-boxed STRIDE threat model session against the current staging architecture, then convert outputs into runnable tests and tracked findings.

Duration: 60 minutes.  
Environment: staging only.

## Inputs to provide Claude
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/ARCHITECTURE.md`
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/architecture/security.md`
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/auth-bypass-paths.md`
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/route-validation-audit.md`
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/compliance-signoff-2026-02-11.md`

## Trust boundaries to include explicitly
- Internet clients -> CloudFront/WAF -> Plane A public API.
- Plane A -> Redis/Postgres (Silver/Gold views).
- Plane B collectors/workers -> Bronze/Silver data stores and queues.
- Plane C internal publisher routes -> internal callers only.
- Plane A/B/C -> external services (Stripe, Supabase, OANDA/providers, Slack, GitHub Actions).
- CI/CD and runtime secrets boundary (GitHub env/secrets, AWS Secrets Manager/SSM).

## Exact prompt package
Use this prompt with Claude as-is:

```text
You are a senior security architect.
Generate a STRIDE threat model for this system based only on the provided docs.

Scope constraints:
- Environment is staging-first.
- Use architecture/security invariants from the docs.
- Focus on correctness, AWS readiness, performance impact, security, and data integrity.
- Do not invent components not present in docs.

Output requirements:
1) Produce exactly 10 highest-risk threats sorted by risk score descending.
2) For each threat include:
   - threat_id
   - stride_category (Spoofing/Tampering/Repudiation/Information Disclosure/Denial of Service/Elevation of Privilege)
   - affected_component
   - trust_boundary
   - threat_statement
   - likelihood (1-5)
   - impact (1-5)
   - risk_score (likelihood * impact)
   - one runnable test
   - test_type (Burp manual | API test | infra/config check)
3) For each runnable test, provide:
   - exact endpoint/component to test
   - actor role (anonymous/user/admin/internal)
   - expected secure result
4) Include a short "Top mitigations this sprint" list (max 5 items), mapped to threat_id.

Return output in markdown tables only.
```

## Output contract (must be enforced)
Each threat row must include:
- `threat_id`
- `stride_category`
- `affected_component`
- `trust_boundary`
- `threat_statement`
- `likelihood` (1-5)
- `impact` (1-5)
- `risk_score` (`likelihood * impact`)
- `test_type` (`Burp manual|API test|infra/config check`)
- `runnable_test`

## 60-minute facilitation plan
1. 0-10 min: Load docs, confirm scope and trust boundaries.
2. 10-30 min: Generate initial STRIDE threat inventory.
3. 30-45 min: Force-prioritize to Top 10 by risk score.
4. 45-55 min: Validate each threat has one runnable test.
5. 55-60 min: Export into repository artifacts:
   - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/stride-threat-model-2026-02.md`
   - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/security/security-findings-register-2026-02.md`

## Completion criteria
- Top 10 threats are ranked and test-mapped.
- Each row has likelihood, impact, and risk score.
- Each row has one test type and runnable test.
- Findings requiring remediation are logged in the findings register with owner and target date.

