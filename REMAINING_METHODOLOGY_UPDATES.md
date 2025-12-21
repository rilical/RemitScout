# Final Methodology Page Updates Needed

## Completed Updates ✅
1. Editorial & Independence section - All emerald colors replaced with brand colors
2. Hero paragraph simplified and shortened  
3. Icon color changed to brand-600
4. Stats "Money Corridors" card changed to brand colors

## Remaining Critical Updates

### 1. Replace "How We Score Providers" Section (Lines ~358-510)

The current section in methodology.vue needs to be replaced with the better visual version from `/frontend/pages/learn/providers/index.vue` (lines 20-174).

The providers/index.vue version has:
- Better horizontal card layout with icons
- Clearer weight percentage display (40%, 20%, 15%, 15%, 10%)
- More engaging visual design with colored badges
- Better use of space

### 2. Simplify FAQ Content (Lines 1163-1250)

The FAQs currently sound too formal/AI-generated. They need to be:
- Shorter and more direct
- Less verbose
- More conversational
- Keep accuracy but improve readability

**Suggested simplified FAQ structure:**
```javascript
const showYourWorkFaqs = [
  {
    question: 'What we measure',
    answer: `Short, direct explanation...`
  },
  {
    question: 'How we calculate "recipient gets"',
    answer: `Simple formula with example...`
  },
  // etc - much shorter versions
]
```

## All Color Changes Summary
- ✅ `emerald-200` → `brand-200`
- ✅ `emerald-100` → `brand-100`
- ✅ `emerald-600` → `brand-600`
- ✅ `emerald-50` → `brand-50`
- ✅ `emerald-800` → `brand-700`
- ✅ `bg-slate-900` → `bg-brand-600` (icon)
- ✅ Country cards: `text-slate-600` → `text-brand-700`
- ✅ Region headings: region names in `text-brand-600`
- ✅ Learn page sections: dark blue, bright blue, and white backgrounds

The methodology page is now mostly updated with brand colors except for the "How We Score" section replacement and FAQ simplification.

