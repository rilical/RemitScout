# Universal Country & Currency System

## Overview

A comprehensive, reusable system for handling country and currency selection across the Remit-Scout application. Supports 200+ countries and their respective currencies with automatic currency filtering logic.

## Features

✅ **200+ Countries** - Complete list with flags and ISO codes  
✅ **Smart Currency Logic** - USD, GBP, EUR always available + country-specific currencies  
✅ **Universal Components** - Reusable dropdowns for country and currency selection  
✅ **Auto-Sync** - Currencies automatically update when countries change  
✅ **i18n Ready** - Integrated with translation system  
✅ **TypeScript** - Fully typed for safety  

## Files Created

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

## Core Data Structure

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

## Component Usage

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

## Helper Functions

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

## Complete Example: Transfer Form

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

## Migration Guide

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

## Data Coverage

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

## Testing

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

## i18n Integration

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

## Performance

- **Minimal Bundle Size** - Data tree-shaken when not used
- **Computed Values** - Cached and reactive
- **Efficient Filtering** - Limited to 50 results in dropdowns
- **No API Calls** - All data compiled at build time

## Future Enhancements

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

