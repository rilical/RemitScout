import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { initTracing } from '../shared/tracing'

initTracing('db-migrate')

const migrationsDir = path.resolve(__dirname, '..', 'db', 'migrations')

const getConnectionErrorHelp = (error: unknown): string => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorString = String(error)
  
  if (errorMessage.includes('ECONNREFUSED') || errorString.includes('ECONNREFUSED') || 
      errorMessage.includes('connect') || errorString.includes('connect')) {
    const dbUrl = config.db.planeBUrl || 'not configured'
    const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')
    
    let help = '\n❌ Database connection failed\n\n'
    
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
type MigrationRunOptions = { dryRun?: boolean }

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
    const applied = new Set(appliedResult.rows.map((row) => row.id))

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort()
    const pending = files.filter((file) => !applied.has(file))

    if (options.dryRun) {
      if (pending.length === 0) {
        console.log(`[${target.label}] ✅ Dry run: no pending migrations`)
      } else {
        console.log(`[${target.label}] 🔎 Dry run: ${pending.length} pending migration(s):`)
        for (const file of pending) {
          console.log(`[${target.label}] - ${file}`)
        }
      }
      return pending.length
    }

    let appliedCount = 0
    for (const file of pending) {
      const sql = await readFile(path.join(migrationsDir, file), 'utf8')
      await db.query('BEGIN')
      try {
        await db.query(sql)
        await db.query('INSERT INTO public.schema_migrations (id) VALUES ($1)', [file])
        await db.query('COMMIT')
        console.log(`[${target.label}] ✅ Applied migration: ${file}`)
        appliedCount++
      } catch (error) {
        await db.query('ROLLBACK')
        throw error
      }
    }

    if (appliedCount === 0) {
      console.log(`[${target.label}] ✅ All migrations are already applied`)
    } else {
      console.log(`\n[${target.label}] ✅ Successfully applied ${appliedCount} migration(s)`)
    }
    return appliedCount
  } finally {
    await db.end()
  }
}

export const runMigrations = async (): Promise<void> => {
  const dryRun = process.argv.includes('--dry-run')
  const planeBUrl = resolveMigratorUrl(config.db.planeBUrl)
  if (!planeBUrl) {
    console.error('\n❌ Database connection string is not configured\n')
    console.error('Please set one of the following environment variables:')
    console.error('  - DATABASE_URL_PLANE_B (recommended)')
    console.error('  - DATABASE_URL_PLANE_B_MIGRATOR (preferred for CI/CD migrations)')
    console.error('  - DATABASE_URL (fallback)')
    console.error('\nExample:')
    console.error('  export DATABASE_URL_PLANE_B="postgres://user:pass@localhost:5432/dbname"\n')
    process.exit(1)
  }

  const targets: MigrationTarget[] = [{ label: 'plane-b', dbUrl: planeBUrl }]
  const planeCUrl = resolveMigratorUrl(config.db.planeCUrl)
  if (planeCUrl && planeCUrl !== planeBUrl) {
    targets.push({ label: 'plane-c', dbUrl: planeCUrl })
  }

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
  
  console.error('Migration failed:', errorMessage || 'Unknown error')
  if (errorMessage.toLowerCase().includes('permission denied for schema')) {
    console.error('\n❌ Permission denied while applying migrations.')
    console.error(
      'This usually means your DATABASE_URL_PLANE_B user is a restricted runtime user.\n' +
        'Fix: run migrations with a privileged migrator connection string.\n',
    )
    console.error('Options:')
    console.error('  - Set DATABASE_URL_PLANE_B_MIGRATOR to a superuser/migrator URL (recommended).')
    console.error('  - Or grant schema privileges to the runtime user (less preferred).')
    console.error('')
  }
  const help = getConnectionErrorHelp({ message: errorMessage, toString: () => errorString })
  if (help) {
    console.error(help)
  } else {
    console.error('\nFor more information, see: README.md (or the internal runbook).\n')
  }
  process.exit(1)
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  runMigrations().catch(handleError)
}
