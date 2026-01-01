# Sprint 3 Code Map Policy

## Canonical codes
- Country codes follow the frontend alpha-2 list in frontend/utils/countries-currencies.ts.
- Currency codes follow ISO-4217 alpha-3.

## Provider code mapping
- Every provider-specific code must map to a canonical code before normalization.
- Store mappings in provider code-map files and in silver.provider_code_map when discovered.
- Unknown codes map to empty and set quality flag unknown_method or unsupported_corridor.

## Corridor identity
- corridor_id is built from canonical codes: source_country + dest_country + source_currency + dest_currency.
