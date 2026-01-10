# Technical SEO Checklist (Release Gate)

Run these before every production release. If any item fails, block release until resolved.

1) Crawl + index controls
- `frontend/public/_robots.txt` includes a `Sitemap:` line for production.
- No accidental `noindex` on public pages; private routes remain blocked.
- Admin, dashboard, and auth routes stay blocked in robots.

2) Sitemap coverage
- `/sitemap.xml` includes corridors, providers, guides, and pulse charts.
- Dynamic routes map to real pages (no 404s in sitemap).
- GSC sitemap submission is up to date after deploy.

3) Canonicals + tracking params
- Canonical URLs strip UTM + click IDs (`utm_*`, `gclid`, `fbclid`, `msclkid`).
- `setSeo()` is used on all /learn and /send-money pages.

4) Core Web Vitals budget
- LCP target < 2.5s, CLS < 0.1, INP < 200ms for home + send-money.
- Hero map image is preloaded on home.
- No unbounded layout shifts in hero/compare modules.

5) Structured data
- WebSite + Organization schema render without errors.
- Breadcrumb schema appears on /learn and /send-money pages.

Automation
- Run `pnpm -C frontend seo:check` (fails if sitemap/canonical gates regress).
