# Sprint 3 Bucket Policy

## Buckets
- 50, 100, 500, 1000, 3000, 10000.

## Nearest bucket for FX
- Use the nearest bucket for FX rate selection.
- Return bucket_used and approximate=true when request is not exact.

## Floor bucket for fees
- Fee fields must use the floor bucket (never round up).
- This prevents fee waiver misrepresentation (example: 353 should not use 500 fee bucket).

## Minimum send
- Minimum send is USD 50 equivalent.
- Requests below min return 400. Do not bucket up.
