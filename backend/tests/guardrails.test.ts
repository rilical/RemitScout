import { describe, it, expect } from 'vitest'
import { Pool } from 'pg'

const shouldRun = process.env.RUN_BRONZE_GUARDRAIL_TEST === '1'
const planeAUrl = process.env.DATABASE_URL_PLANE_A

const skipGuardrail = !shouldRun || !planeAUrl

describe('Plane A Bronze guardrail', () => {
  if (skipGuardrail) {
    it.skip('RUN_BRONZE_GUARDRAIL_TEST=1 and DATABASE_URL_PLANE_A required', () => {})
    return
  }

  it('denies Plane A access to bronze schema', async () => {
    const pool = new Pool({ connectionString: planeAUrl })
    try {
      await pool.query('SELECT * FROM bronze.provider_raw LIMIT 1')
    } catch (error: any) {
      const message = String(error?.message || '')
      expect(message.toLowerCase()).toContain('permission')
      return
    } finally {
      await pool.end()
    }

    throw new Error('Plane A unexpectedly accessed bronze data')
  })
})
