# AWS Edge Guardrails (Public API)

Use these as deployment guardrails to reduce scraping without blocking public users.

## CloudFront
- Cache public routes with short TTLs (30-60s) and enable stale-while-revalidate.
- Forward only required headers (Authorization, If-None-Match) to reduce cache fragmentation.
- Enable compression and HTTP/2.

## WAF
- Add rate-based rules (per IP) for /api/quotes/current and /api/popular-corridors.
- Use managed bot control rules if available.
- Block known bad ASNs and high-risk countries if needed.

## API Gateway
- Apply usage plans and API keys only for partner or internal endpoints.
- Set stage throttling limits for public endpoints.
- Add request size limits and timeouts.

## Observability
- Track 401/403/429 rates and top IPs.
- Alert on spikes in cache misses and DB latency.
