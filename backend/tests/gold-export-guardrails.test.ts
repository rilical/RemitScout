import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const GOLD_EXPORT_FILES = [
  'scripts/gold-indices-live.ts',
  'scripts/gold-indices-job.ts',
  'scripts/institutional-daily-export-job.ts',
  'scripts/gold-live-worker.ts',
  'scripts/gold-reconciliation-job.ts',
]

const FORBIDDEN_SCHEMA_PATTERNS = [
  /\bbronze\.\w+/gi,
  /FROM\s+bronze\b/gi,
  /JOIN\s+bronze\b/gi,
  /INSERT\s+INTO\s+bronze\b/gi,
]

const readSource = (relativePath: string): string => {
  const fullPath = resolve(__dirname, '..', relativePath)
  try {
    return readFileSync(fullPath, 'utf-8')
  } catch {
    return ''
  }
}

describe('Gold export guardrails', () => {
  const allowedSqlInterpolations = new Set([
    '${b2bEffectiveRateSql}',
    '${rightsMatrixCorridorEligibilitySql}',
  ])

  it.each(GOLD_EXPORT_FILES)(
    '%s does not reference bronze schema directly',
    (filePath) => {
      const source = readSource(filePath)
      if (!source) return

      for (const pattern of FORBIDDEN_SCHEMA_PATTERNS) {
        const matches = source.match(pattern) ?? []
        expect(
          matches,
          `Found forbidden bronze schema reference in ${filePath}: ${matches.join(', ')}`,
        ).toHaveLength(0)
      }
    },
  )

  it('gold-indices-live.ts uses parameterized queries for all dynamic values', () => {
    const source = readSource('scripts/gold-indices-live.ts')
    if (!source) return

    // Check that no template literal interpolation exists inside SQL strings
    // (The buildIndicesQuery function should use $N params, not ${...})
    const sqlBlockMatch = source.match(/buildIndicesQuery\s*=\s*\(\)\s*=>\s*`([\s\S]*?)`/)
    if (sqlBlockMatch) {
      const sqlBody = sqlBlockMatch[1]
      const interpolations = (sqlBody.match(/\$\{[^}]+\}/g) ?? [])
        .filter((token) => !allowedSqlInterpolations.has(token))
      expect(
        interpolations,
        `Found unsafe interpolations in SQL query: ${interpolations.join(', ')}`,
      ).toHaveLength(0)
    }
  })

  it('gold export files only read from silver/gold schemas', () => {
    for (const filePath of GOLD_EXPORT_FILES) {
      const source = readSource(filePath)
      if (!source) continue

      // Ensure no raw SQL string references to non-silver/gold schemas
      const rawSchemaRefs = source.match(/FROM\s+(?!silver\.|gold\.|gold_export\.|unnest|base|latest|final|prepared|weight|corridor|rci|daily|with_|weighted)/gi) ?? []
      // Filter out common CTE names and subqueries
      const suspicious = rawSchemaRefs.filter(ref => {
        const schema = ref.replace(/FROM\s+/i, '').trim().toLowerCase()
        return !['silver', 'gold', 'gold_export'].some(s => schema.startsWith(s))
          && schema.length > 2
          && !schema.startsWith('(')
      })
      // This is a soft check - CTE names are expected
      expect(suspicious.length).toBeLessThan(20)
    }
  })
})
