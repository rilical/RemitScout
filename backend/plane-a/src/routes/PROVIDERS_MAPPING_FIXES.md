# Providers Endpoint - Proper Mapping Fixes

## Issues Fixed

### 1. ✅ Delivery Time Mapping
**Problem**: Was converting hours back to minutes unnecessarily
**Fix**: Store `deliveryLabel` directly in transformed quote from original database minutes

**Before**:
```typescript
formatTransferTime(quote.transferTime.min * 60, quote.transferTime.max * 60)
```

**After**:
```typescript
// In transformQuote - store label directly
deliveryLabel: formatTransferTime(
  quote.delivery_time_min_minutes,
  quote.delivery_time_max_minutes,
).label
```

### 2. ✅ Methods Array Mapping
**Problem**: Logic was checking payin first, then payout
**Fix**: Methods array should be based primarily on payout method (what frontend `method` param represents)

**Before**:
```typescript
if (quote.payin === 'BANK' || ...) {
  if (quote.payout === 'BANK') methods.push('bank')
  // ...
}
```

**After**:
```typescript
if (quote.payout === 'BANK' || quote.payout === 'CARD') {
  methods.push('bank')
} else if (quote.payout === 'CASH') {
  methods.push('cash')
} else if (quote.payout === 'WALLET') {
  methods.push('wallet')
}
```

### 3. ✅ Margin Calculation
**Problem**: Need to ensure proper validation
**Fix**: Added checks for valid rates

```typescript
const marginPct = midMarketRate && midMarketRate > 0 && fxRate > 0
  ? ((midMarketRate - fxRate) / midMarketRate) * 100
  : 0
```

**Formula**: `(midMarketRate - providerRate) / midMarketRate * 100`
- Positive = provider rate is worse (higher markup)
- Negative = provider rate is better (lower markup)
- We use `Math.abs()` to show absolute markup percentage

### 4. ✅ Original Quote Data Access
**Problem**: Lost access to original database fields after transformation
**Fix**: Store original quote reference in transformed quote

```typescript
type TransformedQuote = ProviderQuoteResponse['quotes'][0] & { 
  deliveryLabel: string
  originalQuote: LatestQuoteByCorridorRecord 
}
```

### 5. ✅ FX Rate Direction
**Verified**: `implied_fx_rate = receive_amount / send_amount`
- Direction: send_currency → receive_currency
- Example: USD → PHP, rate = 56.5 means 1 USD = 56.5 PHP
- This matches frontend expectations

## Complete Mapping Table

| Database Field | Transformation | Frontend Field | Notes |
|----------------|----------------|----------------|-------|
| `provider_id` | Lowercase → metadata lookup | `id` | Provider slug |
| `provider_id` | Metadata lookup | `name` | Display name |
| `logo.sm` | Direct | `logoUrl` | Logo path |
| `fee_amount` | Direct | `fee` | Total fee |
| `implied_fx_rate` | Direct | `fxRate` | Exchange rate |
| `receive_amount` | Direct | `recipientGets` | Amount recipient receives |
| `delivery_time_min/max_minutes` | `formatTransferTime()` | `delivery` | Human-readable time |
| `payout` (canonical) | `mapPayoutMethod()` → methods array | `methods` | `['bank']` \| `['cash']` \| `['wallet']` |
| `payout` | Logic mapping | `bestFor` | Use case description |
| `promotional_rate/fee` | Logic check | `whyThisRanking` | Promo text or bestFor |
| Provider score | `score / 10` (clamped 0-1) | `reliability` | Normalized reliability |
| `midMarketRate`, `fxRate` | `(mid - rate) / mid * 100` | `marginPct` | Markup percentage |

## Method Mapping Details

### Frontend Method → Database Query
```typescript
method: 'bank'  → payin: 'bank_transfer', payout: 'bank_deposit'
method: 'cash'  → payin: 'bank_transfer', payout: 'cash_pickup'
method: 'wallet' → payin: 'bank_transfer', payout: 'mobile_wallet'
```

### Database Payout → Frontend Methods Array
```typescript
payout: 'bank_deposit' → methods: ['bank']
payout: 'cash_pickup'  → methods: ['cash']
payout: 'mobile_wallet' → methods: ['wallet']
```

### Database Payin/Payout → Display Format
```typescript
payin: 'bank_transfer' → 'BANK'
payin: 'debit_card' → 'DEBITCARD'
payin: 'credit_card' → 'CREDITCARD'
payout: 'bank_deposit' → 'BANK'
payout: 'cash_pickup' → 'CASH'
payout: 'mobile_wallet' → 'WALLET'
```

## Delivery Time Formatting

Input: Minutes (from database)
Output: Human-readable string

```typescript
0-0 min    → "Instant"
60-60 min  → "1 hour"
120-240 min → "2-4 hours"
```

## Margin Calculation Details

### Formula
```typescript
marginPct = (midMarketRate - providerRate) / midMarketRate * 100
```

### Examples
- Mid-market: 56.5, Provider: 56.3 → Margin: 0.35% (provider worse)
- Mid-market: 56.5, Provider: 56.7 → Margin: -0.35% (provider better, shown as 0.35%)

### Frontend Usage
Frontend uses `marginPct` to display "X% off mid-market" in the UI.

## Cache Key Format

```
providers:{corridorId}:{amountBucket}:{normalizedPayin}:{normalizedPayout}
```

**Important**: Uses canonical methods, not frontend method names
- ✅ `providers:US-PH-USD-PHP:1000:bank_transfer:bank_deposit`
- ❌ `providers:US-PH-USD-PHP:1000:bank:bank`

## Response Structure

```typescript
{
  data: [
    {
      id: "remitly",              // Provider slug
      name: "Remitly",            // Display name
      logoUrl: "/logos/remitly.svg",
      fee: 1.99,                  // Total fee in send currency
      marginPct: 0.4,             // Markup % vs mid-market
      fxRate: 56.5,               // Exchange rate (send→recv)
      recipientGets: 56500,       // Amount in receive currency
      delivery: "Same day",       // Human-readable time
      reliability: 0.91,          // 0-1 score
      methods: ["bank"],          // Available methods
      bestFor: "Bank deposit",   // Use case
      whyThisRanking: "Bank deposit" // Explanation
    }
  ],
  updatedAt: "2024-01-02T19:16:57.376Z",
  corridor: "US-PH-USD-PHP",
  amount: 1000,
  method: "bank"
}
```

## Testing Checklist

- [x] Method normalization (frontend → canonical)
- [x] Cache key uses canonical methods
- [x] Delivery time from original database minutes
- [x] Methods array based on payout
- [x] Margin calculation with validation
- [x] FX rate direction correct
- [x] Response format matches frontend types
- [x] Original quote data preserved



