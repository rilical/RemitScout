import { it, expect } from 'vitest'
import { Pool } from 'pg'
import { describeDbIntegration, withTestTransaction } from './helpers/test-db'

const planeAUrl = process.env.DATABASE_URL_PLANE_A || process.env.DATABASE_URL || 'postgres://remit:remit@localhost:5432/remit'

describeDbIntegration('Plane A Bronze guardrail', () => {
  const bronzeTables = ['provider_raw']

  for (const table of bronzeTables) {
    it(`denies Plane A access to bronze.${table}`, async () => {
      const pool = new Pool({ connectionString: planeAUrl })
      try {
        await withTestTransaction(pool, async () => {
          await pool.query(`SELECT * FROM bronze.${table} LIMIT 1`)
        })
      } catch (error: any) {
        const message = String(error?.message || '')
        expect(message.toLowerCase()).toMatch(/permission|authentication failed/)
        return
      } finally {
        await pool.end()
      }

      throw new Error(`Plane A unexpectedly accessed bronze.${table}`)
    })
  }
})
