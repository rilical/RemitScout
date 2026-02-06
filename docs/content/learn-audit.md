# Learn (/learn) Content Audit

Last updated: 2026-02-05

Scope:
- Vue learn pages under `frontend/pages/learn/*.vue` (excluding provider reviews under `/learn/providers/**`)
- Markdown learn articles rendered via `frontend/pages/learn/[...slug].vue`

Goal:
- Improve correctness, clarity, internal linking, and conversion (clear "Compare live quotes" CTA).
- Keep brand/style consistent: "Remit-Scout" capitalization and "Remit-Score" hyphenation.

## Global Notes (Apply Everywhere)

- End-of-article CTA: include a clear "Compare live quotes" CTA to `/send-money` and a secondary link to `/learn/providers`.
- Credibility: include a visible "Methodology" link (`/methodology`) near the end (not only in header/sidebar).
- Internal links: cross-link related guides (fees ↔ exchange rates ↔ payout methods ↔ speed).
- Remove placeholder sections and any non-production examples (redirect them instead of indexing them).

---

## Per-Page Review Notes

### `/learn/all`

- Purpose: "All guides" library page that should reflect what actually exists.
- What's good: strong card layout, easy scanning, and consistent styling.
- What's unclear: the library copy can drift if guide counts are hardcoded.
- Quick fixes:
  - Keep the count dynamic (already done).
  - Consider sorting or grouping by category to reduce choice overload.
- Missing internal links: add a visible link to `/learn` (main hub) and `/learn/providers` (reviews) near the top.
- CTA strength: good (has a compare CTA), but consider switching CTA link to `/send-money` instead of `/`.

### `/learn/why-compare-before-every-transfer`

- Purpose: educate users on why comparing every time matters; establish Remit-Scout framing ("recipient gets").
- What's good: clear framing, strong structure, useful checklist sections.
- What's unclear: could more explicitly define "Delivered Value" vs "fees vs FX markup" early.
- Quick fixes:
  - Add a short "Definitions" box: fee, FX markup/spread, recipient gets.
  - Add one concrete numeric example (same corridor, same amount, provider A vs B).
- Missing internal links: `/learn/hidden-exchange-rate-fees-explained`, `/learn/how-to-read-remittance-quote`, `/learn/providers`.
- CTA strength: strong if it ends with a compare CTA; if not, add one.

### `/learn/hidden-exchange-rate-fees-explained`

- Purpose: explain FX markup vs fee and how hidden costs show up.
- What's good: high business value topic; aligns with Remit-Scout differentiator.
- What's unclear: ensure the article avoids implying mid-market is always available and clarify that corridors/methods change pricing.
- Quick fixes:
  - Add a "How to spot it at checkout" checklist: rate shown, fee shown, recipient gets.
  - Add a short section on card funding vs bank funding impact.
- Missing internal links: `/learn/how-to-read-remittance-quote`, `/learn/bank-transfer-vs-card-funding`, `/exchange-rates`.
- CTA strength: should end with "Compare live quotes" (send to `/send-money`).

### `/learn/how-to-read-remittance-quote`

- Purpose: teach users to compare offers using "recipient gets" and total cost.
- What's good: practical; supports product conversion well.
- What's unclear: define the common fields in one consistent table (fee, FX rate, recipient gets, delivery).
- Quick fixes:
  - Add a small "quote field glossary" component/section.
  - Add one screenshot-equivalent diagram (ASCII box) showing the fields and how they relate.
- Missing internal links: `/learn/why-checkout-price-differs`, `/learn/hidden-exchange-rate-fees-explained`.
- CTA strength: should include a compare CTA right after the glossary section.

### `/learn/why-checkout-price-differs`

- Purpose: explain why final checkout price differs and what to do.
- What's good: addresses a common trust issue; reduces user confusion.
- What's unclear: ensure it distinguishes "estimated quote" vs "final checkout" and "bucket/amount" mismatches where relevant.
- Quick fixes:
  - Add "Common causes" as a numbered list: funding method, payout method, promo expiry, weekend spreads, amount bucket.
  - Add "What to do" checklist with 3-5 steps.
- Missing internal links: `/learn/how-to-read-remittance-quote`, `/learn/bank-transfer-vs-card-funding`.
- CTA strength: should end with compare CTA + "read provider reviews" secondary link.

### `/learn/bank-transfer-vs-card-vs-cash-pickup`

- Purpose: explain method tradeoffs for cost, speed, and recipient convenience.
- What's good: broad and high-intent; can drive corridor-specific comparisons.
- What's unclear: cash pickup vs bank deposit speed depends heavily on corridor and provider network; add that caveat near the top.
- Quick fixes:
  - Add a "Decision tree" section: choose pay-in + pay-out based on constraints.
  - Add safety checklist for cash pickup.
- Missing internal links: `/learn/choose-right-delivery-method`, `/learn/how-fast-is-international-money-transfer`.
- CTA strength: strong if it includes `/send-money` link with method preselected.

### `/learn/bank-transfer-vs-card-funding`

- Purpose: explain cost/speed differences between bank funding and card funding.
- What's good: very practical; reduces "why is this more expensive?" confusion.
- What's unclear: clarify which fees are provider fees vs card issuer fees.
- Quick fixes:
  - Add a table: bank vs debit vs credit (typical fees, speed, risk of cash-advance).
  - Add a "When to use cards" section (urgency, small amounts, promo coverage).
- Missing internal links: `/learn/why-checkout-price-differs`, `/learn/how-to-read-remittance-quote`.
- CTA strength: should include compare CTA + recommendation to test both methods in Remit-Scout.

### `/learn/choose-right-delivery-method`

- Purpose: pick payout method (bank vs cash vs wallet) based on recipient constraints.
- What's good: maps to real user needs (recipient access).
- What's unclear: clarify what "mobile money" means per-country; set expectations on eligibility.
- Quick fixes:
  - Add "Recipient constraints" checklist (has bank account, needs cash, has wallet, ID requirements).
  - Add caution on fraud/scams and verification steps.
- Missing internal links: `/learn/bank-transfer-vs-card-vs-cash-pickup`, `/learn/providers`.
- CTA strength: should include compare CTA + provider review link.

### `/learn/how-fast-is-international-money-transfer`

- Purpose: set realistic delivery expectations ("speed buckets").
- What's good: reduces misaligned expectations and support burden.
- What's unclear: ensure it clearly distinguishes "provider submission" vs "recipient availability" times.
- Quick fixes:
  - Add a section: what slows transfers (KYC, bank cutoffs, recipient bank, weekends).
  - Add method-specific speed notes (cash pickup vs bank deposit vs wallet).
- Missing internal links: `/learn/bank-transfer-vs-card-vs-cash-pickup`, `/learn/why-checkout-price-differs`.
- CTA strength: include compare CTA emphasizing delivery method selection.

### `/learn/best-time-to-send-money`

- Purpose: timing advice without over-promising market timing.
- What's good: aligns with "don’t over-optimize" guidance; can be evergreen.
- What's unclear: add clearer caveats about corridor-specific volatility and weekend spreads.
- Quick fixes:
  - Add "simple rules" box: avoid weekends, compare on weekdays, confirm at checkout.
  - Add link to exchange rates pages (`/exchange-rates`).
- Missing internal links: `/learn/how-exchange-rates-work`, `/exchange-rates`.
- CTA strength: end with compare CTA.

### `/learn/promo-codes-intro-rates`

- Purpose: explain promotions and "$0 fee" traps and how to compare fairly.
- What's good: high user value; reinforces independence.
- What's unclear: clarify that promo eligibility can vary by corridor, method, and user status (new vs returning).
- Quick fixes:
  - Add a mini framework: compare with promo and without promo; check effective rate.
  - Add "What to screenshot" checklist for dispute/refund cases.
- Missing internal links: `/learn/hidden-exchange-rate-fees-explained`, `/learn/how-to-read-remittance-quote`.
- CTA strength: end with compare CTA + provider reviews.

### `/learn/how-exchange-rates-work`

- Purpose: explain mid-market vs send rate, spreads, and why rates change.
- What's good: strong foundational guide; aligns with Remit-Scout "delivered value" rubric.
- What's unclear: make sure the article consistently uses the same terms (mid-market, spread, markup).
- Quick fixes:
  - Add a short numeric example (mid-market vs provider rate, show implied markup).
  - Add links to `/exchange-rates` and the hidden fees guide.
- Missing internal links: `/learn/hidden-exchange-rate-fees-explained`, `/exchange-rates`.
- CTA strength: include compare CTA emphasizing "recipient gets" at checkout.

### `/learn/how-remit-score-works`

- Purpose: explain the Remit-Score rubric and independence (anti pay-to-rank).
- What's good: credibility builder; good for SEO and user trust.
- What's unclear: consider adding "how often it updates" and what triggers a score change.
- Quick fixes:
  - Add short section: "Score vs corridor reality" (score is summary; corridor quotes still matter).
  - Add "Where the data comes from" with 3-5 bullet sources.
- Missing internal links: `/methodology`, `/learn/providers`, `/send-money`.
- CTA strength: strong if it pushes readers to provider reviews + live compare.

### `/learn/embed-remit-scout-on-your-site`

- Purpose: publisher/platform onboarding; explain embed approach and independence.
- What's good: clear target audience; supports partnerships.
- What's unclear: the page includes placeholder preview blocks; replace with real screenshots or remove.
- Quick fixes:
  - Add concrete embed code examples and expected response payloads (short).
  - Add contact CTA for partnerships (`/partnerships` or `/contact`).
- Missing internal links: `/methodology`, `/legal/disclosure`, `/contact`.
- CTA strength: partnership CTA should be primary; compare CTA secondary.

### `/learn/money-transfer`

- Purpose: category landing page for "Money Transfer Basics".
- What's good: convenient entry point; card list pattern matches the library page.
- What's unclear: emoji badge and generic "Category" label feel less production-grade.
- Quick fixes:
  - Replace emoji badge with an icon (SVG) and a clearer label ("Category: Money Transfer Basics").
  - Ensure the guide list is driven from the same shared source as `/learn/index` and `/learn/all` (avoid drift).
- Missing internal links: `/learn/all`, `/learn/providers`.
- CTA strength: add compare CTA above the fold and at the bottom.

### `/learn/[...slug]` (Markdown renderer)

- Purpose: render markdown articles under `frontend/content/learn/**`.
- What's good: flexible publishing mechanism; has sidebar methodology box and compare CTA.
- What's unclear: category label above the article currently looks hardcoded; ensure it uses the article’s category/categoryKey.
- Quick fixes:
  - Ensure title/excerpt/category/lastUpdated always render (fallbacks).
  - Add an end-of-article CTA block inside the main column (not only sidebar).
- Missing internal links: depends on article; ensure a default link list exists (methodology, providers, compare).
- CTA strength: good, but add an explicit CTA at end of content.

### Redirected/Removed Content (Housekeeping)

- `/learn/test` should remain a 301 redirect to `/learn`.
- `/learn/money-exchange/how-exchange-rates-work` should remain a 301 redirect to `/learn/how-exchange-rates-work`.

