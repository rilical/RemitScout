# Executive Summary: Remit-Scout

## Problem & Solution

The global remittance market is opaque and fragmented. “Zero fee” marketing is common, but providers bury cost in the foreign-exchange (FX) spread, often costing migrants 3–7% per transaction. Students, expatriates, and immigrant workers lack tools to compare real-time spreads across banks, digital wallets, and specialist providers—resulting in billions lost annually in hidden fees.

Remit-Scout closes this transparency gap with a **remittance comparison engine** built for speed and accuracy. We aggregate and normalize real-time quotes from legacy providers (e.g., Western Union), digital challengers (Wise, Remitly, Ria), and others into a single view. Our core metric is **Net Delivered Value**—what the recipient actually receives after fees and FX markup—so users can see the true effective rate for their corridor and choose the option that gets the most money to their family.

The platform runs on an **AWS-native, event-driven architecture**: Plane B collectors ingest provider data into Bronze (raw) and Silver (normalized) layers; scheduled and on-demand jobs maintain freshness by corridor tier (USD-origin macro corridors every 10 minutes, others every 3 hours across ~7,500 macro corridors; non-prod defaults can disable Tier-1 so all corridors run at 3-hour cadence). Plane A serves the public API with Redis-backed caching for sub-second responses; Plane C publishes Gold aggregates and proprietary indices (TEER™, RVI™, RCI™) for institutional use. Indices are **synthetic volume-weighted** using quote frequency, spread stability, and recency with confidence-based blending of corridor vs. global weights. We use SQS, EventBridge, ECS Fargate, and Lambda—no custodial handling of funds—so we stay strictly an information layer and avoid money-transmitter regulation.

---

## Market

**Primary:** Global cross-border payments, with initial focus on **MENA (Middle East & North Africa)**. World Bank estimates put global remittance flows above $800B annually; MENA inflows exceed $60B, with some of the highest fee structures due to currency volatility and corridor concentration.

**Secondary:** **Alternative data** for institutional finance. Hedge funds and macro desks pay a premium for high-frequency signals on consumer capital flows. By tracking real-time remittance volume, corridor demand, and FX spreads, Remit-Scout produces a proprietary dataset useful for quantitative strategies and emerging-market currency research. This is monetized via enterprise data feeds and API access, tiered by freshness and corridor coverage (USD-origin Tier 1 vs. full Tier 2).

---

## Competition

Most users today compare options manually across 3–4 apps (e.g., Wise, their bank, a local exchange)—time-consuming and error-prone. Generic comparison sites (e.g., Monito) act largely as lead-gen with slower refresh and less corridor depth.

Remit-Scout differentiates on **latency, depth, and methodology**. Tiered collection (10-minute cadence for USD-origin macro corridors, 3-hour for others; non-prod can run 3-hour only) and queue-backed workers let us surface short-lived arbitrage and rate moves that static comparators miss. We focus on underserved corridors (starting with Jordan/MENA), building a loyal user base that Western-centric aggregators under-serve. Rankings are driven by **Remit-Score** and Net Delivered Value; we maintain a strict no pay-to-rank policy and publish our methodology, so users and enterprise clients can trust the data.

---

## Financials & Distribution

**Dual revenue model:**

- **B2C — Affiliate:** We earn commission (CPA or % of transfer) from remittance providers when users initiate a transfer via our links. Commercial relationships are disclosed and do not affect ranking.
- **B2B — Data & API:** We sell anonymized flow data, FX spread history, and access to TEER/RVI/RCI indices on a subscription basis to institutional investors, research teams, and platforms.

We project that capturing a small share of key corridors (e.g., US–Jordan) plus 2–3 institutional data contracts can support sustainable profitability within 24 months. Distribution is built on low-cost organic growth: international student offices (starting with CMU), digital community groups, and SEO in high-intent remittance and corridor search.

---

## Milestones & Challenges

**Current state:** Core backend is in place: Bronze/Silver/Gold pipeline, tiered sweep mechanics (EventBridge + SQS + ECS/Lambda), Redis caching, and Plane A/C APIs. Synthetic weighting is computed in Gold (`provider_weight_snapshot`) and applied consistently across live and batch indices. Dev is typically paused via CDK (`devPaused`) to control cost, and staging defaults disable Tier-1 collection (3-hour cadence for all corridors). The product compares 30+ providers across 150+ corridors, supports rate alerts and watchlists, and exposes Gold indices for enterprise.

**Q2 2026 milestones:**

- Public beta for priority corridors (e.g., US–Jordan).
- First API or affiliate partnership with a major provider (e.g., Remitly).
- Validation of the data feed with industry advisors and early institutional contacts.

**Key challenges:** Regulatory clarity on data collection (scraping and terms of use) and ensuring we remain a non-custodial, information-only layer so we do not trigger money-transmitter or payment-institution licensing. We address this through clear product boundaries, public methodology, and legal review as we scale.

---

## Team

**Omar Ghabayen (Founder)** — B.S. candidate in Electrical & Computer Engineering at Carnegie Mellon University, with focus on software systems and quantitative finance. Background includes research at CMU’s Applied Generative AI Lab and experience with top quantitative and technology firms (e.g., Balyasny, Palantir). Combines distributed-systems and data-pipeline engineering with direct experience of the pain points facing international students and expatriates—including the “$30 that disappeared” that motivated Remit-Scout’s founding.

---

*Remit-Scout is incubated at Carnegie Mellon’s Swartz Center for Entrepreneurship. TEER™, RVI™, and RCI™ are trademarks of Remit-Scout.*
