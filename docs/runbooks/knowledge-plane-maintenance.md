# Knowledge Plane Maintenance & Re-indexing

The Knowledge Plane provides contextual knowledge to agents during self-healing by indexing and retrieving relevant project knowledge via PostgreSQL full-text search.

## How It Works

**Implementation:** `backend/plane-b/src/agents/knowledge-plane.ts`

### What Gets Indexed

| Source Type | Content | Trigger |
|-------------|---------|---------|
| `code` | Parser (`parse.ts`), fetcher (`fetch.ts`), config (`config.ts`) per provider | `indexProviderSources()` on deploy or patch |
| `failure` | Failure bundles with category, error type, error message | `indexFailureBundle()` via failure-detector |
| `repair` | Successful repairs with description and PR URL | `indexRepair()` via patch-deployer |
| `documentation` | API contracts and provider docs | Future |
| `observation` | Raw data payloads from collectors | Future |

All chunks stored in `silver.knowledge_chunk`:
- `chunk_id` (UUID), `source_type`, `source_path`, `content` (full text), `metadata` (JSONB)
- Upserted by `source_path` to prevent duplicates

### Retrieval

Search uses `to_tsvector('english', content) @@ plainto_tsquery('english', $query)` with `ts_rank()` scoring:
- Scores normalized to [0.0, 1.0] range
- Minimum relevance threshold: `0.01`
- Optional filtering by `sourceType`, `moduleId`, `providerId`

### Quality Assessment

`searchWithQuality()` returns a quality report:

| Metric | Value |
|--------|-------|
| `highRelevanceCount` | score >= 0.7 |
| `mediumRelevanceCount` | score >= 0.3 |
| `lowRelevanceCount` | score < 0.3 |
| `sufficient` | `true` if highCount >= 1 OR mediumCount >= 2 OR avg >= 0.4 |

CloudWatch metrics:
- `knowledge_retrieval_total` — all retrievals
- `knowledge_retrieval_insufficient` — when `sufficient=false`

## Health Checks

### Chunk Inventory

```sql
SELECT source_type, COUNT(*) as chunk_count
FROM silver.knowledge_chunk
GROUP BY source_type
ORDER BY chunk_count DESC;
```

### Provider Coverage

```sql
-- Check which providers are missing parser or fetch source chunks
SELECT p.slug,
  COUNT(*) FILTER (WHERE kc.metadata->>'fileType' = 'parse') as parse_chunks,
  COUNT(*) FILTER (WHERE kc.metadata->>'fileType' = 'fetch') as fetch_chunks
FROM silver.provider p
LEFT JOIN silver.knowledge_chunk kc
  ON kc.metadata->>'providerId' = p.provider_id::text
  AND kc.source_type = 'code'
GROUP BY p.slug
HAVING COUNT(*) FILTER (WHERE kc.metadata->>'fileType' = 'parse') = 0
    OR COUNT(*) FILTER (WHERE kc.metadata->>'fileType' = 'fetch') = 0;
```

### Freshness

```sql
-- Stale chunks (not updated in 7+ days)
SELECT source_type, source_path, updated_at
FROM silver.knowledge_chunk
WHERE updated_at < NOW() - INTERVAL '7 days'
  AND source_type = 'code'
ORDER BY updated_at ASC;
```

## Re-indexing

### Automatic Triggers

- **New provider added** — `indexProviderSources()` called during registration
- **Repair applied** — `indexRepair()` called by patch-deployer after merge
- **Failure detected** — `indexFailureBundle()` called by failure-detector

### Manual Re-index (Single Provider)

```sql
-- Clear stale chunks for a provider, then re-ingest
DELETE FROM silver.knowledge_chunk
WHERE metadata->>'providerId' = '<provider-id>'
  AND source_type = 'code';
```

Then trigger `indexProviderSources()` by restarting the agent orchestrator or via manual invocation.

### Full Re-index

```sql
-- Nuclear option: clear all code chunks and re-index
DELETE FROM silver.knowledge_chunk WHERE source_type = 'code';
```

Restart the agent orchestrator — it will re-index all providers on the next cycle.

### PostgreSQL FTS Index Rebuild

```sql
-- If FTS index is corrupt or out of sync
REINDEX TABLE silver.knowledge_chunk;
```

## Troubleshooting

### Low Retrieval Quality (KnowledgePlaneRetrievalQuality WARNING)

**Meaning:** >50% of knowledge retrievals return `sufficient=false`.

| Symptom | Cause | Fix |
|---------|-------|-----|
| `sufficient=false`, low scores | Query too specific; FTS stop words | Broaden query terms |
| `totalChunks=0` | Source not indexed | Run `indexProviderSources()` |
| Skewed `sourceTypeDistribution` | Missing source type (e.g., no fetch.ts) | Verify provider sources are indexed |
| High latency | FTS on large 10KB+ files | Consider sub-file chunking (future) |
| Stale code chunks | Updates not re-indexed post-deploy | Add re-index to deployment hook |

### Diagnosis Steps

1. Check chunk inventory (query above)
2. If low count, check which providers are missing coverage
3. If chunks exist but relevance is low, test search queries manually:
   ```sql
   SELECT source_path, ts_rank(to_tsvector('english', content),
     plainto_tsquery('english', 'your search terms')) as rank
   FROM silver.knowledge_chunk
   ORDER BY rank DESC LIMIT 10;
   ```
4. Check CloudWatch for `knowledge_retrieval_insufficient` spike

## Related

- `backend/plane-b/src/agents/knowledge-plane.ts` — main implementation
- `docs/runbooks/agent-infrastructure.md` — general agent operations
- `docs/runbooks/agent-operations.md` — agent pipeline overview
