import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { createPool } from '../shared/db'
import { config } from '../shared/config'

const migrationsDir = path.resolve(__dirname, '..', 'db', 'migrations')

const run = async () => {
  const db = createPool(config.db.planeBUrl)
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )

    const appliedResult = await db.query('SELECT id FROM public.schema_migrations')
    const applied = new Set(appliedResult.rows.map(row => row.id))

    const files = (await readdir(migrationsDir))
      .filter(file => file.endsWith('.sql'))
      .sort()

    for (const file of files) {
      if (applied.has(file)) continue
      const sql = await readFile(path.join(migrationsDir, file), 'utf8')
      await db.query('BEGIN')
      try {
        await db.query(sql)
        await db.query('INSERT INTO public.schema_migrations (id) VALUES ($1)', [file])
        await db.query('COMMIT')
        console.log(`Applied migration: ${file}`)
      } catch (error) {
        await db.query('ROLLBACK')
        throw error
      }
    }
  } finally {
    await db.end()
  }
}

run().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
