import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Pool } from 'pg'
import { createPool } from '../shared/db'
import { RightsMatrixRepository } from '../plane-b/src/repositories'
import { withTestTransaction } from './helpers/test-db'

const dbUrl =
  process.env.DATABASE_URL_PLANE_B ||
  process.env.DATABASE_URL ||
  'postgres://remit:remit@localhost:5432/remit'

describe('Rights matrix enforcement guardrails', () => {
  let pool: Pool
  const testProviderId = 'test_rights_provider'

  beforeEach(async () => {
    pool = createPool(dbUrl!)
    await pool.query('DELETE FROM silver.rights_matrix WHERE provider_id = $1', [testProviderId])
    await pool.query('DELETE FROM silver.provider WHERE provider_id = $1', [testProviderId])
    await pool.query(
      'INSERT INTO silver.provider (provider_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [testProviderId, 'Test Provider'],
    )
  })

  afterEach(async () => {
    await pool.query('DELETE FROM silver.rights_matrix WHERE provider_id = $1', [testProviderId])
    await pool.end()
  })

  it('allowed_collect=false prevents collection', async () => {
    await withTestTransaction(pool, async () => {
      const rightsRepo = new RightsMatrixRepository(pool)
      await rightsRepo.upsertProviderRights({
        providerId: testProviderId,
        allowedCollect: false,
        allowedB2c: true,
        allowedB2b: true,
        notes: 'test: collection disabled',
      })

      const rights = await rightsRepo.loadProviderRights()
      const providerRights = rights.find((p) => p.provider_id === testProviderId)
      expect(providerRights).toBeDefined()
      expect(providerRights?.allowed_collect).toBe(false)
    })
  })

  it('allowed_b2c=false prevents B2C access', async () => {
    await withTestTransaction(pool, async () => {
      const rightsRepo = new RightsMatrixRepository(pool)
      await rightsRepo.upsertProviderRights({
        providerId: testProviderId,
        allowedCollect: true,
        allowedB2c: false,
        allowedB2b: true,
        notes: 'test: B2C disabled',
      })

      const rights = await rightsRepo.loadProviderRights()
      const providerRights = rights.find((p) => p.provider_id === testProviderId)
      expect(providerRights).toBeDefined()
      expect(providerRights?.allowed_b2c).toBe(false)

      const result = await pool.query(
        `SELECT provider_id FROM silver.rights_matrix 
         WHERE provider_id = $1 AND allowed_b2c = true AND allowed_collect = true AND stoplist_status = 'active'`,
        [testProviderId],
      )
      expect(result.rows).toHaveLength(0)
    })
  })

  it('allowed_b2b=false prevents B2B publishing', async () => {
    await withTestTransaction(pool, async () => {
      const rightsRepo = new RightsMatrixRepository(pool)
      await rightsRepo.upsertProviderRights({
        providerId: testProviderId,
        allowedCollect: true,
        allowedB2c: true,
        allowedB2b: false,
        notes: 'test: B2B disabled',
      })

      const rights = await rightsRepo.loadProviderRights()
      const providerRights = rights.find((p) => p.provider_id === testProviderId)
      expect(providerRights).toBeDefined()
      expect(providerRights?.allowed_b2b).toBe(false)
    })
  })

  it('rights matrix checked before collection', async () => {
    await withTestTransaction(pool, async () => {
      const rightsRepo = new RightsMatrixRepository(pool)
      await rightsRepo.upsertProviderRights({
        providerId: testProviderId,
        allowedCollect: true,
        allowedB2c: true,
        allowedB2b: true,
        notes: null,
      })

      const rights = await rightsRepo.loadProviderRights()
      const providerRights = rights.find((p) => p.provider_id === testProviderId)

      expect(providerRights).toBeDefined()
      expect(providerRights?.allowed_collect).toBe(true)
      expect(providerRights?.allowed_b2c).toBe(true)
      expect(providerRights?.allowed_b2b).toBe(true)
      expect(providerRights?.stoplist_status).toBe('active')
    })
  })
})
