import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationsDir = path.join(process.cwd(), 'db', 'migrations')

const migrationSql = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql') && file !== 'TEMPLATE.sql' && file !== 'TEMPLATE.sql.example')
  .sort()
  .map((file) => readFileSync(path.join(migrationsDir, file), 'utf8'))
  .join('\n')

describe('triangulated index grants', () => {
  it('grants plane_a read access to gold_export.triangulated_index', () => {
    expect(migrationSql).toMatch(
      /GRANT\s+SELECT(?:\s*,\s*INSERT(?:\s*,\s*UPDATE(?:\s*,\s*DELETE)?)?)?\s+ON\s+gold_export\.triangulated_index\s+TO\s+plane_a;/i,
    )
  })
})
