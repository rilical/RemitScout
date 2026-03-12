import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { initTracing } from '../shared/tracing'
import { createLogger } from '../shared/logger'

initTracing('db-migrate')

const logger = createLogger('db-migrate')

const migrationsDir = path.resolve(__dirname, '..', 'db', 'migrations')

// ---------------------------------------------------------------------------
// Migration file parsing — `-- @rollback` convention
// ---------------------------------------------------------------------------
// Existing migrations 001–112 predate this convention and are treated as
// non-reversible (no `-- @rollback` marker).  New migrations should include a
// `-- @rollback` section or explicitly declare `-- @rollback impossible`.

export interface ParsedMigration {
  forwardSql: string
  rollbackSql: string | null
  isReversible: boolean
}

/**
 * Parse a migration file into forward SQL and optional rollback SQL.
 *
 * Convention:
 *  - `-- @rollback` separates forward SQL from rollback SQL
 *  - `-- @rollback impossible` marks the migration as non-reversible
 *  - No marker at all = non-reversible (backward compatible)
 */
export function parseMigrationFile(_filename: string, content: string): ParsedMigration {
  const impossibleMarker = '-- @rollback impossible'
  const marker = '-- @rollback'

  if (content.includes(impossibleMarker)) {
    const forwardSql = content.substring(0, content.indexOf(impossibleMarker)).trim()
    return { forwardSql, rollbackSql: null, isReversible: false }
  }

  const markerIndex = content.indexOf(marker)
  if (markerIndex === -1) {
    return { forwardSql: content.trim(), rollbackSql: null, isReversible: false }
  }

  const forwardSql = content.substring(0, markerIndex).trim()
  const rollbackSql = content.substring(markerIndex + marker.length).trim()
  return { forwardSql, rollbackSql, isReversible: true }
}

/**
 * Extract the numeric version prefix from a migration filename.
 * e.g. "042_add_users.sql" -> 42
 */
export function extractVersion(filename: string): number {
  const match = filename.match(/^(\d+)_/)
  if (!match) throw new Error(`Invalid migration filename: ${filename}`)
  return parseInt(match[1], 10)
}

// ---------------------------------------------------------------------------
// Connection helpers (unchanged)
// ---------------------------------------------------------------------------

const getConnectionErrorHelp = (error: unknown): string => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorString = String(error)

  if (errorMessage.includes('ECONNREFUSED') || errorString.includes('ECONNREFUSED') ||
      errorMessage.includes('connect') || errorString.includes('connect')) {
    const dbUrl = config.db.planeBUrl || 'not configured'
    const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')

    let help = '\n Database connection failed\n\n'

    if (isLocalhost) {
      help += 'The migration script is trying to connect to a local PostgreSQL database, but it\'s not running.\n\n'
      help += 'Options:\n'
      help += '1. Start a local PostgreSQL instance:\n'
      help += '   - Using Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=remit -e POSTGRES_USER=remit -e POSTGRES_DB=remit postgres:15\n'
      help += '   - Using Homebrew: brew services start postgresql@15\n'
      help += '   - Using Postgres.app (macOS): Download from https://postgresapp.com/\n\n'
      help += '2. Connect to AWS RDS by setting environment variables:\n'
      help += '   export DATABASE_URL_PLANE_B="postgres://user:pass@host:5432/dbname"\n'
      help += '   export DB_SSL_MODE="require"\n\n'
    } else {
      help += 'The migration script is trying to connect to a remote database, but the connection failed.\n\n'
      help += 'Please check:\n'
      help += '1. Database server is running and accessible\n'
      help += '2. Network connectivity (firewall, VPN, etc.)\n'
      help += '3. Connection string is correct (check DATABASE_URL_PLANE_B)\n'
      help += '4. SSL settings are correct (check DB_SSL_MODE)\n\n'
    }

    help += `Current connection string: ${dbUrl.replace(/:[^:@]+@/, ':****@')}\n`
    help += '\nFor more information, see: README.md (or the internal runbook).\n'

    return help
  }

  return ''
}

type MigrationTarget = { label: string; dbUrl: string }
type MigrationRunOptions = { dryRun?: boolean; targetVersion?: number }

const resolveMigratorUrl = (baseUrl?: string): string | undefined => {
  // CI/CD + ops best practice: migrations run with a privileged DB user, application runtime uses a restricted user.
  // Local/dev can set a one-off migrator URL without changing runtime credentials.
  const migrator =
    process.env.DATABASE_URL_PLANE_B_MIGRATOR ||
    process.env.DATABASE_URL_PLANE_C_MIGRATOR ||
    process.env.DATABASE_URL_MIGRATOR
  if (migrator && migrator.trim()) {
    if (process.env.ALLOW_DB_MIGRATOR_URL !== '1') {
      throw new Error(
        'Migrator URL supplied without ALLOW_DB_MIGRATOR_URL=1. Refusing to run with privileged credentials.',
      )
    }
    return migrator.trim()
  }
  return baseUrl
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseCliArgs(): { dryRun: boolean; list: boolean; targetVersion: number | undefined; confirmRollback: boolean } {
  const args = process.argv
  const dryRun = args.includes('--dry-run')
  const list = args.includes('--list')
  const confirmRollback = args.includes('--confirm-rollback')

  let targetVersion: number | undefined
  const tvIndex = args.indexOf('--target-version')
  if (tvIndex !== -1 && tvIndex + 1 < args.length) {
    const parsed = parseInt(args[tvIndex + 1], 10)
    if (Number.isNaN(parsed) || parsed < 0) {
      logger.error('invalid_target_version', {
        value: args[tvIndex + 1],
        message: 'Invalid --target-version value; must be a non-negative integer',
      })
      process.exit(1)
    }
    targetVersion = parsed
  }

  return { dryRun, list, targetVersion, confirmRollback }
}

// ---------------------------------------------------------------------------
// List migrations
// ---------------------------------------------------------------------------

export const listMigrations = async (target: MigrationTarget): Promise<void> => {
  const db = createPool(target.dbUrl)
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )

    const appliedResult = await db.query('SELECT id FROM public.schema_migrations')
    const applied = new Set(appliedResult.rows.map((row: { id: string }) => row.id))

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql') && file !== 'TEMPLATE.sql')
      .sort()

    logger.info('migration_status', {
      target: target.label,
      total: files.length,
      applied: applied.size,
    })

    const header = `${'Version'.padEnd(8)} ${'Filename'.padEnd(55)} ${'Applied'.padEnd(9)} Reversible`
    const separator = '-'.repeat(header.length)
    logger.info(header)
    logger.info(separator)

    for (const file of files) {
      const version = extractVersion(file)
      const isApplied = applied.has(file)

      let reversibleLabel = 'n/a'
      if (isApplied) {
        // Read file to determine reversibility
        const content = await readFile(path.join(migrationsDir, file), 'utf8')
        const parsed = parseMigrationFile(file, content)
        reversibleLabel = parsed.isReversible ? 'yes' : 'no'
      }

      const line = `${String(version).padEnd(8)} ${file.padEnd(55)} ${(isApplied ? 'yes' : 'no').padEnd(9)} ${reversibleLabel}`
      logger.info(line)
    }
  } finally {
    await db.end()
  }
}

// ---------------------------------------------------------------------------
// Rollback migrations
// ---------------------------------------------------------------------------

export const rollbackMigrations = async (
  target: MigrationTarget,
  targetVersion: number,
  confirmRollback: boolean,
): Promise<number> => {
  const db = createPool(target.dbUrl)
  try {
    const appliedResult = await db.query('SELECT id FROM public.schema_migrations ORDER BY id DESC')
    const appliedFiles: string[] = appliedResult.rows.map((row: { id: string }) => row.id)

    // Filter to migrations with version > targetVersion, already sorted descending
    const toRollback = appliedFiles.filter((file) => extractVersion(file) > targetVersion)

    if (toRollback.length === 0) {
      logger.info('rollback_noop', {
        target: target.label,
        targetVersion,
        message: 'No migrations to roll back — already at or below target version',
      })
      return 0
    }

    // Dry-run / confirmation gate
    if (!confirmRollback) {
      logger.warn('rollback_preview', {
        target: target.label,
        targetVersion,
        count: toRollback.length,
        message: 'Rollback preview (no changes applied)',
      })
      for (const file of toRollback) {
        const content = await readFile(path.join(migrationsDir, file), 'utf8')
        const parsed = parseMigrationFile(file, content)
        const status = parsed.isReversible ? 'reversible' : 'NON-REVERSIBLE'
        logger.warn('rollback_candidate', { file, status, message: 'Would roll back' })
      }
      logger.warn('To proceed, re-run with --confirm-rollback')
      return 0
    }

    // Execute rollbacks
    let rolledBack = 0
    for (const file of toRollback) {
      const content = await readFile(path.join(migrationsDir, file), 'utf8')
      const parsed = parseMigrationFile(file, content)

      if (!parsed.isReversible) {
        logger.error('rollback_non_reversible', {
          file,
          message:
            'Cannot roll back non-reversible migration. Aborting rollback. No further migrations will be rolled back.',
        })
        throw new Error(`Migration ${file} is not reversible. Rollback aborted.`)
      }

      await db.query('BEGIN')
      try {
        await db.query(parsed.rollbackSql!)
        await db.query('DELETE FROM public.schema_migrations WHERE id = $1', [file])
        await db.query('COMMIT')
        logger.info('migration_rolled_back', { target: target.label, file })
        rolledBack++
      } catch (error) {
        await db.query('ROLLBACK')
        throw error
      }
    }

    logger.info('rollback_complete', {
      target: target.label,
      rolledBack,
      targetVersion,
    })
    return rolledBack
  } finally {
    await db.end()
  }
}

// ---------------------------------------------------------------------------
// Forward migrations (original logic, now supports --target-version cap)
// ---------------------------------------------------------------------------

export const applyMigrations = async (
  target: MigrationTarget,
  options: MigrationRunOptions = {},
): Promise<number> => {
  const db = createPool(target.dbUrl)
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )

    const appliedResult = await db.query('SELECT id FROM public.schema_migrations')
    const applied = new Set(appliedResult.rows.map((row: { id: string }) => row.id))

    let files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql') && file !== 'TEMPLATE.sql')
      .sort()

    // If --target-version is set, only consider migrations up to that version
    if (options.targetVersion !== undefined) {
      files = files.filter((file) => extractVersion(file) <= options.targetVersion!)
    }

    const pending = files.filter((file) => !applied.has(file))

    if (options.dryRun) {
      if (pending.length === 0) {
        logger.info('migration_dry_run_empty', {
          target: target.label,
          message: 'Dry run: no pending migrations',
        })
      } else {
        logger.info('migration_dry_run_pending', {
          target: target.label,
          count: pending.length,
          message: 'Dry run: pending migrations',
        })
        for (const file of pending) {
          logger.info('migration_pending', { target: target.label, file })
        }
      }
      return pending.length
    }

    let appliedCount = 0
    for (const file of pending) {
      const content = await readFile(path.join(migrationsDir, file), 'utf8')
      const parsed = parseMigrationFile(file, content)
      await db.query('BEGIN')
      try {
        await db.query(parsed.forwardSql)
        await db.query('INSERT INTO public.schema_migrations (id) VALUES ($1)', [file])
        await db.query('COMMIT')
        logger.info('migration_applied', { target: target.label, file })
        appliedCount++
      } catch (error) {
        await db.query('ROLLBACK')
        throw error
      }
    }

    if (appliedCount === 0) {
      logger.info('migration_apply_noop', {
        target: target.label,
        message: 'All migrations are already applied',
      })
    } else {
      logger.info('migration_apply_complete', {
        target: target.label,
        count: appliedCount,
        message: 'Successfully applied migrations',
      })
    }
    return appliedCount
  } finally {
    await db.end()
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export const runMigrations = async (): Promise<void> => {
  const { dryRun, list, targetVersion, confirmRollback } = parseCliArgs()

  const planeBUrl = resolveMigratorUrl(config.db.planeBUrl)
  if (!planeBUrl) {
    logger.error('Database connection string is not configured')
    logger.error('Please set one of: DATABASE_URL_PLANE_B, DATABASE_URL_PLANE_B_MIGRATOR, or DATABASE_URL')
    process.exit(1)
  }

  const targets: MigrationTarget[] = [{ label: 'plane-b', dbUrl: planeBUrl }]
  const planeCUrl = resolveMigratorUrl(config.db.planeCUrl)
  if (planeCUrl && planeCUrl !== planeBUrl) {
    targets.push({ label: 'plane-c', dbUrl: planeCUrl })
  }

  // --list: show migration table and exit
  if (list) {
    for (const target of targets) {
      await listMigrations(target)
    }
    return
  }

  // --target-version N: migrate forward or roll back to version N
  if (targetVersion !== undefined) {
    for (const target of targets) {
      // Determine current max applied version
      const db = createPool(target.dbUrl)
      let currentMax = 0
      try {
        await db.query(
          `CREATE TABLE IF NOT EXISTS public.schema_migrations (
            id TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )`,
        )
        const appliedResult = await db.query('SELECT id FROM public.schema_migrations ORDER BY id DESC LIMIT 1')
        if (appliedResult.rows.length > 0) {
          currentMax = extractVersion(appliedResult.rows[0].id)
        }
      } finally {
        await db.end()
      }

      if (targetVersion >= currentMax) {
        // Forward migration up to targetVersion
        await applyMigrations(target, { dryRun, targetVersion })
      } else {
        // Rollback to targetVersion
        await rollbackMigrations(target, targetVersion, confirmRollback)
      }
    }
    return
  }

  // Default: run all pending migrations forward
  for (const target of targets) {
    await applyMigrations(target, { dryRun })
  }
}

const handleError = (error: unknown) => {
  // Handle AggregateError (common with pg-pool connection errors)
  let errorMessage = ''
  let errorString = ''

  if (error instanceof AggregateError) {
    errorMessage = error.message || ''
    errorString = JSON.stringify(error, null, 2)
    // Check nested errors too
    if (error.errors && error.errors.length > 0) {
      const firstError = error.errors[0]
      if (firstError instanceof Error) {
        errorMessage = firstError.message || errorMessage
        errorString += '\n' + firstError.message
      }
    }
  } else if (error instanceof Error) {
    errorMessage = error.message
    errorString = error.toString()
  } else {
    errorMessage = String(error)
    errorString = String(error)
  }

  logger.error('migration_failed', { error: errorMessage })
  if (errorMessage.toLowerCase().includes('permission denied for schema')) {
    logger.error(
      'Permission denied while applying migrations. ' +
      'This usually means your DATABASE_URL_PLANE_B user is a restricted runtime user. ' +
      'Fix: set DATABASE_URL_PLANE_B_MIGRATOR to a superuser/migrator URL.',
    )
  }
  const help = getConnectionErrorHelp({ message: errorMessage, toString: () => errorString })
  if (help) {
    logger.error(help)
  } else {
    logger.error('For more information, see: README.md (or the internal runbook).')
  }
  process.exit(1)
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  runMigrations().catch(handleError)
}
