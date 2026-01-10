---
name: Backlink & Visibility Strategy
overview: Maximize backlinks and SEO visibility by implementing internal linking networks, enhanced structured data, optimized social sharing, and content hub pages that connect corridor pages, provider reviews, and guides.
todos:
  - id: related-corridors-section
    content: Add Related Corridors section to corridor pages showing corridors with same origin/destination
    status: completed
  - id: provider-cross-links
    content: Add Provider Reviews section to corridor pages linking to provider review pages
    status: completed
  - id: corridor-links-provider-pages
    content: Add Compare Rates section to provider review pages with links to popular corridors
    status: completed
  - id: review-schema-providers
    content: Implement Review schema on provider review pages using addReviewSchema
    status: completed
  - id: enhanced-share-text
    content: Improve share modal text with specific rates, best provider, and compelling CTA
    status: completed
  - id: og-images
    content: Add Open Graph image support for corridor and provider pages
    status: completed
  - id: popular-corridors-hub
    content: Create /corridors hub page showing most popular corridors
    status: completed
  - id: best-providers-country
    content: Create /country/[country]/best-providers pages for each major receiving country
    status: pending
  - id: related-content-footer
    content: Create RelatedContentFooter component for cross-linking on all pages
    status: pending
  - id: howto-schema-guides
    content: Add HowTo schema to step-by-step guide pages
    status: pending
---

# Backlink & Visibility Enhancement Strategy

## Current State Analysis

**Strengths:**

- Dynamic corridor pages with FinancialProduct schema
- Share modal with Web Share API support
- Clean URL structure
- Breadcrumbs and basic structured data

**Gaps:**

- No related corridors cross-linking on corridor pages
- Provider review pages missing Review schema
- Limited internal linking between page types
- No Open Graph images per page
- Missing content hub pages for aggregation
- Share text could be more compelling

## Implementation Plan

### 1. Internal Linking Network

#### 1.1 Related Corridors Section on Corridor Pages

**File:** `frontend/pages/send-money/[from]-to-[to].vue`Add a "Related Corridors" section before the FAQs that shows:

- Corridors with same origin country (e.g., "Other transfers from United States")
- Corridors with same destination (e.g., "Other ways to send to Jordan")
- Popular alternative corridors
- Logic: Use `getAllCorridorUrls()` or fetch from `/popular-corridors` API

**Implementation:**

- Add `relatedCorridors` computed property that filters corridors by from/to country
- Create `RelatedCorridors.vue` component
- Display as a grid of cards with corridor links
- Place after insights section, before FAQs

#### 1.2 Provider Cross-Linking on Corridor Pages

**File:** `frontend/pages/send-money/[from]-to-[to].vue`Add "Provider Reviews" section that links to provider review pages:

- Show providers that appear in the comparison table
- Link format: `/learn/providers/{slug}`
- Display as cards with provider logo and Remit-Score
- Only show providers that have review pages

#### 1.3 Corridor Links on Provider Review Pages

**File:** `frontend/pages/learn/providers/remitly.vue` and dynamic `[slug].vue`Add "Compare Rates" CTA section that:

- Links to popular corridors where provider performs well
- Uses `/popular-corridors` API or static list
- Shows 3-4 corridor cards with "Compare rates for {from} → {to}" CTAs
- Each card links to the corridor comparison page

#### 1.4 Guide-to-Content Linking

**File:** `frontend/components/nav/panels/GuidesPanel.vue` and guide pagesEnhance guides to link to relevant:

- Corridor pages mentioned in guide content
- Provider review pages for providers discussed
- Add contextual corridor/provider links within guide content

### 2. Structured Data Enhancements

#### 2.1 Review Schema on Provider Pages

**File:** `frontend/pages/learn/providers/remitly.vue` and `[slug].vue`Add Review schema using existing `addReviewSchema` from `useStructuredData`:

- `itemReviewed`: Provider name (Organization)
- `reviewBody`: Main review content
- `author`: "Remit-Scout Editorial Team"
- `ratingValue`: Remit-Score (e.g., 9.1)
- `bestRating`: 10
- `worstRating`: 1
- `datePublished`: Page creation/last update date

#### 2.2 HowTo Schema for Guide Pages

**File:** Guide pages (e.g., `/learn/how-exchange-rates-work`)Add HowTo schema for step-by-step guides:

- Extract steps from guide content
- Use `addHowToSchema` from `useStructuredData`
- Enables Google HowTo rich snippets

#### 2.3 AggregateOffer for Corridor Pages

Enhance FinancialProduct schema to include multiple offers from all providers on the page, showing price range.

### 3. Social Sharing Optimization

#### 3.1 Enhanced Share Text

**File:** `frontend/components/shared/ShareModal.vue`Improve share message to include:

- Specific rate information if available
- Best provider highlight
- More compelling call-to-action
- Format: "💸 Found the best {fromCurrency} to {toCurrency} rates! {BestProvider} offers {rate} with {fee} fees. Compare 10+ providers on Remit-Scout →"

#### 3.2 Open Graph Images

**Files:** `frontend/pages/send-money/[from]-to-[to].vue`, provider pages, corridor pagesGenerate or serve dynamic OG images:

- Option A: Use a service like Cloudinary/ImageKit with template
- Option B: Pre-generate for popular corridors
- Option C: Use a static template with dynamic text overlay
- Include: Corridor name, best rate, provider count
- Default fallback: Generic Remit-Scout OG image

**Implementation:**

- Add `ogImage` prop to `setSeo()` calls
- Format: `{siteUrl}/og-images/corridor-{from}-{to}.jpg` or use API route for dynamic generation

#### 3.3 Share Button Prominence

**File:** `frontend/pages/send-money/[from]-to-[to].vue`Make share more prominent:

- Add floating share button (desktop)
- Add share button to header section
- Track share events for analytics

### 4. Content Hub Pages

#### 4.1 "Best Providers for [Country]" Pages

**New File:** `frontend/pages/country/[country]/best-providers.vue`Create pages like `/country/philippines/best-providers`:

- Lists top providers for that country based on Remit-Scores
- Links to provider review pages
- Shows popular corridors to that country
- Links to corridor comparison pages
- Uses country page structure with provider cards

#### 4.2 "Popular Corridors" Hub Page

**New File:** `frontend/pages/corridors/index.vue` or enhance existingCreate a hub page at `/corridors`:

- Shows most popular corridors from API
- Organized by origin country
- Each corridor links to comparison page
- Refreshes based on real-time popularity data

#### 4.3 Regional Corridor Pages

**New Files:** `frontend/pages/corridors/[region].vue`Create regional pages:

- `/corridors/us-outbound` - All US → X corridors
- `/corridors/europe` - European corridors
- Lists corridors in grid with links
- Each links to specific corridor comparison page

### 5. URL Structure & Deep Linking

#### 5.1 UTM Parameter Support

**Files:** Share modal, external linksAdd UTM parameters to shared URLs:

- `utm_source=remitscout`
- `utm_medium=share`
- `utm_campaign=corridor_comparison` (or provider_review, etc.)
- Track which share methods drive traffic

#### 5.2 Anchor Links for Sections

**File:** `frontend/pages/send-money/[from]-to-[to].vue`Add anchor links to major sections:

- `#compare` (already exists)
- `#insights`
- `#providers` (new anchor for provider cards)
- `#faqs`
- Enables deep linking to specific sections

### 6. Citation & Backlink Opportunities

#### 6.1 "Cite This Data" Feature

**New Component:** `frontend/components/shared/CiteData.vue`Add citation component on corridor pages:

- "Cite these rates" button
- Generates academic-style citation
- Format: "Remit-Scout (2024). Best money transfer rates: {from} to {to}. Retrieved {date} from {url}"
- Helps researchers/journalists cite your data

#### 6.2 Data Export/Download

**File:** `frontend/pages/send-money/[from]-to-[to].vue`Add "Download comparison" feature:

- Export provider data as CSV/JSON
- Includes rates, fees, delivery times
- Adds attribution: "Data from Remit-Scout.com"
- Encourages backlinks when data is used

#### 6.3 Embeddable Widget (Future Phase)

**Future:** Create embeddable comparison widget:

- Other sites embed your comparison
- Automatically generates backlinks
- Shows "Powered by Remit-Scout" attribution

### 7. Internal Navigation Improvements

#### 7.1 Breadcrumb Enhancements

**Files:** All dynamic pagesEnhance breadcrumbs to include:

- Provider pages: Home → Learn → Providers → {Provider} → Review
- Corridor pages: Home → Send Money → {From} → {To}
- Add "You are here" indicator

#### 7.2 Related Content Footer

**New Component:** `frontend/components/shared/RelatedContentFooter.vue`Add to all pages:

- Shows 3-4 related corridors
- Shows related provider reviews
- Shows related guides
- Based on current page context

### 8. Analytics & Tracking

#### 8.1 Share Event Tracking

**File:** `frontend/components/shared/ShareModal.vue`Track share events:

- Which platform (WhatsApp, Twitter, etc.)
- Which page type (corridor, provider, guide)
- Which corridor/provider
- Measure share-to-visit conversion

#### 8.2 Internal Link Click Tracking

Track clicks on:

- Related corridors
- Provider review links
- Cross-page navigation
- Identify strongest internal linking patterns

## Implementation Priority

**Phase 1 (High Impact, Quick Wins):**

1. Related corridors section on corridor pages
2. Review schema on provider pages
3. Enhanced share text
4. Provider cross-linking on corridor pages

**Phase 2 (Medium Impact):**

5. Content hub pages (best providers for country, popular corridors)
6. Open Graph images
7. Related content footer component

**Phase 3 (Long-term Value):**

8. HowTo schema for guides
9. Citation feature
10. Data export feature

## Files to Modify

1. `frontend/pages/send-money/[from]-to-[to].vue` - Add related corridors, provider links
2. `frontend/pages/learn/providers/remitly.vue` - Add Review schema, corridor links
3. `frontend/pages/learn/providers/[slug].vue` - Add Review schema, corridor links
4. `frontend/components/shared/ShareModal.vue` - Enhanced share text
5. `frontend/composables/useStructuredData.ts` - Ensure Review schema is properly exported
6. `frontend/composables/useSeo.ts` - Add ogImage parameter support

## New Files to Create

1. `frontend/components/shared/RelatedCorridors.vue` - Related corridors component
2. `frontend/components/shared/ProviderReviewLinks.vue` - Provider review links component
3. `frontend/components/shared/RelatedContentFooter.vue` - Footer with related content
4. `frontend/pages/corridors/index.vue` - Popular corridors hub
5. `frontend/pages/country/[country]/best-providers.vue` - Best providers per country page

## Expected Outcomes

- **Increased Internal Linking:** Every corridor page links to 10+ related pages
- **Better Crawlability:** Search engines discover more pages through internal links