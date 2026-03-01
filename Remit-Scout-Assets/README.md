# Remit Scout — Design & Brand Assets

**Last organized**: March 1, 2026

## Folder Structure

```
Remit-Scout-Assets/
├── 01-Brand/                      # Remit Scout brand identity
│   ├── Logo-Mark/                 # Icon/mark variants
│   │   ├── remit-scout-icon.svg
│   │   ├── remit-scout-icon-plus.svg
│   │   └── remit-scout-square.png
│   ├── Full-Logo/                 # Full horizontal logos
│   │   ├── remit-scout-full.svg
│   │   ├── remit-scout-full-plus.svg
│   │   └── remit-scout-web.svg
│   └── OG-Social/                 # Open Graph / social sharing
│       └── og-image.png
│
├── 02-Provider-Logos/             # All 25 provider logos
│   ├── SVG/                       # Vector (15 providers)
│   ├── PNG/                       # Raster (9 providers)
│   └── Other/                     # WebP, JPEG formats
│
├── 03-UI-Marketing/               # Product & marketing visuals
│   ├── Dashboard/                 # Product screenshots
│   ├── Team/                      # Team headshots
│   ├── Maps/                      # World map assets
│   └── Misc/                      # Other marketing assets
│
└── 04-Architecture-Diagrams/      # Technical architecture (25 diagrams)
    ├── Infrastructure/            # System architecture sections
    └── Workflows/                 # Data flow & workflow diagrams
```

## Provider Logo Inventory

| Provider | SVG | PNG | Other |
|----------|-----|-----|-------|
| Al Ansari | ✅ | — | — |
| Boss Money | — | ✅ | — |
| Dahabshiil | — | ✅ | — |
| Instarem | ✅ | — | — |
| Intermex | — | ✅ | — |
| KoronaPay | ✅ | — | — |
| MoneyGram | ✅ | — | — |
| Mukuru | — | ✅ | — |
| OrbitRemit | — | ✅ | — |
| Pangea | — | — | ✅ (webp) |
| Paysend | ✅ | — | — |
| Placid | — | ✅ | — |
| RemitBee | — | — | ✅ (jpeg) |
| Remitly | ✅ | — | — |
| RIA | ✅ | — | — |
| Sendwave | ✅ | — | — |
| SingX | — | ✅ | — |
| TransferGo | ✅ | — | — |
| Wells Fargo | ✅ | — | — |
| Western Union | ✅ | — | — |
| WireBarley | — | ✅ | — |
| Wise | ✅ | — | — |
| WorldRemit | ✅ | — | — |
| XE | ✅ | — | — |
| Xoom | ✅ | — | — |

## Notes

- **Canonical source**: Assets were deduplicated from `frontend/png/SVG/`, `frontend/public/logos/`, and `frontend/public/png/SVG/PROVIDERS/`. This folder contains one clean copy of each asset.
- **Missing formats**: Some providers only have PNG/JPEG — consider requesting SVG versions for print and scaling.
- **Architecture diagrams**: Generated from code — can be regenerated from `docs/diagrams/` source files.
