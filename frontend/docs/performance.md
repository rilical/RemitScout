# Performance Notes

## Lazy-Loaded Components
Nuxt 3 supports lazy-loading auto-imported components by prefixing with `Lazy` in templates:

- Example: `<LazyShareModal />` instead of `<ShareModal />`

Use this for components that are:

- Below the fold
- Only shown after user interaction (modals, drawers)
- Heavy dependencies (ECharts, KaTeX)

### Components That Should Stay Lazy
- `SaveAlertModal`
- `AuthPromptModal`
- `LimitReachedModal`
- `ShareModal`
- `ProviderScoreModal`
- `PulseShareModal`
- `LaTeXFormula`
- Pulse chart components: `PulseLineChart`, `PulseBarChart`, `PulseStackedChart`, `PulseScatterChart`, `PulseMatrixTable`, `PulseTableView`
- Home below-fold sections: `CorridorsGridDynamic`, `BankVsSpecialistDynamic`, `PulseTeaserSection`, `InstitutionalTeaser`, `PlusTeaser`, `TestimonialsCarousel`, `CountryGrid`, `HomeFaq`, `HowItWorks`, `FounderStory`, `WhyPricesVary`, `HelpFooter`, `TravelToolsSection`, `LatestGuides`, `CtaBanner`, `NewsletterSignup`

Notes:

- If a page imports a component explicitly, you can also use `defineAsyncComponent(() => import('...'))` in `<script setup>` to code-split without changing templates.
- Modals should be guarded with `v-if` on their open state; `v-show` still renders them and will pull the chunk immediately.

