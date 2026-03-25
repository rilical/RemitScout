import { it, expect, beforeEach, afterEach } from 'vitest'
import type { Pool } from 'pg'
import { createPool } from '../shared/db'
import { RightsMatrixRepository } from '../plane-b/src/repositories'
import { describeDbIntegration } from './helpers/test-db'

const dbUrl =
  process.env.DATABASE_URL_PLANE_B ||
  process.env.DATABASE_URL ||
  'postgres://remit:remit@localhost:5432/remit'

describeDbIntegration('Rights matrix audit logging', () => {
  let pool: Pool
  const testProviderId = 'test_audit_log_provider'

  beforeEach(async () => {
    pool = createPool(dbUrl!)
    await pool.query('DELETE FROM silver.rights_matrix_audit_log WHERE provider_id = $1', [testProviderId])
    await pool.query('DELETE FROM silver.rights_matrix WHERE provider_id = $1', [testProviderId])
    await pool.query('DELETE FROM silver.provider WHERE provider_id = $1', [testProviderId])
    await pool.query(
      'INSERT INTO silver.provider (provider_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [testProviderId, 'Test Audit Log Provider'],
    )
  })

  afterEach(async () => {
    await pool.query('DELETE FROM silver.rights_matrix_audit_log WHERE provider_id = $1', [testProviderId])
    await pool.query('DELETE FROM silver.rights_matrix WHERE provider_id = $1', [testProviderId])
    await pool.end()
  })

  it('audit log written when upsertProviderCountrySupport changes values', async () => {
    const rightsRepo = new RightsMatrixRepository(pool)

    // First upsert — inserts from scratch (prev is null/empty)
    await rightsRepo.upsertProviderCountrySupport({
      providerId: testProviderId,
      sourceCountries: ['US'],
      destinationCountries: ['MX'],
    })

    // Second upsert — changes source_countries from ['US'] to ['US', 'UK']
    await rightsRepo.upsertProviderCountrySupport({
      providerId: testProviderId,
      sourceCountries: ['US', 'UK'],
      destinationCountries: ['MX'],
    })

    const result = await pool.query<{
      field_changed: string
      previous_value: string[] | null
      new_value: string[] | null
      change_source: string
    }>(
      `SELECT field_changed, previous_value, new_value, change_source
         FROM silver.rights_matrix_audit_log
        WHERE provider_id = $1
          AND field_changed = 'source_countries'
        ORDER BY id`,
      [testProviderId],
    )

    // The second upsert must have created exactly one audit entry for source_countries
    const secondUpsertEntry = result.rows[result.rows.length - 1]
    expect(secondUpsertEntry).toBeDefined()
    expect(secondUpsertEntry.field_changed).toBe('source_countries')
    expect(secondUpsertEntry.previous_value).toEqual(['US'])
    expect(secondUpsertEntry.new_value).toEqual(['US', 'UK'])
    expect(secondUpsertEntry.change_source).toBe('manual')
  })

  it('no audit log when country values unchanged', async () => {
    const rightsRepo = new RightsMatrixRepository(pool)

    // First upsert — creates audit entries because prev was null/empty
    await rightsRepo.upsertProviderCountrySupport({
      providerId: testProviderId,
      sourceCountries: ['US'],
      destinationCountries: ['MX'],
    })

    const countAfterFirst = await pool.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM silver.rights_matrix_audit_log WHERE provider_id = $1',
      [testProviderId],
    )
    const afterFirstCount = parseInt(countAfterFirst.rows[0].count, 10)

    // Second upsert — same values, should produce no new audit entries
    await rightsRepo.upsertProviderCountrySupport({
      providerId: testProviderId,
      sourceCountries: ['US'],
      destinationCountries: ['MX'],
    })

    const countAfterSecond = await pool.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM silver.rights_matrix_audit_log WHERE provider_id = $1',
      [testProviderId],
    )
    const afterSecondCount = parseInt(countAfterSecond.rows[0].count, 10)

    expect(afterSecondCount).toBe(afterFirstCount)
  })

  it('audit log written for governance changes', async () => {
    const rightsRepo = new RightsMatrixRepository(pool)

    // Set up a base rights row
    await rightsRepo.upsertProviderRights({
      providerId: testProviderId,
      allowedCollect: true,
      allowedB2c: true,
      allowedB2b: true,
      notes: null,
    })

    await pool.query('DELETE FROM silver.rights_matrix_audit_log WHERE provider_id = $1', [testProviderId])

    // Update governance — triggers audit for 'status' (and 'reviewer' if it changed)
    await rightsRepo.updateGovernance({
      providerId: testProviderId,
      status: 'beta',
      reviewer: 'test-reviewer',
    })

    const result = await pool.query<{
      field_changed: string
      new_value: string
      change_source: string
    }>(
      `SELECT field_changed, new_value, change_source
         FROM silver.rights_matrix_audit_log
        WHERE provider_id = $1
          AND field_changed = 'status'`,
      [testProviderId],
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].field_changed).toBe('status')
    expect(result.rows[0].new_value).toBe('"beta"')
    expect(result.rows[0].change_source).toBe('governance')
  })

  it('audit log written for quality metrics changes', async () => {
    const rightsRepo = new RightsMatrixRepository(pool)

    // Set up a base rights row
    await rightsRepo.upsertProviderRights({
      providerId: testProviderId,
      allowedCollect: true,
      allowedB2c: true,
      allowedB2b: true,
      notes: null,
    })

    // Set initial quality metrics so we have a non-null prev for the comparison
    await rightsRepo.updateQualityMetrics({
      providerId: testProviderId,
      uptimeLast30d: 0.80,
      avgQuoteLatencyMs: 200,
    })

    await pool.query('DELETE FROM silver.rights_matrix_audit_log WHERE provider_id = $1', [testProviderId])

    // Update to new values — both fields differ, so both must be logged
    await rightsRepo.updateQualityMetrics({
      providerId: testProviderId,
      uptimeLast30d: 0.95,
      avgQuoteLatencyMs: 150,
    })

    const result = await pool.query<{
      field_changed: string
      change_source: string
    }>(
      `SELECT field_changed, change_source
         FROM silver.rights_matrix_audit_log
        WHERE provider_id = $1
        ORDER BY field_changed`,
      [testProviderId],
    )

    const fields = result.rows.map((r) => r.field_changed)
    expect(fields).toContain('uptime_last_30d')
    expect(fields).toContain('avg_quote_latency_ms')
    result.rows.forEach((row) => {
      expect(row.change_source).toBe('quality_metrics_job')
    })
  })

  it('last_audited_at updated on country support change', async () => {
    const rightsRepo = new RightsMatrixRepository(pool)

    await rightsRepo.upsertProviderCountrySupport({
      providerId: testProviderId,
      sourceCountries: ['US'],
      destinationCountries: ['MX'],
    })

    const result = await pool.query<{ last_audited_at: Date | null }>(
      'SELECT last_audited_at FROM silver.rights_matrix WHERE provider_id = $1',
      [testProviderId],
    )

    const lastAuditedAt = result.rows[0]?.last_audited_at
    expect(lastAuditedAt).not.toBeNull()

    const now = new Date()
    const diffMs = now.getTime() - new Date(lastAuditedAt!).getTime()
    expect(diffMs).toBeGreaterThanOrEqual(0)
    expect(diffMs).toBeLessThan(10_000)
  })

  it('changeSource correctly set per path', async () => {
    const rightsRepo = new RightsMatrixRepository(pool)

    await rightsRepo.upsertProviderCountrySupport({
      providerId: testProviderId,
      sourceCountries: ['US'],
      destinationCountries: ['MX'],
      changeSource: 'sync_countries',
    })

    const result = await pool.query<{ change_source: string }>(
      `SELECT change_source
         FROM silver.rights_matrix_audit_log
        WHERE provider_id = $1
        LIMIT 1`,
      [testProviderId],
    )

    expect(result.rows.length).toBeGreaterThan(0)
    expect(result.rows[0].change_source).toBe('sync_countries')
  })
})
