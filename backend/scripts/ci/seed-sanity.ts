import { createPool } from '../../shared/db'
import { config } from '../../shared/config'

const requiredTables = [
  { schema: 'silver', table: 'provider' },
  { schema: 'silver', table: 'corridor' },
  { schema: 'silver', table: 'latest_quote_by_provider' },
  { schema: 'gold', table: 'fx_rates' },
  { schema: 'gold', table: 'pulse_cache' },
]

const run = async () => {
  if (!config.db.planeBUrl) {
    throw new Error('DATABASE_URL_PLANE_B is required for seed sanity checks')
  }

  const pool = createPool(config.db.planeBUrl)
  try {
    const result = await pool.query<{
      table_schema: string
      table_name: string
    }>(
      `SELECT table_schema, table_name
       FROM information_schema.tables
       WHERE table_schema IN ('silver', 'gold', 'bronze')`,
    )

    const tables = new Set(
      result.rows.map((row) => `${row.table_schema}.${row.table_name}`),
    )

    const missing = requiredTables.filter(
      (entry) => !tables.has(`${entry.schema}.${entry.table}`),
    )

    if (missing.length > 0) {
      throw new Error(
        `Missing required tables: ${missing
          .map((entry) => `${entry.schema}.${entry.table}`)
          .join(', ')}`,
      )
    }

    for (const entry of requiredTables) {
      const check = await pool.query<{ exists: boolean }>(
        'SELECT COALESCE(has_table_privilege(to_regclass($1), \'SELECT\'), false) AS exists',
        [`${entry.schema}.${entry.table}`],
      )

      if (!check.rows[0]?.exists) {
        throw new Error(`Insufficient SELECT privilege for ${entry.schema}.${entry.table}`)
      }
    }

    console.log('✅ Gold/Silver seed sanity checks passed')
  } finally {
    await pool.end()
  }
}

run().catch((error) => {
  console.error('Seed sanity checks failed:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
