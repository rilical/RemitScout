# Remit-Scout V2

Repository for Remit-Scout V2 across Plane A (product backbone), Plane B (ingestion and truth), and Plane C (publishing and data products).

## Documentation
- API contracts live in `docs/openapi/`.
- AWS migration and infra notes live in `docs/aws/aws-native-migration-gap-analysis.md`.
- The RSE manual and operational runbooks live in Confluence (source of truth).
- Backend implementation notes live in `backend/README.md`.

## Compliance by Construction
This repo uses lint rules, CI checks, and contribution guidelines to enforce the Golden Rule: raw data never leaves Plane B.

## Local Development (Docker)
Prereqs:
- Node `>=20.19.0` (repo pin: `.nvmrc`; optional: Volta via `package.json`)
- pnpm (repo pin: `package.json#packageManager`)

1) Start Postgres + Redis:
```
docker-compose up -d
```

2) Create backend env file:
```
cp backend/.env.local.example backend/.env.local
```

Supabase/Stripe test config (local):
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> # optional for admin actions
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PLUS=price_...
STRIPE_PRICE_ID_PLUS_ANNUAL=price_...
```
Use `Authorization: Bearer <access_token>` from Supabase auth for protected endpoints (see `docs/manual-smoke-test-alerts-dev.md`).

3) Run migrations and seed local data:
```
ENV_FILE=.env.local pnpm -C backend db:migrate
ENV_FILE=.env.local pnpm -C backend db:seed:local
```

4) Start Plane C and Plane A:
```
ENV_FILE=.env.local pnpm -C backend dev:plane-c
ENV_FILE=.env.local pnpm -C backend dev:plane-a
```

Optional: run ingestion manually (live scraping):
```
ENV_FILE=.env.local pnpm -C backend dev:plane-b
```

Frontend proxy:
```
API_BASE=http://localhost:4000 pnpm -C frontend dev
```

Smoke check:
```
curl http://localhost:4000/healthz
curl "http://localhost:4000/api/v1/quotes/current?corridor_id=US-MX-USD-MXN&amount=500&payin=bank_transfer&payout=bank_deposit"
```

If you want to use a different env file, set `ENV_FILE` (e.g. `ENV_FILE=.env.staging`).

## Staging (develop)
- Backend: `backend/.env.staging.example`
- Frontend: `frontend/.env.staging.example`

Switch via:
```
ENV_FILE=.env.staging NODE_ENV=staging pnpm -C backend dev:plane-a
```

## Production
- Backing secrets should come from AWS/CI, not checked-in files.
- Use `NODE_ENV=production` and runtime-provided env vars (CDK/Secrets Manager/SSM).

## Frontend Reference

### Reusable Components

This document lists all reusable components that can be used across multiple pages to maintain consistency.

### 🎯 Core Reusable Components

### 1. `CompareWidget.vue`
**Location:** `~/components/shared/CompareWidget.vue`

**Purpose:** Sticky compare widget that allows users to quickly compare money transfer rates.

**Features:**
- Desktop: Sticky top bar below header
- Mobile: Fixed bottom bar (doesn't rely on header position)
- Blue gradient background matching brand colors
- Auto-redirects to `/send-money/[from]-to-[to]` page
- Defaults to USD and $500 amount
- Validates that source and destination countries are different

**Usage:**
```vue
<template>
  <div>
    <CompareWidget />
    <!-- Your page content -->
  </div>
</template>

<script setup>
import CompareWidget from '~/components/shared/CompareWidget.vue'
</script>
```

**When to use:**
- FAQ pages
- Blog posts / guides
- Static content pages
- Anywhere you want to give users quick access to comparison

---

### 2. `TrustMetricsStrip.vue`
**Location:** `~/components/home/TrustMetricsStrip.vue`

**Purpose:** Displays RemitScout statistics and builds trust with users.

**What it shows:**
- 80k+ Users trust us
- $2.5M+ Saved in fees
- 30+ Providers compared
- 150+ Corridors covered

**Features:**
- Blue gradient background (`bg-brand-600`)
- 4-column responsive grid (2 cols on mobile, 4 on desktop)
- Animated icon boxes
- Link to methodology page
- Statistics pulled from `~/config/stats.ts` (single source of truth)

**Usage:**
```vue
<template>
  <div>
    <!-- Your page content -->
    
    <!-- Add at bottom of page before footer -->
    <TrustMetricsStrip />
  </div>
</template>

<script setup>
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
</script>
```

**When to use:**
- Bottom of FAQ pages
- Bottom of guide/blog pages
- Landing pages
- Any page where you want to build trust

---

### 📊 Statistics Configuration

All site statistics are centralized in:
**`~/config/stats.ts`**

This ensures consistency across the entire site. Update values in one place, and they'll reflect everywhere.

**Current stats:**
```typescript
export const SITE_STATS = {
  totalSaved: { display: '$2.5M+', label: 'Saved in fees' },
  users: { display: '80k+', label: 'Users trust us' },
  providers: { display: '30+', label: 'Providers compared' },
  corridors: { display: '150+', label: 'Corridors covered' },
}
```

---

### 🎨 Styling Consistency

Both components use:
- **Blue gradient:** `bg-gradient-to-r from-blue-600 to-blue-700`
- **White on blue:** High contrast for accessibility
- **Rounded corners:** Modern, friendly design
- **Shadows:** Depth and elevation
- **Responsive:** Mobile-first approach

---

### 📱 Mobile Considerations

### CompareWidget
- **Mobile:** Fixed at bottom (like Monito)
- **Safe area:** Accounts for notched phones
- **Touch targets:** Minimum 48px height for buttons
- **Doesn't interfere:** Content scrolls normally above it

### TrustMetricsStrip
- **Mobile:** 2-column grid
- **Desktop:** 4-column grid
- **Icons:** Large, friendly emoji icons
- **Text:** Scales for readability

---

### ✅ Best Practices

1. **CompareWidget:** Add to top of page template (it positions itself)
2. **TrustMetricsStrip:** Add before closing main content div
3. **Both work together:** CompareWidget drives action, TrustMetrics builds credibility
4. **Add padding for mobile:** Add `pb-20 md:pb-0` to page wrapper to prevent content hiding behind mobile compare bar

---

### 🔄 Example: Complete Page Setup

```vue
<template>
  <div class="min-h-screen bg-white pb-20 md:pb-0">
    <!-- Compare Widget (auto-positions itself) -->
    <CompareWidget />

    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-slate-50 to-white py-12 lg:py-16">
      <div class="container mx-auto px-4">
        <Breadcrumbs :items="breadcrumbItems" />
        <h1>Your Page Title</h1>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-12">
      <!-- Your content here -->
    </div>

    <!-- Trust Metrics at bottom -->
    <TrustMetricsStrip />
  </div>
</template>

<script setup lang="ts">
import CompareWidget from '~/components/shared/CompareWidget.vue'
import TrustMetricsStrip from '~/components/home/TrustMetricsStrip.vue'
import Breadcrumbs from '~/components/shared/Breadcrumbs.vue'

const breadcrumbItems = [
  { name: 'Home', path: '/' },
  { name: 'Your Page', path: '/your-page' }
]
</script>
```

---

### 📝 Notes

- **CompareWidget** is already used on: FAQ page
- **TrustMetricsStrip** is already used on: Home page, FAQ page
- Both components are production-ready and fully responsive
- Update stats in `~/config/stats.ts` to keep all pages in sync

---

**Last Updated:** November 2025
**Maintained by:** RemitScout Development Team


### Compass Navigation

### Overview
The Compass navigation is a journey-first, tabbed mega menu that replaces the traditional navigation with a rich, personalized experience unique to RemitScout.

### Key Features

### 1. **5 Journey-Based Tabs**
- 💸 **Move Money** - "Get the most pesos for your yuan"
- 🏦 **Bank Smarter** - "Accounts that travel with you"
- 📱 **Stay Connected** - "Signal before suitcase"
- 🛡️ **Get Covered** - "Insurance that actually pays"
- 🏡 **Settle In** - "Real-life checklists for day 1, 30, 90"

### 2. **Three-Rail Layout**
Each tab contains:
- **Left Rail**: Primary action + quick access chips + pinned items
- **Middle Rail**: Guides & resources with pin functionality
- **Right Rail**: Location-aware local links

### 3. **Smart Features**

### Pinning System
- Hover any guide link → "📌 Pin" button appears
- Pins persist in localStorage
- "Pinned by you" section shows at top of left rail
- No account required

### Live Rate Glance (Move Money tab only)
- Shows last viewed corridor
- Updates every 30 seconds
- Displays mid-market rate
- Persists in localStorage

### Scoped Search
- Press `/` to focus search
- Searches only within active tab
- Real-time filtering of guides and chips
- ESC to clear and close

### Location Detection
- Auto-detects user's country
- Dynamically replaces `{{country}}` in local links
- Shows "Location detected" badge

### 4. **Accessibility**
- Full ARIA compliance
- Keyboard navigation (Arrow keys, Home, End, ESC)
- Focus trapping within panel
- Screen reader friendly

### 5. **Mobile Experience**
- Full-screen accordion menu
- Tap to expand each section
- Search at top
- Body scroll lock when open

### File Structure

```
config/
  └── compassNav.ts          # Navigation data & configuration

components/nav/
  ├── MegaMenu.vue           # Main container with tab switching
  ├── MegaMenuTab.vue        # 3-rail layout for each tab
  ├── PinButton.vue          # Pin/unpin functionality
  └── RateGlance.vue         # Live rate display

components/nav/
  └── SiteHeader.vue         # Integrated mega menu
```

### LocalStorage Keys

- `remitscout_last_corridor` - Last viewed money transfer corridor
- `remitscout_pinned_items` - Set of pinned item IDs
- `remitscout_pinned_data` - Full pinned item data per tab

### Customization

### Adding New Tabs
Edit `config/compassNav.ts`:

```typescript
{
  id: 'new-tab',
  label: 'New Tab',
  tagline: 'Your catchy tagline',
  icon: '🎯',
  primary: { label: 'Main Action', href: '/path' },
  chips: [...],
  guides: [...],
  local: [...]
}
```

### Dynamic Links
Use `{{country}}` and `{{countrySlug}}` placeholders:

```typescript
{
  label: 'Best eSIMs for {{country}}',
  href: '/connect/esim/{{countrySlug}}',
  dynamic: true
}
```

### Quick Tools (Footer)
Edit `quickTools` array in `config/compassNav.ts`

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `←` `→` | Navigate tabs |
| `Home` | First tab |
| `End` | Last tab |
| `ESC` | Close menu |

### Design Philosophy

### Why This is Different from Monito
1. **Journey-first** vs product-first categorization
2. **Personalization without login** via pins and memory
3. **Live data integration** (rate glance)
4. **Scoped search** per tab, not global
5. **Location-aware** dynamic content
6. **Playful, helpful copy** vs corporate speak

### Copy Principles
- Short, punchy headlines
- Active verbs in guide titles
- Friendly tone (e.g., "Beat the FX spread" not "Understanding Exchange Rates")
- Taglines that sell benefits, not features

### Performance Notes
- Lazy-loads tab content
- Debounced search
- Efficient localStorage reads/writes
- Rate updates only when visible
- No unnecessary re-renders

### Future Enhancements
- [ ] Analytics tracking for pinned items
- [ ] A/B test different tab orders
- [ ] Smart suggestions based on behavior
- [ ] Deep linking to specific tabs
- [ ] Share pinned collections
- [ ] Export/import pinboards

### Testing Checklist
- [ ] All tabs load correctly
- [ ] Search works in each tab
- [ ] Pinning persists across sessions
- [ ] Rate glance updates
- [ ] Location detection works
- [ ] Mobile accordion functions
- [ ] Keyboard navigation smooth
- [ ] Click outside closes menu
- [ ] ESC closes menu
- [ ] / focuses search

### Support
For questions or issues, refer to the component source code or contact the dev team.










### Country and Currency System

### Overview

A comprehensive, reusable system for handling country and currency selection across the Remit-Scout application. Supports 200+ countries and their respective currencies with automatic currency filtering logic.

### Features

✅ **200+ Countries** - Complete list with flags and ISO codes  
✅ **Smart Currency Logic** - USD, GBP, EUR always available + country-specific currencies  
✅ **Universal Components** - Reusable dropdowns for country and currency selection  
✅ **Auto-Sync** - Currencies automatically update when countries change  
✅ **i18n Ready** - Integrated with translation system  
✅ **TypeScript** - Fully typed for safety  

### Files Created

```
frontend/
├── utils/
│   └── countries-currencies.ts          # Master data & helper functions
├── components/shared/
│   ├── CountrySelect.vue                # Country dropdown (updated)
│   └── CurrencySelect.vue               # Currency dropdown (updated)
└── composables/
    └── useCountryCurrency.ts            # Logic composable
```

### Core Data Structure

### Countries Array (200+ countries)

```typescript
interface Country {
  name: string    // "United States"
  code: string    // "US" (ISO 3166-1 alpha-2)
  flag: string    // "🇺🇸"
  currency: string // "USD"
}
```

### Currencies Object

```typescript
interface Currency {
  code: string      // "USD"
  name: string      // "US Dollar"
  symbol: string    // "$"
  countries: string[] // ["US"]
}
```

### Base Currencies

Always available in currency dropdowns:
- **USD** - US Dollar ($)
- **GBP** - British Pound (£)
- **EUR** - Euro (€)

### Component Usage

### 1. CountrySelect Component

```vue
<template>
  <CountrySelect
    v-model="selectedCountry"
    id="from-country"
    label="Sending from"
    placeholder="Select country"
    @country-selected="handleCountryChange"
  />
</template>

<script setup>
const selectedCountry = ref('US')

function handleCountryChange(countryCode, currency) {
  console.log('Selected:', countryCode, currency)
  // countryCode: "US"
  // currency: "USD"
}
</script>
```

**Props:**
- `modelValue` (required) - Country code (e.g., "US")
- `id` - Input element ID
- `label` - Label text
- `placeholder` - Placeholder text
- `disabled` - Disable the select
- `error` - Error message to display

**Emits:**
- `update:modelValue` - Emits selected country code
- `country-selected` - Emits (countryCode, currency) when country selected

**Features:**
- Searchable dropdown (type to filter)
- Shows flag + country name
- Emits country's native currency when selected

### 2. CurrencySelect Component

```vue
<template>
  <CurrencySelect
    v-model="selectedCurrency"
    id="from-currency"
    :country-code="selectedCountry"
    placeholder="Select currency"
  />
</template>

<script setup>
const selectedCountry = ref('US')
const selectedCurrency = ref('USD')

// When selectedCountry changes, available currencies update automatically
</script>
```

**Props:**
- `modelValue` (required) - Currency code (e.g., "USD")
- `id` - Select element ID
- `placeholder` - Placeholder text
- `disabled` - Disable the select
- `error` - Error message
- `country-code` - Country code to determine available currencies
- `currencies` - Manual currency list (overrides country-code logic)

**Emits:**
- `update:modelValue` - Emits selected currency code

**Currency Logic:**
- **Always shows**: USD, GBP, EUR
- **Plus**: Country's native currency (if different)
- **Example**: India (IN) shows: USD, GBP, EUR, INR

### 3. useCountryCurrency Composable

For complex forms with multiple country/currency pairs:

```vue
<script setup>
import { useCountryCurrency } from '~/composables/useCountryCurrency'

const {
  fromCountry,
  toCountry,
  fromCurrency,
  toCurrency,
  availableFromCurrencies,
  availableToCurrencies,
  setFromCountry,
  setToCountry,
} = useCountryCurrency()

// Initialize
fromCountry.value = 'US'
toCountry.value = 'PH'
// Currencies auto-set to USD and PHP

// Available currencies auto-update
watch(fromCountry, () => {
  console.log('Available:', availableFromCurrencies.value)
  // ['USD', 'GBP', 'EUR']
})

watch(toCountry, () => {
  console.log('Available:', availableToCurrencies.value)
  // ['USD', 'GBP', 'EUR', 'PHP']
})
</script>

<template>
  <div>
    <CountrySelect v-model="fromCountry" label="From" />
    <CurrencySelect 
      v-model="fromCurrency" 
      :country-code="fromCountry" 
    />
    
    <CountrySelect v-model="toCountry" label="To" />
    <CurrencySelect 
      v-model="toCurrency" 
      :country-code="toCountry" 
    />
  </div>
</template>
```

**Composable API:**

```typescript
{
  // Refs
  fromCountry: Ref<string>
  toCountry: Ref<string>
  fromCurrency: Ref<string>
  toCurrency: Ref<string>
  
  // Computed
  fromCountryData: ComputedRef<Country | null>
  toCountryData: ComputedRef<Country | null>
  availableFromCurrencies: ComputedRef<string[]>
  availableToCurrencies: ComputedRef<string[]>
  
  // Methods
  setFromCountry(code: string): void
  setToCountry(code: string): void
  setFromCurrency(code: string): void
  setToCurrency(code: string): void
  reset(): void
  initialize(from, to, fromCurr?, toCurr?): void
}
```

### Helper Functions

Import from `~/utils/countries-currencies`:

### `getCountryByCode(code: string)`

```typescript
const country = getCountryByCode('US')
// { name: "United States", code: "US", flag: "🇺🇸", currency: "USD" }
```

### `getCurrencyInfo(code: string)`

```typescript
const currency = getCurrencyInfo('USD')
// { code: "USD", name: "US Dollar", symbol: "$", countries: ["US"] }
```

### `getAvailableCurrencies(countryCode: string)`

```typescript
const currencies = getAvailableCurrencies('IN')
// ['USD', 'GBP', 'EUR', 'INR']
```

### `getCurrencyDisplay(code: string, locale: string)`

```typescript
const display = getCurrencyDisplay('USD', 'en')
// "USD, US Dollar"

const displayEs = getCurrencyDisplay('USD', 'es')
// "USD, Dólar Estadounidense"
```

### `getCountryDisplay(code: string)`

```typescript
const display = getCountryDisplay('US')
// "🇺🇸 United States"
```

### Complete Example: Transfer Form

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- From Section -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label>Sending from</label>
        <CountrySelect
          v-model="form.fromCountry"
          id="from-country"
          placeholder="Select country"
        />
      </div>
      
      <div>
        <label>Currency</label>
        <CurrencySelect
          v-model="form.fromCurrency"
          id="from-currency"
          :country-code="form.fromCountry"
          :disabled="!form.fromCountry"
        />
      </div>
    </div>

    <!-- To Section -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label>Receiving in</label>
        <CountrySelect
          v-model="form.toCountry"
          id="to-country"
          placeholder="Select country"
        />
      </div>
      
      <div>
        <label>Currency</label>
        <CurrencySelect
          v-model="form.toCurrency"
          id="to-currency"
          :country-code="form.toCountry"
          :disabled="!form.toCountry"
        />
      </div>
    </div>

    <!-- Amount -->
    <div>
      <label>Amount</label>
      <input
        v-model.number="form.amount"
        type="number"
        min="1"
        :placeholder="`Amount in ${form.fromCurrency || 'USD'}`"
      />
    </div>

    <button type="submit">Compare Providers</button>
  </form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const form = reactive({
  fromCountry: 'US',
  toCountry: '',
  fromCurrency: 'USD',
  toCurrency: '',
  amount: 500
})

// Auto-update "from" currency when country changes
watch(() => form.fromCountry, (newCountry) => {
  if (newCountry) {
    const country = getCountryByCode(newCountry)
    if (country && !getAvailableCurrencies(newCountry).includes(form.fromCurrency)) {
      form.fromCurrency = country.currency
    }
  }
})

// Auto-update "to" currency when country changes
watch(() => form.toCountry, (newCountry) => {
  if (newCountry) {
    const country = getCountryByCode(newCountry)
    if (country) {
      form.toCurrency = country.currency
    }
  } else {
    form.toCurrency = ''
  }
})

function handleSubmit() {
  console.log('Form:', form)
  // Navigate to comparison page with all data
  navigateTo(`/send-money/${form.fromCountry}-to-${form.toCountry}?amount=${form.amount}&fromCurrency=${form.fromCurrency}&toCurrency=${form.toCurrency}`)
}
</script>
```

### Migration Guide

### Old Code (Manual Lists)

```vue
<script setup>
const currencies = ref([
  { value: 'USD', label: 'USD, US Dollar' },
  { value: 'EUR', label: 'EUR, Euro' },
  { value: 'GBP', label: 'GBP, British Pound' },
])

const countries = ref([
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  // ... limited list
])
</script>
```

### New Code (Universal System)

```vue
<script setup>
import { useCountryCurrency } from '~/composables/useCountryCurrency'

const {
  fromCountry,
  fromCurrency,
  availableFromCurrencies
} = useCountryCurrency()

// All 200+ countries available automatically
// Currencies update based on country selection
</script>

<template>
  <CountrySelect v-model="fromCountry" />
  <CurrencySelect v-model="fromCurrency" :country-code="fromCountry" />
</template>
```

### Data Coverage

### Countries: 200+
- All UN member states
- Dependent territories
- Special administrative regions
- Major islands and territories

### Currencies: 150+
- Major world currencies
- Regional currencies
- Crypto-friendly zones
- All ISO 4217 codes

### Popular Routes
Pre-configured for common corridors:
- US → Philippines (USD → PHP)
- UK → India (GBP → INR)
- US → Mexico (USD → MXN)
- Canada → Philippines (CAD → PHP)
- And 150+ more...

### Testing

```typescript
// Test currency logic
const currencies = getAvailableCurrencies('IN')
expect(currencies).toContain('USD')
expect(currencies).toContain('GBP')
expect(currencies).toContain('EUR')
expect(currencies).toContain('INR')

// Test country lookup
const country = getCountryByCode('US')
expect(country?.name).toBe('United States')
expect(country?.currency).toBe('USD')

// Test base currencies
expect(BASE_CURRENCIES).toEqual(['USD', 'GBP', 'EUR'])
```

### i18n Integration

Currency names automatically translate:

```vue
<script setup>
const { locale } = useI18n()
</script>

<template>
  <CurrencySelect v-model="currency" />
  <!-- English: "USD, US Dollar" -->
  <!-- Spanish: "USD, Dólar Estadounidense" -->
</template>
```

Add translations to `locales/es.json`:

```json
{
  "currencies": {
    "USD": "Dólar Estadounidense",
    "EUR": "Euro",
    "GBP": "Libra Esterlina",
    ...
  }
}
```

### Performance

- **Minimal Bundle Size** - Data tree-shaken when not used
- **Computed Values** - Cached and reactive
- **Efficient Filtering** - Limited to 50 results in dropdowns
- **No API Calls** - All data compiled at build time

### Future Enhancements

- [ ] Add currency symbols to amount inputs
- [ ] Show exchange rate previews in currency dropdown
- [ ] Add "Recently used" countries/currencies
- [ ] Support for currency aliases (e.g., "Dollar" → USD)
- [ ] Add country calling codes for phone inputs
- [ ] Regional groupings (EU, ASEAN, etc.)

---

**Status:** Production Ready ✅  
**Coverage:** 200+ countries, 150+ currencies  
**Compatibility:** All Nuxt 3 projects  
**Last Updated:** November 13, 2025
