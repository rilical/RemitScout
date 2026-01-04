import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Pool } from 'pg'
import { createPool } from '../shared/db'
import { resumeProviderIfCooldownExpired, pauseProviderForBlock } from '../plane-b/src/collectors/base'
import { checkCircuitState } from '../plane-b/src/lib/redis-circuit-breaker'
import { RightsMatrixRepository } from '../plane-b/src/repositories'
import { CircuitBreakerRepository } from '../plane-b/src/repositories'

const shouldRun = process.env.RUN_STOPLIST_TEST === '1'
const dbUrl = process.env.DATABASE_URL_PLANE_B || process.env.DATABASE_URL

const skipTest = !shouldRun || !dbUrl

describe('Stoplist enforcement guardrails', () => {
  if (skipTest) {
    it.skip('RUN_STOPLIST_TEST=1 and DATABASE_URL_PLANE_B required', () => {})
    return
  }

  let pool: Pool
  const testProviderId = 'test_stoplist_provider'
  const testCorridorId = 'us-ph'

  beforeEach(async () => {
    pool = createPool(dbUrl!)
    await pool.query('DELETE FROM silver.rights_matrix WHERE provider_id = $1', [testProviderId])
    await pool.query('DELETE FROM silver.circuit_breaker WHERE provider_id = $1', [testProviderId])
    await pool.query('DELETE FROM silver.provider WHERE provider_id = $1', [testProviderId])
    await pool.query(
      'INSERT INTO silver.provider (provider_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [testProviderId, 'Test Provider'],
    )
  })

  afterEach(async () => {
    await pool.query('DELETE FROM silver.rights_matrix WHERE provider_id = $1', [testProviderId])
    await pool.query('DELETE FROM silver.circuit_breaker WHERE provider_id = $1', [testProviderId])
    await pool.end()
  })

  it('stoplisted provider is skipped during ingestion', async () => {
    const rightsRepo = new RightsMatrixRepository(pool)
    await rightsRepo.upsertProviderRights({
      providerId: testProviderId,
      allowedCollect: true,
      allowedB2c: true,
      allowedB2b: true,
      notes: null,
    })
    await rightsRepo.pauseProvider(testProviderId, 'manual_stoplist')

    const resumeStatus = await resumeProviderIfCooldownExpired(pool, testProviderId)
    expect(resumeStatus.canCollect).toBe(false)
    expect(resumeStatus.reason).toBe('manual_stoplist')

    const status = await rightsRepo.getProviderStatus(testProviderId)
    expect(status?.stoplist_status).toBe('paused')
  })

  it('circuit breaker open prevents collection', async () => {
    const circuitRepo = new CircuitBreakerRepository(pool)
    const cooldownUntil = new Date(Date.now() + 3600000).toISOString()
    await circuitRepo.openCircuit(testProviderId, testCorridorId, 'test_block', cooldownUntil)

    const circuitState = await checkCircuitState(pool, testProviderId, testCorridorId)
    expect(circuitState).toBe('open')

    const circuitStateProvider = await checkCircuitState(pool, testProviderId, null)
    expect(circuitStateProvider).toBe('open')
  })

  it('stop-on-block updates stoplist automatically', async () => {
    const cooldownMs = 3600000
    await pauseProviderForBlock(pool, testProviderId, testCorridorId, 'http_403', cooldownMs)

    const rightsRepo = new RightsMatrixRepository(pool)
    const status = await rightsRepo.getProviderStatus(testProviderId)
    expect(status?.stoplist_status).toBe('paused')
    expect(status?.notes).toContain('auto_paused:http_403')

    const circuitRepo = new CircuitBreakerRepository(pool)
    const circuit = await circuitRepo.getCircuitState(testProviderId, testCorridorId)
    expect(circuit?.state).toBe('open')
  })

  it('active provider is not skipped', async () => {
    const rightsRepo = new RightsMatrixRepository(pool)
    await rightsRepo.upsertProviderRights({
      providerId: testProviderId,
      allowedCollect: true,
      allowedB2c: true,
      allowedB2b: true,
      notes: null,
    })
    await rightsRepo.setProviderActive(testProviderId)

    const resumeStatus = await resumeProviderIfCooldownExpired(pool, testProviderId)
    expect(resumeStatus.canCollect).toBe(true)
    expect(resumeStatus.reason).toBe('active')

    const circuitState = await checkCircuitState(pool, testProviderId, null)
    expect(circuitState).toBe('closed')
  })
})



