# Rights Matrix Enforcement & Recovery

The rights matrix (`silver.rights_matrix`) governs corridor eligibility for each money transfer provider — controlling collection rights, channel visibility, geographic scope, and compliance flags.

## How It Works

### What the Rights Matrix Controls

| Column | Purpose |
|--------|---------|
| `allowed_collect` | Provider can ingest quotes |
| `allowed_b2c` | Visible in B2C frontend |
| `allowed_b2b` | Visible in B2B API |
| `source_countries` | Array of allowed source countries |
| `destination_countries` | Array of allowed destination countries |
| `stoplist_status` | Operational restriction flag |
| `allowed_in_rvi/rci/teer` | Compliance scope flags |

**Key principle:** `null` or empty country arrays **never imply allow-all**. Empty countries = no corridor access (strict enforcement).

### Enforcement Levels

The `rights-matrix-differential.ts` audit compares three modes:

| Mode | Checks Applied |
|------|----------------|
| `enforce` | Full rights + country arrays + capability + method matching |
| `ignore_country` | Rights active only (country arrays bypassed) + capability + method |
| `ignore_all` | Capability + method only (rights entirely skipped) |

The gap between modes reveals where rights restrictions are too narrow vs actual provider capabilities.

## Diagnosis

### Quick Check — Corridor Coverage

```sql
-- Providers with empty country arrays (no corridor access)
SELECT provider_id, source_countries, destination_countries
FROM silver.rights_matrix
WHERE source_countries = '{}' OR destination_countries = '{}';
```

### Run Macro Diagnostic (Hot Lanes)

```bash
make rights-recovery-macro
```

Outputs to `/tmp/remit-scout-artifacts/rights-differential/`:
- `report.json` — provider/corridor gaps ranked by severity
- `report.md` — human-readable enforce/ignore_country/ignore_all counts

### Key Metrics per Corridor

| Metric | Meaning |
|--------|---------|
| `rightsGap` | Providers eligible under `ignore_all` but blocked by `enforce` |
| `capabilityMissing` | No `provider_corridor_capability` row exists |
| `methodMismatch` | Capability exists but payin/payout method unavailable |

### Audit Log (Migration 104)

```sql
-- Check recent rights changes
SELECT provider_id, field_changed, previous_value, new_value, created_at
FROM silver.rights_matrix_audit_log
ORDER BY created_at DESC LIMIT 20;

-- Check last audit time per provider
SELECT provider_id, last_audited_at
FROM silver.rights_matrix
WHERE last_audited_at < NOW() - INTERVAL '7 days'
ORDER BY last_audited_at ASC;
```

## Recovery Procedures

### Global Recovery (All Providers/Corridors)

```bash
make rights-recovery-global           # Dry-run strict audit
make rights-recovery-global-apply     # Full audit + apply + validation
```

### Macro Recovery (Hot Lanes — USD/AED/GBP/EUR)

```bash
make rights-recovery-macro                                        # Dry-run
make rights-recovery-macro-apply APPLY_PROVIDERS=wise,remitly     # Apply to specific providers
```

### Recovery Flow

1. **`capability:seed-*`** — Populate `provider_corridor_capability` from discovery scans
2. **`rights:sync-countries`** (`STRICT_COUNTRY_SYNC=1`) — Sync discovered country support into rights matrix
3. **`rights:differential`** (`STRICT_DATA_HEALTH=1`) — Audit enforce/ignore_country/ignore_all gaps
4. **`rights:delta-capability`** — Propose widening source/destination_countries (`APPLY=1` to write)
5. **`rights:validate-activation`** — Post-migration SQL checks + hot-lane forensics

### Promotion Path

Run the same command sequence per environment:
```
dev → staging → prod
```

Use `OPS_AWS_ENV=staging` (or `prod`) via Makefile to target environments.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Provider quotes not appearing in API | `allowed_b2b=false` or empty country arrays | Update rights matrix, run `rights:validate-activation` |
| Provider visible in B2C but not B2B | `allowed_b2b=false`, `allowed_b2c=true` | Set `allowed_b2b=true` if authorized |
| New corridor not collecting | `source_countries` missing the country | Run `rights:sync-countries` with `STRICT_COUNTRY_SYNC=1` |
| Rights gap detected but no action taken | `APPLY=1` not set (dry-run mode) | Re-run with `APPLY=1` |
| Audit log missing entries | Migration 104 not applied | Run `pnpm db:migrate` |

## Prevention

- Run `make rights-recovery-macro` after adding new providers or corridors
- Monitor `last_audited_at` — flag providers not audited in 7+ days
- Review `rights_matrix_audit_log` for unexpected changes
- Enable `STRICT_DATA_HEALTH=1` in CI for pre-deploy validation

## Related

- `silver.rights_matrix` — main enforcement table
- `silver.rights_matrix_audit_log` — change history (migration 104)
- `silver.provider_corridor_capability` — capability matrix
- `backend/db/migrations/104_rights_matrix_audit_tracking.sql` — audit schema
- `docs/runbooks/agent-operations.md` — general agent operations
