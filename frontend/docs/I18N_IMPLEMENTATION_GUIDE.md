# i18n Implementation Guide

This guide explains how to implement internationalization (i18n) across the Remit-Scout application.

## Setup Complete

✅ **@nuxtjs/i18n** module installed and configured  
✅ **en.json** and **es.json** locale files created with comprehensive translations  
✅ **i18n.config.ts** configured with number and date formats  
✅ **useLocalizedFormat()** composable created for formatting  
✅ Language switcher implemented in header

## File Structure

```
frontend/
├── i18n.config.ts              # i18n configuration
├── locales/
│   ├── en.json                 # English translations
│   └── es.json                 # Spanish translations
└── composables/
    └── useLocalizedFormat.ts   # Formatting helpers
```

## How to Use Translations in Components

### 1. Basic Text Translation

Replace hardcoded strings with `$t()` in templates or `t()` in script:

**Before:**
```vue
<template>
  <h1>Compare providers</h1>
  <p>Find the best rates</p>
</template>
```

**After:**
```vue
<template>
  <h1>{{ $t('common.compareProviders') }}</h1>
  <p>{{ $t('hero.subtitle') }}</p>
</template>
```

### 2. Translation with Interpolation

For dynamic values, use curly braces in locale files:

**Locale file (en.json):**
```json
{
  "trustMetrics": {
    "description": "We track {providers} across {countries} in real time."
  }
}
```

**Component:**
```vue
<template>
  <p>{{ $t('trustMetrics.description', { 
    providers: '30 providers', 
    countries: '154 countries' 
  }) }}</p>
</template>
```

### 3. Using in Script Setup

```vue
<script setup lang="ts">
const { t, locale } = useI18n()

const title = computed(() => t('common.siteName'))
const description = t('hero.subtitle')
</script>
```

### 4. Formatting Numbers and Currency

Use the `useLocalizedFormat()` composable:

```vue
<script setup lang="ts">
const { formatCurrency, formatNumber, formatPercent, formatDate } = useLocalizedFormat()

const price = ref(500)
const formattedPrice = computed(() => formatCurrency(price.value, 'USD'))
// Returns: "$500.00" in English, "500,00 US$" in Spanish (locale-aware)

const savings = ref(350)
const formattedSavings = computed(() => formatPercent(savings.value))
// Returns: "3.5%" in English, "3,5%" in Spanish

const lastUpdate = new Date()
const formattedDate = formatDate(lastUpdate, 'short')
// Returns: "Nov 13, 2025" in English, "13 nov 2025" in Spanish
</script>

<template>
  <div>
    <p>{{ formattedPrice }}</p>
    <p>{{ formattedSavings }}</p>
    <p>{{ formattedDate }}</p>
  </div>
</template>
```

### 5. Pluralization

For strings that change based on quantity:

**Locale file:**
```json
{
  "items": "no items | one item | {count} items"
}
```

**Component:**
```vue
<template>
  <p>{{ $t('items', count) }}</p>
</template>
```

### 6. Localized Links

Use `localePath()` for internal navigation:

```vue
<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink :to="localePath('/about')">{{ $t('nav.about') }}</NuxtLink>
</template>
```

## Component Examples

### Example 1: Hero Section

**Before:**
```vue
<template>
  <h1>Send more home, pay less in fees.</h1>
  <p>Compare live rates from 30+ providers</p>
  <button>Compare Now</button>
</template>
```

**After:**
```vue
<template>
  <h1>
    {{ $t('hero.title') }}
    <span class="text-brand-600">{{ $t('hero.titleHighlight') }}</span>
    {{ $t('hero.titleEnd') }}
  </h1>
  <p>{{ $t('hero.subtitle') }}</p>
  <button>{{ $t('common.compareNow') }}</button>
</template>
```

### Example 2: Form with Validation

```vue
<script setup lang="ts">
const { t } = useI18n()
const errorMessage = ref('')

function validate() {
  if (!form.value.from) {
    errorMessage.value = t('hero.validation.selectSendingCountry')
    return false
  }
  if (!form.value.amount) {
    errorMessage.value = t('hero.validation.enterValidAmount')
    return false
  }
  return true
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <label>{{ $t('hero.form.sendingFrom') }}</label>
    <CountrySelect v-model="form.from" />
    
    <label>{{ $t('hero.form.youSend') }}</label>
    <input v-model="form.amount" type="number" />
    
    <div v-if="errorMessage" class="error">
      {{ errorMessage }}
    </div>
    
    <button type="submit">{{ $t('hero.form.submit') }}</button>
  </form>
</template>
```

### Example 3: Provider Card with Formatting

```vue
<script setup lang="ts">
const { formatCurrency, formatNumber } = useLocalizedFormat()
const { t } = useI18n()

const props = defineProps<{
  provider: Provider
}>()

const formattedFee = computed(() => formatCurrency(props.provider.fee, 'USD'))
const formattedRate = computed(() => formatNumber(props.provider.rate, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4
}))
</script>

<template>
  <div class="provider-card">
    <h3>{{ provider.name }}</h3>
    <p>{{ $t('providers.metrics.deliveredValue') }}: {{ formattedFee }}</p>
    <p>{{ $t('common.amount') }}: {{ formattedRate }}</p>
    <NuxtLink :to="`/providers/${provider.slug}`">
      {{ $t('providers.findOutMore') }}
    </NuxtLink>
  </div>
</template>
```

## Meta Tags and SEO

Update meta tags in pages:

```vue
<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

useHead({
  title: t('meta.home.title'),
  htmlAttrs: {
    lang: locale.value
  },
  meta: [
    {
      name: 'description',
      content: t('meta.home.description')
    }
  ],
  link: [
    {
      rel: 'alternate',
      hreflang: 'en',
      href: `${siteUrl}${localePath('/')}`
    },
    {
      rel: 'alternate',
      hreflang: 'es',
      href: `${siteUrl}/es${localePath('/')}`
    }
  ]
})
</script>
```

## Constants and Config Migration

### Before (utils/constants.ts):
```typescript
export const GUIDE_CARDS = [
  {
    title: 'Best ways to send money to the Philippines (2025)',
    blurb: 'Fees, exchange margins and speed compared',
  }
]
```

### After:
Move strings to locale files and reference them:

```typescript
// utils/constants.ts
export const GUIDE_CARD_IDS = ['philippines', 'india', 'mexico']

// In component:
const { t } = useI18n()
const guides = computed(() => 
  GUIDE_CARD_IDS.map(id => ({
    title: t(`guides.cards.${id}.title`),
    blurb: t(`guides.cards.${id}.blurb`),
  }))
)
```

## Testing Translations

1. **Test language switching:**
   - Click language selector in header
   - Verify all text updates
   - Check URL changes to `/es/...`

2. **Test formatting:**
   - Switch to Spanish
   - Verify currency shows correct format (€ vs $)
   - Check decimal separators (, vs .)
   - Verify date formats

3. **Test missing translations:**
   - If a key is missing, it will show the key path
   - Add missing keys to locale files

## Checklist for Each Component

- [ ] Replace all hardcoded strings with `$t()` or `t()`
- [ ] Use interpolation for dynamic values
- [ ] Use `useLocalizedFormat()` for numbers, currency, dates
- [ ] Update meta tags with translated content
- [ ] Use `localePath()` for internal links
- [ ] Test in both English and Spanish
- [ ] Verify responsive behavior with longer Spanish text

## Next Steps

1. Go through each component in `/components/home/` and extract strings
2. Update `/pages/` components with translations
3. Migrate `/utils/constants.ts` strings to locale files
4. Update `/config/nav.ts` with translation keys
5. Add translations for dynamic content (FAQ, testimonials, etc.)
6. Test all routes in both languages
7. Verify SEO meta tags and hreflang tags

## Common Patterns

### Button with icon:
```vue
<button>
  {{ $t('common.learnMore') }}
  <svg><!-- icon --></svg>
</button>
```

### Conditional text:
```vue
<p v-if="pending">{{ $t('common.loading') }}</p>
<p v-else>{{ $t('common.success') }}</p>
```

### Loop with translations:
```vue
<div v-for="method in DELIVERY_METHODS" :key="method.value">
  {{ $t(`deliveryMethods.${method.value}`) }}
</div>
```

## Resources

- [Nuxt i18n Documentation](https://i18n.nuxtjs.org/)
- [Vue I18n Documentation](https://vue-i18n.intlify.dev/)
- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)

## Locale File Organization

The locale files are organized by feature/section:
- `common`: Shared strings (buttons, labels, etc.)
- `nav`: Navigation and menu items
- `hero`: Homepage hero section
- `providers`: Provider comparison section
- `remitScore`: Rating explanation
- `trustMetrics`: Trust indicators
- `corridors`: Popular routes
- `howItWorks`: Process explanation
- `founderStory`: About section
- `bankVsSpecialist`: Bank comparison
- `rateAlerts`: Alert subscription
- `testimonials`: User reviews
- `guides`: Learning resources
- `travelTools`: Additional tools
- `countries`: Country selector
- `faq`: Frequently asked questions
- `newsletter`: Email subscription
- `ctaBanner`: Call-to-action
- `footer`: Footer content
- `currencies`: Currency names
- `meta`: SEO metadata

---

**Note:** This is a comprehensive setup. Apply translations incrementally, testing each section as you go. Start with high-visibility components (hero, navigation, providers) before moving to secondary sections.

