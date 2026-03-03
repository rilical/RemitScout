# LLM-First SEO Phase 2+3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add crawlable answer blocks, expanded FAQs, freshness timestamps, and editorial "best-of" pages so LLMs can extract and cite Remit-Scout data.

**Architecture:** In-place modifications to existing corridor page (`[from]-to-[to].vue`) for Phase 2. Thin wrapper pages under `/best/` for Phase 3 reusing the same API data and composables. No new data fetching logic — everything reads from existing reactive state.

**Tech Stack:** Nuxt 3, Vue 3, Tailwind CSS, `useStructuredData()` composable, `POPULAR_CORRIDOR_CODES`, `PROVIDER_SCORES`, Nitro server routes.

---

## Phase 2: In-Place Crawlability

### Task 1: Add SEO verdict block to corridor page

**Files:**
- Modify: `frontend/pages/send-money/[from]-to-[to].vue` (template, ~line 510 after `</section>` closing the hero, before `<!-- ZONE A: Compare -->` at line 515)
- Modify: `frontend/pages/send-money/[from]-to-[to].vue` (script, add new computed properties near line 4215)

**Step 1: Add verdict computed properties in script section**

After `fastestSpeedDisplay` computed (~line 4215), add:

```typescript
const cheapestProvider = computed(() => {
  const rows = content.value.table.rows
  if (!rows.length) return null
  return rows[0] // Already sorted by best deal (highest recipientGets)
})

const fastestProvider = computed(() => {
  const rows = content.value.table.rows
  if (!rows.length) return null
  return [...rows].sort((a, b) => parseSpeedToHours(a.speed) - parseSpeedToHours(b.speed))[0]
})

const verdictParagraph = computed(() => {
  if (!hasApiQuotes.value || !cheapestProvider.value) return ''
  const cheap = cheapestProvider.value
  const fast = fastestProvider.value
  const count = providerCount.value
  const from = content.value.from
  const to = content.value.to
  const amount = displayAmount.value
  const fromCcy = fromCurrencyCode.value

  let text = `Based on live quotes from ${count} providers, the cheapest way to send ${fromCcy} ${amount.toLocaleString()} from ${from} to ${to} is ${cheap.provider} at ${cheap.fee} total cost (recipient gets ${cheap.recipientGets}).`
  if (fast && fast.provider !== cheap.provider) {
    text += ` The fastest option is ${fast.provider} with delivery in ${fast.speed}.`
  }
  return text
})
```

**Step 2: Add verdict section in template**

Insert between the hero `</section>` tag (~line 510) and `<!-- Anchor Mini Nav -->` (~line 512). Use `v-if="hasApiQuotes && verdictParagraph"` guard:

```html
    <!-- SEO Verdict Block — extractable answer for LLM crawlers -->
    <section
      v-if="hasApiQuotes && verdictParagraph"
      class="bg-neutral-50 border-y border-neutral-200"
    >
      <div class="container py-6">
        <h2 class="text-h3 font-black text-rs-fg mb-3">
          Best way to send money from {{ content.from }} to {{ content.to }}
        </h2>
        <p class="text-body text-neutral-700 max-w-3xl">
          {{ verdictParagraph }}
        </p>
        <p class="text-body-sm text-rs-muted mt-2">
          Rates last updated: {{ content.lastUpdated || seoUpdatedLabel }}.
          Data sourced from provider APIs.
          <NuxtLink to="/methodology" class="font-semibold text-brand-600 hover:text-brand-500 underline underline-offset-2">
            See methodology
          </NuxtLink>
        </p>
      </div>
    </section>
```

**Step 3: Verify in dev**

Run: `cd frontend && pnpm dev`
Navigate to `http://localhost:3000/send-money/united-states-to-mexico`
Expected: Verdict section visible between hero and compare section when quotes load.

**Step 4: Verify SSR output**

Run: `curl -s http://localhost:3000/send-money/united-states-to-mexico | grep -c "cheapest way to send"`
Expected: 1 (confirms server-rendered)

**Step 5: Commit**

```bash
git add frontend/pages/send-money/\[from\]-to-\[to\].vue
git commit -m "feat(frontend): add SEO verdict block to corridor page

Server-rendered extractable answer paragraph for LLM crawlers.
Uses existing computed data (cheapestProvider, fastestProvider, providerCount).
Guarded by hasApiQuotes to only show when live data is available."
```

---

### Task 2: Add SR-only semantic comparison table

**Files:**
- Modify: `frontend/pages/send-money/[from]-to-[to].vue` (template, insert after the verdict section from Task 1, inside the same `<section>`)

**Step 1: Add the sr-only table inside the verdict section**

Expand the verdict section from Task 1 to include a semantic `<table>` below the paragraph. Insert before the closing `</div></section>` of the verdict block:

```html
        <table
          v-if="content.table.rows.length"
          class="sr-only"
          :aria-label="`Top providers for ${content.from} to ${content.to} transfers`"
        >
          <caption>Top {{ Math.min(content.table.rows.length, 5) }} money transfer providers: {{ content.from }} to {{ content.to }} ({{ fromCurrencyCode }} {{ displayAmount.toLocaleString() }})</caption>
          <thead>
            <tr>
              <th scope="col">Provider</th>
              <th scope="col">Fee</th>
              <th scope="col">Exchange Rate</th>
              <th scope="col">Recipient Gets</th>
              <th scope="col">Delivery Speed</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in content.table.rows.slice(0, 5)" :key="row.provider">
              <td>{{ row.provider }}</td>
              <td>{{ row.fee }}</td>
              <td>{{ row.rate }}</td>
              <td>{{ row.recipientGets }}</td>
              <td>{{ row.speed }}</td>
            </tr>
          </tbody>
        </table>
```

**Step 2: Verify sr-only class exists in Tailwind**

The `sr-only` utility is built into Tailwind CSS. Confirm by checking dev tools: the table should be visually hidden but present in the DOM/SSR output.

**Step 3: Verify SSR output includes the table**

Run: `curl -s http://localhost:3000/send-money/united-states-to-mexico | grep -c 'class="sr-only"'`
Expected: >= 1

**Step 4: Commit**

```bash
git add frontend/pages/send-money/\[from\]-to-\[to\].vue
git commit -m "feat(frontend): add sr-only semantic table for LLM crawlers

Visually hidden but crawlable HTML <table> with top 5 providers.
Uses semantic elements (caption, th, scope) for accessibility and extraction."
```

---

### Task 3: Expand corridor FAQs with live data

**Files:**
- Modify: `frontend/pages/send-money/[from]-to-[to].vue` (script, `defaultCorridorFaqs` computed at ~line 3620)

**Step 1: Add 3 live-data-aware FAQ items**

Expand the `defaultCorridorFaqs` computed to append 3 new entries after the existing 5. Add these items to the end of the returned array:

```typescript
  {
    q: `Which provider has the best exchange rate for ${fromCurrencyCode.value} to ${toCurrencyCode.value}?`,
    a: bestRateLabel.value && bestQuote.value
      ? `As of ${seoUpdatedLabel.value}, ${bestQuote.value.name} offers the best exchange rate at ${bestRateLabel.value}. Exchange rates change frequently — use our live comparison above to check the latest.`
      : `Exchange rates change frequently. Use our live comparison tool above to check which provider currently offers the best ${fromCurrencyCode.value} to ${toCurrencyCode.value} rate.`,
  },
  {
    q: `How many providers support ${content.value.from} to ${content.value.to} transfers?`,
    a: providerCount.value
      ? `We currently compare ${providerCount.value} providers for transfers from ${content.value.from} to ${content.value.to}. The number of available providers can vary depending on the transfer amount and delivery method.`
      : `Multiple providers support transfers from ${content.value.from} to ${content.value.to}. Use the comparison tool above to see all currently available options.`,
  },
  {
    q: `Can I send money from ${content.value.from} to ${content.value.to} for cash pickup?`,
    a: (() => {
      const cashProviders = content.value.table.rows
        .filter(row => (row.payOut || '').toLowerCase().includes('cash'))
        .map(row => row.provider)
      if (cashProviders.length) {
        return `Yes. ${cashProviders.slice(0, 3).join(', ')}${cashProviders.length > 3 ? ` and ${cashProviders.length - 3} more` : ''} offer cash pickup for ${content.value.from} to ${content.value.to} transfers. Check each provider for pickup location availability.`
      }
      return `Cash pickup availability for ${content.value.from} to ${content.value.to} depends on the provider and destination. Check the delivery methods column in our comparison above.`
    })(),
  },
```

**Step 2: Verify FAQ count increased**

Run: `cd frontend && pnpm dev`
Navigate to corridor page, scroll to FAQ section.
Expected: 8 FAQ items instead of 5.

**Step 3: Verify JSON-LD FAQ schema includes new items**

View page source, search for `FAQPage`. The JSON-LD should contain 8 `mainEntity` items.

**Step 4: Commit**

```bash
git add frontend/pages/send-money/\[from\]-to-\[to\].vue
git commit -m "feat(frontend): expand corridor FAQs with live data answers

Add 3 data-driven FAQ items: best exchange rate provider, provider count,
and cash pickup availability. Feeds into existing jsonLdFaq() schema."
```

---

### Task 4: Add visible freshness timestamp

**Files:**
- Modify: `frontend/pages/send-money/[from]-to-[to].vue` (template, after the Live Insights Grid at ~line 1233)

**Step 1: Add freshness line after insights grid**

Insert after the closing `</div>` of the insights grid (`grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8` at ~line 1233) and before `<!-- Provider Comparison -->` at ~line 1235:

```html
        <p
          v-if="content.lastUpdated || seoUpdatedLabel"
          class="text-body-sm text-rs-muted mb-6"
        >
          Rates last updated: {{ content.lastUpdated || seoUpdatedLabel }}.
          Comparing {{ providerCount }} provider{{ providerCount === 1 ? '' : 's' }} for {{ fromCurrencyCode }} {{ displayAmount.toLocaleString() }} to {{ toCurrencyCode }}.
        </p>
```

**Step 2: Pass `lastUpdated` to existing structured data schemas**

In the `addRemittanceCorridorSchema` call (~line 3939), add `lastUpdated`:

```typescript
  addRemittanceCorridorSchema({
    from: content.value.from,
    to: content.value.to,
    providers: corridorSchemaProviders.value,
    bestRate: bestRateLabel.value,
    lastUpdated: new Date().toISOString(),
  })
```

**Step 3: Verify timestamp visible**

Run: `cd frontend && pnpm dev`
Navigate to corridor page, scroll below the insights grid.
Expected: "Rates last updated: just now. Comparing N providers for USD 500 to MXN."

**Step 4: Commit**

```bash
git add frontend/pages/send-money/\[from\]-to-\[to\].vue
git commit -m "feat(frontend): add visible freshness timestamp to corridor page

Shows 'Rates last updated' line below insights grid.
Passes lastUpdated to RemittanceCorridorSchema for dateModified in JSON-LD."
```

---

### Task 5: Run tests, lint, type-check for Phase 2

**Files:**
- Test: `frontend/tests/` (all existing tests)

**Step 1: Run tests**

Run: `cd frontend && pnpm test -- --run`
Expected: All tests pass (114+ tests).

**Step 2: Run lint**

Run: `cd frontend && pnpm lint`
Expected: No errors.

**Step 3: Run type-check**

Run: `cd frontend && pnpm type-check`
Expected: No type errors.

**Step 4: Fix any failures**

If tests/lint/types fail, fix and re-run. Commit fixes separately.

**Step 5: Commit any fixes**

```bash
git add <fixed-files>
git commit -m "fix(frontend): resolve lint/type issues from Phase 2 SEO changes"
```

---

## Phase 3: Incremental Best-Of Pages

### Task 6: Create best-corridor slug mapping utility

**Files:**
- Create: `frontend/utils/best-corridor-slugs.ts`
- Modify: `frontend/server/utils/seo-constants.ts` (add `BEST_CORRIDOR_SLUGS`)

**Step 1: Add the slug list to seo-constants**

Append to `frontend/server/utils/seo-constants.ts`:

```typescript
// Best-of corridor page slugs — maps URL slug to {from, to} country codes.
// Start with 12 high-traffic corridors. Expand after staging validation.
export const BEST_CORRIDOR_SLUGS = [
  { slug: 'money-transfer-us-to-mexico', from: 'US', to: 'MX' },
  { slug: 'money-transfer-us-to-india', from: 'US', to: 'IN' },
  { slug: 'money-transfer-us-to-philippines', from: 'US', to: 'PH' },
  { slug: 'money-transfer-us-to-nigeria', from: 'US', to: 'NG' },
  { slug: 'money-transfer-us-to-pakistan', from: 'US', to: 'PK' },
  { slug: 'money-transfer-uk-to-india', from: 'GB', to: 'IN' },
  { slug: 'money-transfer-uk-to-nigeria', from: 'GB', to: 'NG' },
  { slug: 'money-transfer-uk-to-pakistan', from: 'GB', to: 'PK' },
  { slug: 'money-transfer-canada-to-india', from: 'CA', to: 'IN' },
  { slug: 'money-transfer-canada-to-philippines', from: 'CA', to: 'PH' },
  { slug: 'money-transfer-uae-to-india', from: 'AE', to: 'IN' },
  { slug: 'money-transfer-australia-to-india', from: 'AU', to: 'IN' },
] as const
```

**Step 2: Create the utility file**

Create `frontend/utils/best-corridor-slugs.ts`:

```typescript
/**
 * Best-of corridor slug mapping
 *
 * Maps URL slugs like "money-transfer-us-to-mexico" to corridor params.
 * Used by /best/[corridor].vue and /best/index.vue.
 */

import { BEST_CORRIDOR_SLUGS } from '~/server/utils/seo-constants'

export type BestCorridorEntry = typeof BEST_CORRIDOR_SLUGS[number]

const slugMap = new Map(
  BEST_CORRIDOR_SLUGS.map(entry => [entry.slug, entry]),
)

export const getBestCorridorBySlug = (slug: string): BestCorridorEntry | undefined => {
  return slugMap.get(slug.toLowerCase())
}

export const getAllBestCorridorSlugs = (): readonly BestCorridorEntry[] => {
  return BEST_CORRIDOR_SLUGS
}
```

**Step 3: Verify import resolves**

Run: `cd frontend && pnpm type-check`
Expected: No import resolution errors.

**Step 4: Commit**

```bash
git add frontend/utils/best-corridor-slugs.ts frontend/server/utils/seo-constants.ts
git commit -m "feat(frontend): add best-corridor slug mapping for /best/ pages

12 high-traffic corridors: US, UK, CA, AE, AU outbound.
Shared constant in seo-constants.ts, utility in utils/best-corridor-slugs.ts."
```

---

### Task 7: Create best-of page template

**Files:**
- Create: `frontend/pages/best/[corridor].vue`

This is the core editorial page. It's a thin wrapper that fetches corridor data from the same API endpoint as the corridor comparison page, then renders it in an editorial "best of" format.

**Step 1: Create the page file**

Create `frontend/pages/best/[corridor].vue`:

```vue
<script setup lang="ts">
import { getBestCorridorBySlug } from '~/utils/best-corridor-slugs'
import { getCorridorUrl, CODE_TO_SLUG } from '~/utils/country-slugs'
import { PROVIDER_SCORES, getProviderScore } from '~/lib/providerScores'

const route = useRoute()
const slug = computed(() => String(route.params.corridor || ''))

const corridor = computed(() => getBestCorridorBySlug(slug.value))

if (!corridor.value) {
  throw createError({ statusCode: 404, statusMessage: 'Corridor not found' })
}

const fromCode = computed(() => corridor.value!.from)
const toCode = computed(() => corridor.value!.to)
const fromSlug = computed(() => CODE_TO_SLUG[fromCode.value] || fromCode.value.toLowerCase())
const toSlug = computed(() => CODE_TO_SLUG[toCode.value] || toCode.value.toLowerCase())
const fromName = computed(() => fromSlug.value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
const toName = computed(() => toSlug.value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))

const corridorUrl = computed(() => getCorridorUrl(fromCode.value, toCode.value))
const currentYear = new Date().getFullYear()

// Fetch quotes from the same API the corridor page uses
const { data: quotesData } = await useFetch(`/api/v1/quotes`, {
  params: {
    from: fromCode,
    to: toCode,
    amount: 500,
  },
  server: true,
})

const quotes = computed(() => {
  const raw = quotesData.value as { quotes?: Array<Record<string, unknown>> } | null
  return (raw?.quotes || []) as Array<{
    name: string
    id: string
    fee: number
    fxRate: number
    recipientGets: number
    delivery: string
    bestFor?: string
    isAffiliate?: boolean
    affiliateUrl?: string
  }>
})

const topQuotes = computed(() => quotes.value.slice(0, 5))

const midMarketRate = computed(() => {
  const rate = (quotesData.value as { midMarketRate?: number } | null)?.midMarketRate
  return typeof rate === 'number' && Number.isFinite(rate) ? rate : null
})

const fromCurrency = computed(() => {
  const ccy = (quotesData.value as { fromCurrency?: string } | null)?.fromCurrency
  return ccy || 'USD'
})

const toCurrency = computed(() => {
  const ccy = (quotesData.value as { toCurrency?: string } | null)?.toCurrency
  return ccy || ''
})

const formatMoney = (amount: number, currency: string) => {
  if (!Number.isFinite(amount)) return '—'
  return `${currency} ${amount.toFixed(2)}`
}

const verdictText = computed(() => {
  if (!topQuotes.value.length) return ''
  const best = topQuotes.value[0]
  const count = quotes.value.length
  const fastest = [...quotes.value].sort((a, b) => {
    const getHours = (d: string) => {
      const l = d.toLowerCase()
      if (l.includes('instant') || l.includes('minute')) return 0
      if (l.includes('hour')) return 1
      if (l.includes('same day')) return 4
      return 24
    }
    return getHours(a.delivery) - getHours(b.delivery)
  })[0]

  let text = `We compared ${count} providers for ${fromName.value}-to-${toName.value} transfers. ${best.name} offers the lowest total cost for a $500 transfer (${formatMoney(best.fee, fromCurrency.value)} fee, recipient gets ${toCurrency.value} ${best.recipientGets.toLocaleString()}).`
  if (fastest && fastest.name !== best.name) {
    text += ` ${fastest.name} is best for speed with ${fastest.delivery} delivery.`
  }
  return text
})

const lastReviewed = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

// SEO
const { setSeo } = useSeo()
const normalizedSiteUrl = useRuntimeConfig().public.siteUrl?.replace(/\/$/, '') || 'https://remitscout.com'

setSeo({
  title: `Best Money Transfer Services: ${fromName.value} to ${toName.value} (${currentYear})`,
  description: verdictText.value || `Compare the best money transfer providers for sending money from ${fromName.value} to ${toName.value}. Independent rankings based on total cost, speed, and trust.`,
  canonical: `${normalizedSiteUrl}/best/${slug.value}`,
  ogImage: false,
})

// Structured data
const { addBreadcrumbSchema, addProviderListSchema, addFAQSchema } = useStructuredData()

addBreadcrumbSchema([
  { name: 'Home', url: normalizedSiteUrl },
  { name: 'Best Money Transfers', url: `${normalizedSiteUrl}/best` },
  { name: `${fromName.value} to ${toName.value}`, url: `${normalizedSiteUrl}/best/${slug.value}` },
])

watchEffect(() => {
  if (!topQuotes.value.length) return
  addProviderListSchema(
    topQuotes.value.map(q => ({
      provider: q.name,
      areaServed: toName.value,
      price: String(q.fee),
      priceCurrency: fromCurrency.value,
      deliveryTime: q.delivery || undefined,
      exchangeRate: q.fxRate ? String(q.fxRate) : undefined,
    })),
    `Best Money Transfer Providers: ${fromName.value} to ${toName.value}`,
  )
})

const faqs = computed(() => [
  {
    question: `What is the cheapest way to send money from ${fromName.value} to ${toName.value}?`,
    answer: topQuotes.value.length
      ? `${topQuotes.value[0].name} currently offers the lowest total cost for a $500 transfer from ${fromName.value} to ${toName.value}, with a fee of ${formatMoney(topQuotes.value[0].fee, fromCurrency.value)}.`
      : `Compare providers using our live comparison tool to find the cheapest option.`,
  },
  {
    question: `How many providers offer ${fromName.value} to ${toName.value} transfers?`,
    answer: `We currently compare ${quotes.value.length} providers for transfers from ${fromName.value} to ${toName.value}.`,
  },
  {
    question: `How long does it take to send money from ${fromName.value} to ${toName.value}?`,
    answer: `Delivery times vary by provider and method. Some providers offer instant or same-day delivery, while bank transfers typically take 1-3 business days.`,
  },
])

watchEffect(() => {
  if (faqs.value.length) {
    addFAQSchema(faqs.value)
  }
})
</script>

<template>
  <div class="bg-surface min-h-screen">
    <!-- Breadcrumb -->
    <nav class="container pt-6 pb-2" aria-label="Breadcrumb">
      <ol class="flex items-center gap-2 text-body-sm text-rs-muted">
        <li><NuxtLink to="/" class="hover:text-brand-600">Home</NuxtLink></li>
        <li class="text-neutral-400">/</li>
        <li><NuxtLink to="/best" class="hover:text-brand-600">Best Money Transfers</NuxtLink></li>
        <li class="text-neutral-400">/</li>
        <li class="text-rs-fg font-medium">{{ fromName }} to {{ toName }}</li>
      </ol>
    </nav>

    <!-- Hero -->
    <header class="container py-8">
      <h1 class="text-h1 font-black text-rs-fg tracking-tight">
        Best Money Transfer Services: {{ fromName }} to {{ toName }} ({{ currentYear }})
      </h1>
      <p
        v-if="verdictText"
        class="text-body-lg text-neutral-700 mt-4 max-w-3xl"
      >
        {{ verdictText }}
      </p>
      <p class="text-body-sm text-rs-muted mt-2">
        Last reviewed: {{ lastReviewed }}
      </p>
    </header>

    <!-- Comparison Table -->
    <section v-if="topQuotes.length" class="container pb-8">
      <h2 class="text-h2 font-bold text-rs-fg mb-4">
        Top {{ topQuotes.length }} Providers Compared
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <caption class="sr-only">
            Top money transfer providers for {{ fromName }} to {{ toName }} ($500)
          </caption>
          <thead>
            <tr class="border-b-2 border-neutral-200">
              <th scope="col" class="py-3 pr-4 text-body-sm font-semibold text-rs-muted">#</th>
              <th scope="col" class="py-3 pr-4 text-body-sm font-semibold text-rs-muted">Provider</th>
              <th scope="col" class="py-3 pr-4 text-body-sm font-semibold text-rs-muted">Fee</th>
              <th scope="col" class="py-3 pr-4 text-body-sm font-semibold text-rs-muted">Exchange Rate</th>
              <th scope="col" class="py-3 pr-4 text-body-sm font-semibold text-rs-muted">Recipient Gets</th>
              <th scope="col" class="py-3 text-body-sm font-semibold text-rs-muted">Speed</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(quote, idx) in topQuotes"
              :key="quote.id"
              class="border-b border-neutral-100"
              :class="idx === 0 ? 'bg-brand-50' : ''"
            >
              <td class="py-4 pr-4 text-body font-bold text-rs-fg">{{ idx + 1 }}</td>
              <td class="py-4 pr-4 text-body font-semibold text-rs-fg">{{ quote.name }}</td>
              <td class="py-4 pr-4 text-body text-neutral-700">{{ formatMoney(quote.fee, fromCurrency) }}</td>
              <td class="py-4 pr-4 text-body text-neutral-700">{{ quote.fxRate.toFixed(4) }}</td>
              <td class="py-4 pr-4 text-body font-semibold text-brand-600">{{ toCurrency }} {{ quote.recipientGets.toLocaleString() }}</td>
              <td class="py-4 text-body text-neutral-700">{{ quote.delivery || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-body-sm text-rs-muted mt-3">
        Based on a {{ fromCurrency }} 500 transfer.
        <NuxtLink :to="corridorUrl" class="font-semibold text-brand-600 hover:text-brand-500 underline underline-offset-2">
          View live comparison →
        </NuxtLink>
      </p>
    </section>

    <!-- Mini Reviews -->
    <section v-if="topQuotes.length" class="container pb-8">
      <h2 class="text-h2 font-bold text-rs-fg mb-6">
        Provider Reviews
      </h2>
      <div class="space-y-6">
        <div
          v-for="(quote, idx) in topQuotes"
          :key="quote.id"
          class="rounded-xl border border-rs-border bg-surface p-6"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-body-lg font-bold text-rs-fg">
                {{ idx + 1 }}. {{ quote.name }}
              </h3>
              <p class="text-body text-neutral-700 mt-2">
                {{ quote.name }} charges {{ formatMoney(quote.fee, fromCurrency) }} to send {{ fromCurrency }} 500 from {{ fromName }} to {{ toName }}, with a rate of {{ quote.fxRate.toFixed(4) }} {{ toCurrency }}/{{ fromCurrency }}.
                Recipient gets {{ toCurrency }} {{ quote.recipientGets.toLocaleString() }}.
                {{ quote.delivery ? `Delivery: ${quote.delivery}.` : '' }}
              </p>
            </div>
            <div v-if="getProviderScore(quote.id)" class="text-right flex-shrink-0">
              <p class="text-body-sm text-rs-muted">Remit-Score</p>
              <p class="text-h3 font-black text-brand-600">{{ getProviderScore(quote.id)?.remitScore }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section v-if="faqs.length" class="bg-neutral-50 border-t border-neutral-200">
      <div class="container py-12">
        <h2 class="text-h2 font-bold text-rs-fg mb-6">
          Frequently Asked Questions
        </h2>
        <div class="space-y-4 max-w-3xl">
          <details
            v-for="faq in faqs"
            :key="faq.question"
            class="rounded-xl border border-rs-border bg-surface p-5 group"
          >
            <summary class="text-body font-semibold text-rs-fg cursor-pointer list-none flex items-center justify-between">
              {{ faq.question }}
              <svg class="w-5 h-5 text-rs-muted group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p class="text-body text-neutral-700 mt-3">
              {{ faq.answer }}
            </p>
          </details>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="container py-12 text-center">
      <h2 class="text-h2 font-bold text-rs-fg mb-3">
        Ready to send money?
      </h2>
      <p class="text-body text-neutral-700 mb-6 max-w-xl mx-auto">
        Compare live rates from {{ quotes.length }} providers and find the best deal for your {{ fromName }} to {{ toName }} transfer.
      </p>
      <NuxtLink
        :to="corridorUrl"
        class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-body font-semibold text-white hover:bg-brand-700 transition-colors"
      >
        Compare live rates →
      </NuxtLink>
    </section>
  </div>
</template>
```

**Step 2: Verify page renders**

Run: `cd frontend && pnpm dev`
Navigate to `http://localhost:3000/best/money-transfer-us-to-mexico`
Expected: Editorial page with comparison table, mini reviews, FAQs, CTA.

**Step 3: Verify 404 for invalid slugs**

Navigate to `http://localhost:3000/best/nonexistent-corridor`
Expected: 404 page.

**Step 4: Commit**

```bash
git add frontend/pages/best/\[corridor\].vue
git commit -m "feat(frontend): add best-of page template for editorial corridor content

Thin wrapper page at /best/[corridor] reusing corridor API data.
Includes: editorial verdict, semantic comparison table, mini reviews,
FAQ with schema, breadcrumb schema, CTA linking to live comparison.
12 corridors supported via BEST_CORRIDOR_SLUGS."
```

---

### Task 8: Create best-of hub page

**Files:**
- Create: `frontend/pages/best/index.vue`

**Step 1: Create the hub page**

Create `frontend/pages/best/index.vue`:

```vue
<script setup lang="ts">
import { getAllBestCorridorSlugs } from '~/utils/best-corridor-slugs'
import { CODE_TO_SLUG } from '~/utils/country-slugs'

const corridors = getAllBestCorridorSlugs()

const fromLabel = (code: string) => {
  const slug = CODE_TO_SLUG[code] || code.toLowerCase()
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const currentYear = new Date().getFullYear()

const { setSeo } = useSeo()
const normalizedSiteUrl = useRuntimeConfig().public.siteUrl?.replace(/\/$/, '') || 'https://remitscout.com'

setSeo({
  title: `Best Money Transfer Services (${currentYear}) | Remit-Scout`,
  description: 'Compare the best money transfer providers across popular corridors. Independent rankings based on total cost, speed, and trust score.',
  canonical: `${normalizedSiteUrl}/best`,
  ogImage: false,
})

const { addBreadcrumbSchema } = useStructuredData()
addBreadcrumbSchema([
  { name: 'Home', url: normalizedSiteUrl },
  { name: 'Best Money Transfers', url: `${normalizedSiteUrl}/best` },
])

// Group corridors by source country
const grouped = computed(() => {
  const map = new Map<string, typeof corridors[number][]>()
  for (const c of corridors) {
    const list = map.get(c.from) || []
    list.push(c)
    map.set(c.from, list)
  }
  return Array.from(map.entries()).map(([from, entries]) => ({
    from,
    fromName: fromLabel(from),
    entries,
  }))
})
</script>

<template>
  <div class="bg-surface min-h-screen">
    <nav class="container pt-6 pb-2" aria-label="Breadcrumb">
      <ol class="flex items-center gap-2 text-body-sm text-rs-muted">
        <li><NuxtLink to="/" class="hover:text-brand-600">Home</NuxtLink></li>
        <li class="text-neutral-400">/</li>
        <li class="text-rs-fg font-medium">Best Money Transfers</li>
      </ol>
    </nav>

    <header class="container py-8">
      <h1 class="text-h1 font-black text-rs-fg tracking-tight">
        Best Money Transfer Services ({{ currentYear }})
      </h1>
      <p class="text-body-lg text-neutral-700 mt-4 max-w-3xl">
        Independent rankings of the best money transfer providers across popular corridors.
        Based on total cost, delivery speed, and trust score from live provider data.
      </p>
    </header>

    <section class="container pb-12">
      <div
        v-for="group in grouped"
        :key="group.from"
        class="mb-10"
      >
        <h2 class="text-h2 font-bold text-rs-fg mb-4">
          From {{ group.fromName }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink
            v-for="entry in group.entries"
            :key="entry.slug"
            :to="`/best/${entry.slug}`"
            class="rounded-xl border border-rs-border bg-surface p-5 hover:border-brand-300 hover:shadow-md transition-all group"
          >
            <h3 class="text-body font-semibold text-rs-fg group-hover:text-brand-600 transition-colors">
              {{ fromLabel(entry.from) }} → {{ fromLabel(entry.to) }}
            </h3>
            <p class="text-body-sm text-rs-muted mt-1">
              Best providers for {{ fromLabel(entry.from) }} to {{ fromLabel(entry.to) }} transfers
            </p>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
```

**Step 2: Verify hub page renders**

Navigate to `http://localhost:3000/best`
Expected: Grouped list of corridor links.

**Step 3: Commit**

```bash
git add frontend/pages/best/index.vue
git commit -m "feat(frontend): add best-of hub page listing all corridor guides

Groups 12 corridors by source country with links to editorial pages.
Includes breadcrumb schema and proper SEO meta tags."
```

---

### Task 9: Add best-of pages and expanded comparisons to sitemap

**Files:**
- Modify: `frontend/server/routes/sitemap.xml.ts`
- Modify: `frontend/server/utils/seo-constants.ts` (expand `PROVIDER_COMPARISONS`)

**Step 1: Expand provider comparisons**

In `frontend/server/utils/seo-constants.ts`, expand the `PROVIDER_COMPARISONS` array:

```typescript
export const PROVIDER_COMPARISONS = [
  'wise-vs-remitly',
  'wise-vs-western-union',
  'wise-vs-xoom',
  'remitly-vs-western-union',
  'remitly-vs-xoom',
  'wise-vs-worldremit',
  'western-union-vs-ria',
  'remitly-vs-worldremit',
  'wise-vs-xe-money',
  'western-union-vs-xoom',
] as const
```

**Step 2: Add best-of pages to sitemap**

In `frontend/server/routes/sitemap.xml.ts`, add imports and page entries.

Add import:
```typescript
import { BEST_CORRIDOR_SLUGS } from '~/server/utils/seo-constants'
```

Add best-of pages after `corridorPages` (around line 100):

```typescript
  // Best-of editorial pages - high priority, daily updates
  const bestOfPages = BEST_CORRIDOR_SLUGS.map(entry => ({
    path: `/best/${entry.slug}`,
    priority: '0.9',
    changefreq: 'daily' as const,
  }))

  // Best-of hub page
  const bestOfHub = [{ path: '/best', priority: '0.8', changefreq: 'weekly' as const }]
```

Add to `allPages` array (around line 116):

```typescript
  const allPages = [
    homepage,
    ...highPriorityPages,
    ...importantPages,
    ...legalPages,
    ...learnGuides,
    ...exchangeRatePairs,
    ...providerReviews,
    ...providerComparisons,
    ...corridorPages,
    ...bestOfHub,
    ...bestOfPages,
    ...countryPages,
    ...pulseCharts,
  ]
```

**Step 3: Verify sitemap includes new pages**

Run: `cd frontend && pnpm dev`
Then: `curl -s http://localhost:3000/sitemap.xml | grep "/best/" | head -5`
Expected: Entries like `<loc>https://remitscout.com/best/money-transfer-us-to-mexico</loc>`

Also: `curl -s http://localhost:3000/sitemap.xml | grep -c "/compare/"`
Expected: 10 (up from 4)

**Step 4: Commit**

```bash
git add frontend/server/routes/sitemap.xml.ts frontend/server/utils/seo-constants.ts
git commit -m "feat(frontend): add best-of pages and expanded comparisons to sitemap

Add 12 best-of corridor pages and hub to sitemap (priority 0.9, daily).
Expand provider comparisons from 4 to 10 validated slug pairs."
```

---

### Task 10: Add tests for Phase 3

**Files:**
- Create: `frontend/tests/seo/best-corridor-slugs.test.ts`
- Modify: `frontend/tests/seo/sitemap.test.ts` (add best-of assertions)

**Step 1: Create slug mapping tests**

Create `frontend/tests/seo/best-corridor-slugs.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { BEST_CORRIDOR_SLUGS } from '~/server/utils/seo-constants'

describe('BEST_CORRIDOR_SLUGS', () => {
  it('contains 12 corridor entries', () => {
    expect(BEST_CORRIDOR_SLUGS.length).toBe(12)
  })

  it('all slugs are unique', () => {
    const slugs = BEST_CORRIDOR_SLUGS.map(e => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('all slugs follow the naming convention', () => {
    for (const entry of BEST_CORRIDOR_SLUGS) {
      expect(entry.slug).toMatch(/^money-transfer-[a-z]+-to-[a-z]+$/)
    }
  })

  it('all entries have valid 2-letter country codes', () => {
    for (const entry of BEST_CORRIDOR_SLUGS) {
      expect(entry.from).toMatch(/^[A-Z]{2}$/)
      expect(entry.to).toMatch(/^[A-Z]{2}$/)
    }
  })
})
```

**Step 2: Add sitemap assertions for best-of pages**

In `frontend/tests/seo/sitemap.test.ts`, add a test case that verifies the sitemap builder includes `/best/` entries. (Exact additions depend on the existing test structure — add a new `it()` block.)

**Step 3: Run tests**

Run: `cd frontend && pnpm test -- --run`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add frontend/tests/seo/best-corridor-slugs.test.ts frontend/tests/seo/sitemap.test.ts
git commit -m "test(frontend): add tests for best-of corridor slugs and sitemap entries

Verify slug uniqueness, naming convention, country codes.
Verify sitemap includes /best/ pages."
```

---

### Task 11: Run full verification for Phase 2+3

**Files:**
- Test: all frontend tests
- Lint: frontend lint
- Type check: frontend type-check

**Step 1: Run tests**

Run: `cd frontend && pnpm test -- --run`
Expected: All tests pass.

**Step 2: Run lint**

Run: `cd frontend && pnpm lint`
Expected: No errors.

**Step 3: Run type-check**

Run: `cd frontend && pnpm type-check`
Expected: No type errors.

**Step 4: Fix any failures and commit fixes**

If anything fails, fix and commit separately.

**Step 5: Final SSR verification checklist**

```bash
# Phase 2: Verdict block
curl -s http://localhost:3000/send-money/united-states-to-mexico | grep "cheapest way to send"

# Phase 2: SR-only table
curl -s http://localhost:3000/send-money/united-states-to-mexico | grep 'class="sr-only"'

# Phase 2: FAQ count (should be 8)
curl -s http://localhost:3000/send-money/united-states-to-mexico | grep -c "acceptedAnswer"

# Phase 3: Best-of page
curl -s http://localhost:3000/best/money-transfer-us-to-mexico | grep "Best Money Transfer"

# Phase 3: Hub page
curl -s http://localhost:3000/best | grep "Best Money Transfer Services"

# Phase 3: Sitemap
curl -s http://localhost:3000/sitemap.xml | grep -c "/best/"
```

---

## Summary

| Task | Phase | What | Files |
|------|-------|------|-------|
| 1 | 2 | SEO verdict block | `[from]-to-[to].vue` |
| 2 | 2 | SR-only semantic table | `[from]-to-[to].vue` |
| 3 | 2 | Expand corridor FAQs | `[from]-to-[to].vue` |
| 4 | 2 | Visible freshness timestamp | `[from]-to-[to].vue` |
| 5 | 2 | Phase 2 verification | Tests, lint, types |
| 6 | 3 | Best-corridor slug mapping | `seo-constants.ts`, `best-corridor-slugs.ts` |
| 7 | 3 | Best-of page template | `best/[corridor].vue` |
| 8 | 3 | Best-of hub page | `best/index.vue` |
| 9 | 3 | Sitemap + comparison expansion | `sitemap.xml.ts`, `seo-constants.ts` |
| 10 | 3 | Phase 3 tests | `best-corridor-slugs.test.ts`, `sitemap.test.ts` |
| 11 | 3 | Full verification | All tests, lint, types, SSR |
