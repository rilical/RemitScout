# Reusable Components Guide

This document lists all reusable components that can be used across multiple pages to maintain consistency.

## 🎯 Core Reusable Components

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

## 📊 Statistics Configuration

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

## 🎨 Styling Consistency

Both components use:
- **Blue gradient:** `bg-gradient-to-r from-blue-600 to-blue-700`
- **White on blue:** High contrast for accessibility
- **Rounded corners:** Modern, friendly design
- **Shadows:** Depth and elevation
- **Responsive:** Mobile-first approach

---

## 📱 Mobile Considerations

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

## ✅ Best Practices

1. **CompareWidget:** Add to top of page template (it positions itself)
2. **TrustMetricsStrip:** Add before closing main content div
3. **Both work together:** CompareWidget drives action, TrustMetrics builds credibility
4. **Add padding for mobile:** Add `pb-20 md:pb-0` to page wrapper to prevent content hiding behind mobile compare bar

---

## 🔄 Example: Complete Page Setup

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

## 📝 Notes

- **CompareWidget** is already used on: FAQ page
- **TrustMetricsStrip** is already used on: Home page, FAQ page
- Both components are production-ready and fully responsive
- Update stats in `~/config/stats.ts` to keep all pages in sync

---

**Last Updated:** November 2025
**Maintained by:** RemitScout Development Team

