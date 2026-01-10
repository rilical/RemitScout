# Core Web Vitals Budget

Targets (P75, mobile):
- LCP: < 2.5s
- CLS: < 0.1
- INP: < 200ms

Asset budgets:
- Home hero image: preload, <= 250 KB webp
- Above-the-fold JS: <= 180 KB (gz)
- Total JS: <= 500 KB (gz)

Implementation hooks:
- Preload the hero map image on home.
- Keep dynamic charts lazy-loaded on /pulse.
- Avoid large fonts or blocking CSS above the fold.
