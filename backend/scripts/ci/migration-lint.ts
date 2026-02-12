import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

type Violation = {
  file: string
  statement: string
  reason: string
}

const migrationsDir = path.resolve(__dirname, '../../db/migrations')

const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim()

const getNewMigrationFiles = (): string[] => {
  const baseRef = process.env.GITHUB_BASE_REF?.trim()

  if (baseRef) {
    try {
      execSync(`git fetch origin ${baseRef} --depth=1`, { stdio: 'ignore' })
      const diff = execSync(
        `git diff --name-only --diff-filter=A origin/${baseRef}...HEAD -- db/migrations`,
        { encoding: 'utf8' },
      )
      const files = diff
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => path.basename(line))
        .filter((line) => line.endsWith('.sql'))
      if (files.length > 0) {
        return files
      }
    } catch (error) {
      console.warn('[migration-lint] failed to diff against base ref, falling back', {
        baseRef,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  try {
    const status = execSync('git status --porcelain -- db/migrations', { encoding: 'utf8' })
    return status
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[A-Z?]{1,2}\s+/, '').trim())
      .filter((line) => line.endsWith('.sql'))
      .map((line) => path.basename(line))
  } catch (error) {
    console.warn('[migration-lint] failed to read git status', {
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

const run = async () => {
  const available = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort()
  const newFiles = new Set(getNewMigrationFiles())
  const files = available.filter((file) => newFiles.has(file))

  if (files.length === 0) {
    console.log('Migration lint skipped (no new migration files detected).')
    return
  }

  const violations: Violation[] = []

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file)
    const raw = await readFile(fullPath, 'utf8')
    const withoutLineComments = raw.replace(/--.*$/gm, '')
    const statements = withoutLineComments
      .split(';')
      .map((statement) => normalize(statement))
      .filter(Boolean)

    for (const statement of statements) {
      const upper = statement.toUpperCase()

      if (upper.startsWith('CREATE TABLE') || upper.startsWith('CREATE INDEX')) {
        if (!upper.includes('IF NOT EXISTS')) {
          violations.push({
            file,
            statement,
            reason: 'CREATE TABLE/INDEX must include IF NOT EXISTS',
          })
        }
      }

      if (
        upper.startsWith('DROP TABLE')
        || upper.startsWith('DROP INDEX')
        || upper.startsWith('DROP VIEW')
        || upper.startsWith('DROP SCHEMA')
      ) {
        if (!upper.includes('IF EXISTS')) {
          violations.push({
            file,
            statement,
            reason: 'DROP TABLE/INDEX/VIEW/SCHEMA must include IF EXISTS',
          })
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('Migration lint failed:')
    for (const violation of violations) {
      console.error(`- ${violation.file}: ${violation.reason}`)
      console.error(`  ${violation.statement}`)
    }
    process.exit(1)
  }

  console.log(`Migration lint passed (${files.length} new migration file(s) checked).`)
}

run().catch((error) => {
  console.error('Migration lint failed with an unexpected error:', error)
  process.exit(1)
})
