# Providers Endpoint Mapping Documentation

## Overview

The `/api/providers` endpoint aggregates normalized provider quotes from the database and transforms them into the format expected by the frontend.

## Input Parameters

### Query Parameters

1. **Country-based (recommended)**:
   - `from`: 2-letter country code (e.g., "US")
   - `to`: 2-letter country code (e.g., "PH")
   - `amount`: Send amount (e.g., 1000)
   - `method`: Payment method - `'bank'` | `'cash'` | `'wallet'`

2. **Direct corridor (advanced)**:
   - `corridor_id`: Full corridor ID (e.g., "US-PH-USD-PHP")
   - `amount_bucket`: Pre-computed amount bucket
   - `payin`: Canonical payin method (e.g., "bank_transfer")
   - `payout`: Canonical payout method (e.g., "bank_deposit")

## Method Mapping

### Frontend Method → Database Canonical Methods

| Frontend `method` | Payin (Canonical) | Payout (Canonical) |
|-------------------|-------------------|-------------------|
| `bank` | `bank_transfer` | `bank_deposit` |
| `cash` | `bank_transfer` | `cash_pickup` |
| `wallet` | `bank_transfer` | `mobile_wallet` |

### Database Canonical → Frontend Display

**Payin Methods:**
- `bank_transfer` → `BANK`
- `debit_card` → `DEBITCARD`
- `credit_card` → `CREDITCARD`
- `apple_pay` → `DEBITCARD`
- `google_pay` → `DEBITCARD`
- `cash` → `CASH`

**Payout Methods:**
- `bank_deposit` → `BANK`
- `cash_pickup` → `CASH`
- `mobile_wallet` → `WALLET`
- `airtime` → `WALLET`

### Frontend Methods Array

The `methods` field in the response is derived from the payout method:
- `BANK` or `CARD` payout → `['bank']`
- `CASH` payout → `['cash']`
- `WALLET` payout → `['wallet']`

## Response Format

### Expected Frontend Format

```typescript
{
  data: ProviderQuote[],
  updatedAt: string,      // ISO timestamp
  corridor: string,       // Corridor ID (e.g., "US-PH-USD-PHP")
  amount: number,         // Send amount
  method: string          // 'bank' | 'cash' | 'wallet'
}
```

### ProviderQuote Structure

```typescript
{
  id: string,                    // Provider slug (e.g., "remitly")
  name: string,                  // Provider display name (e.g., "Remitly")
  logoUrl?: string,              // Logo URL path
  fee: number,                   // Total fee in send currency
  marginPct: number,             // FX markup percentage vs mid-market
  fxRate: number,                // Exchange rate (send -> receive)
  recipientGets: number,         // Amount recipient receives
  delivery: string,              // Human-readable delivery time (e.g., "1-2 days")
  reliability: number,           // 0-1 score (derived from provider score / 10)
  methods: ('bank' | 'cash' | 'wallet')[],  // Available methods
  bestFor: string,               // Use case description
  whyThisRanking?: string,       // Ranking explanation
  limits?: string,               // Transfer limits (optional)
  corridorPros?: string[],       // Corridor-specific pros (optional)
  corridorCons?: string[]        // Corridor-specific cons (optional)
}
```

## Field Mappings

### From Database Quote to Frontend Quote

| Frontend Field | Source | Calculation/Transformation |
|----------------|--------|---------------------------|
| `id` | `provider_id` | Lowercased provider ID → slug lookup |
| `name` | Provider metadata | From `provider-metadata.ts` |
| `logoUrl` | Provider metadata | `logo.sm` from metadata |
| `fee` | `quote.fee.total` | Direct mapping |
| `marginPct` | Calculated | `((midMarketRate - fxRate) / midMarketRate) * 100` |
| `fxRate` | `quote.implied_fx_rate` | Direct mapping |
| `recipientGets` | `quote.receive_amount` | Direct mapping |
| `delivery` | `delivery_time_min/max_minutes` | Formatted via `formatTransferTime()` |
| `reliability` | Provider score | `providerScore / 10` (clamped 0-1) |
| `methods` | `payin` + `payout` | Derived from payout method |
| `bestFor` | `payout` method | "Fast cash pickup" | "Mobile wallet delivery" | "Bank deposit" |
| `whyThisRanking` | Promos + payout | Promo text or `bestFor` |

## Delivery Time Formatting

The `formatTransferTime()` function converts minutes to human-readable format:

- `0-0 minutes` → `"Instant"`
- `Same hours` → `"X hour(s)"`
- `Range` → `"X-Y hours"`

Examples:
- `0 min, 0 max` → `"Instant"`
- `60 min, 60 max` → `"1 hour"`
- `120 min, 240 max` → `"2-4 hours"`

## Margin Calculation

```typescript
marginPct = midMarketRate && midMarketRate > 0
  ? ((midMarketRate - fxRate) / midMarketRate) * 100
  : 0
```

This calculates how much worse the provider rate is compared to mid-market (positive = worse, negative = better).

## Caching

Cache key format:
```
providers:{corridorId}:{amountBucket}:{normalizedPayin}:{normalizedPayout}
```

Example:
```
providers:US-PH-USD-PHP:1000:bank_transfer:bank_deposit
```

**Important**: The cache uses **normalized canonical methods** (e.g., `bank_transfer`, `bank_deposit`), not the frontend method names (`bank`, `cash`, `wallet`).

## Frontend Integration

### How Frontend Uses the Response

1. **Data Fetching** (`frontend/pages/send-money/[from]-to-[to].vue`):
   ```typescript
   const { data: quotesData } = await useProviders(
     fromCountryCode.value,
     toCountryCode.value,
     initialAmount,
     initialMethod
   )
   ```

2. **Data Access**:
   ```typescript
   const providerQuotes = computed(() => 
     (quotesData.value?.data || []) as ProviderQuote[]
   )
   ```

3. **Rating Attachment**:
   ```typescript
   const ratedQuotes = computed(() => 
     attachRatings(providerQuotes.value)
   )
   ```

4. **Display Mapping**:
   - `recipientGets` → Displayed as "Recipient gets"
   - `fee` → Formatted with `formatMoney()`
   - `fxRate` → Formatted with `formatRate()`
   - `delivery` → Displayed as speed
   - `methods` → Used to show payment method badges

## Example Request/Response

### Request
```
GET /api/providers?from=US&to=PH&amount=1000&method=bank
```

### Response
```json
{
  "data": [
    {
      "id": "remitly",
      "name": "Remitly",
      "logoUrl": "/logos/remitly.svg",
      "fee": 1.99,
      "marginPct": 0.4,
      "fxRate": 56.5,
      "recipientGets": 56500,
      "delivery": "Same day",
      "reliability": 0.91,
      "methods": ["bank"],
      "bestFor": "Bank deposit",
      "whyThisRanking": "Bank deposit"
    },
    {
      "id": "wise",
      "name": "Wise",
      "logoUrl": "/logos/wise.svg",
      "fee": 5.49,
      "marginPct": 0.5,
      "fxRate": 56.3,
      "recipientGets": 56300,
      "delivery": "1-2 days",
      "reliability": 0.93,
      "methods": ["bank"],
      "bestFor": "Bank deposit",
      "whyThisRanking": "Bank deposit"
    }
  ],
  "updatedAt": "2024-01-02T19:16:57.376Z",
  "corridor": "US-PH-USD-PHP",
  "amount": 1000,
  "method": "bank"
}
```

## Key Mappings Summary

1. ✅ **Method normalization**: Frontend `method` → Canonical `payin`/`payout`
2. ✅ **Cache key**: Uses normalized canonical methods
3. ✅ **Response format**: Flattened `ProviderQuote[]` array
4. ✅ **Field mapping**: All database fields → Frontend fields
5. ✅ **Delivery time**: Minutes → Human-readable format
6. ✅ **Margin calculation**: Mid-market rate comparison
7. ✅ **Methods array**: Derived from payout method
8. ✅ **Reliability**: Provider score normalized to 0-1

## Testing

To test the endpoint:

```bash
# Bank transfer
curl "http://localhost:3000/api/providers?from=US&to=PH&amount=1000&method=bank"

# Cash pickup
curl "http://localhost:3000/api/providers?from=US&to=PH&amount=1000&method=cash"

# Mobile wallet
curl "http://localhost:3000/api/providers?from=US&to=PH&amount=1000&method=wallet"
```

