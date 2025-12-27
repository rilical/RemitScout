# Contributing to Remit-Scout V2

Thank you for contributing. To maintain our high standards of safety, compliance, and reliability, please follow this guide when proposing changes.

## Development Process
1. **Discuss First:** For significant changes, open an issue or ADR to discuss the idea and implications (especially around compliance).
2. **Pull Request Workflow:** Create a feature branch, make commits (signing each commit to verify authorship), and open a PR. Ensure the CI passes (lint, tests, etc.) before requesting a review.
3. **Code Review:** All PRs require at least one peer review. Reviewers will check for correctness, style, and adherence to our architectural rules (Golden Rule, etc.).

## Compliance Checklist (Must Review Before Merging)
Every change must be evaluated against our core architectural and policy requirements. Use this checklist:

- **Which Plane is being changed?**
  Identify if your change affects Plane A (product/API), Plane B (ingestion/truth), or Plane C (publishing/analytics).
  - *Plane A changes:* Verify you are not accessing Bronze data or any internal raw store. All data exposed via Plane A must come from Silver or Gold (processed data).
  - *Plane B changes:* Ensure stop-on-block and rights matrix policies are respected (e.g. no scraping beyond allowed limits). If you add a new provider or data source, update the Data Rights Matrix and ensure Allowed_Collect/Allowed_B2C/Allowed_B2B flags are set appropriately.
  - *Plane C changes:* Verify any new outputs follow the Gold Publisher protocol (only derived, aggregated data leaves Plane C) and meet publishing thresholds (e.g. N>=3 anonymity rule).

- **Does this change touch Bronze (raw data)?**
  Any code path reading or writing raw Bronze data demands scrutiny. Plane A services must never directly read Bronze. Plane B can, but those raw artifacts must stay internal (no exposure to users). If your change requires an exception, it must be documented in an ADR and approved via security review before merging. Often, a redesign is needed rather than violating this rule.

- **Are Data Rights and Governance updated?**
  If you introduce a new data provider, feature, or change how data is used, update the Data Rights Matrix and any relevant policies. For example, if a new provider's data will be collected or published, ensure there are corresponding Allowed_Collect / Allowed_B2C / Allowed_B2B entries and they are approved. Any change to compliance-related configurations (entitlements, thresholds) might also require an ADR and review by the compliance officer.

- **Security and Secrets:** If your change involves new secrets or credentials, do not hard-code them. Use AWS Secrets Manager/Parameter Store as described in `secrets/README.md`. Add any new secret rotation steps to the runbook if needed. Ensure IAM roles and permissions follow least privilege (e.g. a new Lambda should have access only to the specific resources it needs).

- **Testing:** Add or update tests to cover your changes. This includes boundary tests if you altered any plane boundaries or data flows. Remember, CI must enforce the Golden Rule and other invariants, so tests should exist to prevent regressions.

## Coding Standards
- Follow the established project structure (monorepo organized by plane and service). Place code in the correct directory for its plane/scope.
- Run `pnpm -C . lint`, `pnpm -C frontend lint`, and `pnpm -C backend lint` and fix any issues before pushing. Our ESLint will catch forbidden imports or other scope violations.
- Write clear commit messages, and consider linking to ADRs or issues when a commit implements a particular decision or requirement.

## Commit Signing (SSH)
Signed commits are required on `main`. The easiest way on macOS is SSH signing:

```
ssh-keygen -t ed25519 -C "you@example.com"
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

Upload the public key to GitHub as a signing key. After that, every commit will be signed by default.

## Contributor License Agreement (CLA)
(If applicable, mention CLA or any legalities for external contributors.)

---

By adhering to these guidelines, you ensure that Remit-Scout remains secure, compliant, and maintainable. We appreciate your contributions and diligence in following these practices.
