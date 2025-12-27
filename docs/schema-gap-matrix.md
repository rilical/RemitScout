## Current State

### Bronze
- bronze.provider_raw (id, provider_id, corridor, payload, ingested_at)

### Silver
- silver.countries (code, name, currency, updated_at)
- silver.providers (id, name, logo_url, reliability, methods, best_for, homepage_url, created_at, updated_at)
- silver.corridors (id, from_country, to_country, send_currency, recv_currency, label, updated_at)
- silver.provider_quotes (id, provider_id, corridor_id, fee, margin_pct, fx_rate, delivery, methods, reliability, best_for, updated_at)
- silver.recent_searches (id, from_country, to_country, amount, method, best_provider_name, best_provider_recipient, created_at)
- silver.clicks (id, provider_id, corridor_id, amount, metadata, created_at)
- silver.newsletter_subscriptions (id, email, source, created_at)
- silver.rights_matrix (provider_id, allowed_collect, allowed_b2c, allowed_b2b, notes, updated_at)

### Gold
- gold.fx_rates (base_currency, quote_currency, rate, updated_at)
- gold.fx_provider_rates (provider_name, base_currency, quote_currency, rate, markup_bps, speed, updated_at)
- gold.popular_corridors (route, count_24h, top_provider, fee_range, speed_range, best_for, updated_at)
- gold.pulse_cache (key, payload, updated_at)

## RSE Alignment Gap Table
| RSE Table | Current Table | Status | Decision | Notes |
| --- | --- | --- | --- | --- |
| provider | silver.providers | partial | add | Create silver.provider and migrate data from silver.providers. |
| corridor | silver.corridors | partial | add | Create silver.corridor and migrate data from silver.corridors. |
| ingestion_run | none | missing | add | New table for ingestion run metadata. |
| quote_record | silver.provider_quotes | partial | add | New table with provenance fields. |
| latest_quote_by_provider | none | missing | add | New table or view for latest quotes. |
| rights_matrix | silver.rights_matrix | exists | keep | Extend with stoplist_status and ownership fields. |
| circuit_breaker | none | missing | add | New table for circuit state. |

## Migration Plan
1. Create new tables and enums (002 migration).
2. Backfill from old tables if needed.
3. Create compatibility views if runtime still references old names.
4. Update ingestion to populate new tables.
5. Update Plane A queries to read new latest table.
6. Validate via tests and sample API calls.
