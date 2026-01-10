# Release SEO Runbook

1) Run automated checks
- `pnpm -C frontend seo:check`

2) Validate sitemap
- Open `https://remitscout.com/sitemap.xml` after deploy.
- Confirm corridors, providers, guides, and pulse chart routes present.

3) Verify canonicals
- Pick 3 /send-money and 3 /learn pages with UTM params.
- Confirm canonical URL drops tracking parameters.

4) Core Web Vitals spot check
- Check home + send-money in Chrome Lighthouse.
- Ensure LCP < 2.5s, CLS < 0.1, INP < 200ms.

5) Search Console
- Submit/update sitemap if structure changed.
- Monitor indexing + coverage reports after release.
