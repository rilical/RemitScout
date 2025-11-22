# Page Structure & Organization

## Main Pages (Root Level)
```
pages/
├── index.vue                    → /                (Home page)
├── about.vue                    → /about           (About Us)
├── faq.vue                      → /faq             (FAQ)
├── contact.vue                  → /contact         (Contact)
├── esim.vue                     → /esim            (eSIM comparison)
```

## Legal & Policy Pages (Organized in /legal/)
```
pages/legal/
├── terms.vue                    → /legal/terms                      (Terms of Service)
├── privacy.vue                  → /legal/privacy                    (Privacy Policy)
├── disclosure.vue               → /legal/disclosure                 (Affiliate Disclosure)
├── affiliate-partnerships.vue   → /legal/affiliate-partnerships     (Partnership Program)
├── how-we-make-money.vue       → /legal/how-we-make-money          (Revenue Transparency)
└── methodology.vue              → /legal/methodology                (Rating Methodology)
```

## Feature-Specific Pages (Subdirectories)
```
pages/
├── send-money/                  → /send-money/*     (Money transfer comparisons)
├── providers/                   → /providers/*      (Provider reviews)
├── country/                     → /country/*        (Country guides)
├── learn/                       → /learn/*          (Educational content)
├── esim/                        → /esim/*           (eSIM providers)
├── exchange-rates/              → /exchange-rates/* (Currency rates)
└── compare/                     → /compare/*        (Direct comparisons)
```

## Assets
```
public/images/about/
├── omar-ghabayen-headshot.webp  (Founder headshot - 664KB, WebP format)
└── README.md                     (Image upload instructions)
```

## URL Migration Summary

### Updated Routes (Old → New)
- `/terms` → `/legal/terms`
- `/privacy` → `/legal/privacy`
- `/disclosure` → `/legal/disclosure`
- `/affiliate-partnerships` → `/legal/affiliate-partnerships`
- `/how-we-make-money` → `/legal/how-we-make-money`
- `/methodology` → `/legal/methodology`

### Components Updated
- ✅ `components/nav/SiteFooter.vue` - All legal links updated
- ✅ `pages/about.vue` - Methodology link updated
- ✅ `pages/about.vue` - Headshot path updated to use `.webp`

## Benefits of This Structure

1. **Better Organization**: Legal/policy pages grouped logically
2. **Cleaner Root**: Main pages (about, faq, contact) stay at root for easy access
3. **Scalability**: Easy to add more legal docs without cluttering root
4. **SEO-Friendly**: Clear URL structure (`/legal/*` for all legal content)
5. **Maintainability**: Related pages grouped together

## Notes

- All old routes will need 301 redirects if they were previously indexed
- Footer navigation automatically updated to new paths
- Breadcrumbs in legal pages should reflect the new structure
- Consider adding a legal index page at `/legal` listing all legal documents

