import http from 'node:http'

import { resolveDatabaseUrl } from '../../shared/aws-params'
import { initErrorTracking } from '../../shared/error-tracker'
import { createLogger } from '../../shared/logger'

initErrorTracking('db-migrate')
const logger = createLogger('script.db-migrate-ecs')

const stripSslMode = (value: string): string => {
  try {
    const url = new URL(value)
    url.searchParams.delete('sslmode')
    return url.toString()
  } catch (error) {
    logger.debug('db_migrate_strip_sslmode_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return value
  }
}

const startHealthServer = async (): Promise<(() => Promise<void>)> => {
  const { config } = await import('../../shared/config')
  const port = config.workers.health.port
  const server = http.createServer((req, res) => {
    const path = req.url?.split('?')[0] ?? ''
    if (req.method === 'GET' && (path === '/healthz' || path === '/health')) {
      res.statusCode = 200
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
      return
    }
    res.statusCode = 404
    res.end('not_found')
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, () => resolve())
  })

  return () =>
    new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
}

export const handler = async (): Promise<void> => {
  // ECS task definitions use a container health check for /healthz.
  // Migrations can be long-running; this keeps the task alive.
  const stopHealthServer = await startHealthServer()

  await resolveDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_B',
    secretArnEnv: 'PLANE_B_DB_SECRET_ARN',
    ssmNameEnv: 'PLANE_B_DB_SSM_NAME',
    hostEnv: 'PLANE_B_DB_HOST',
    portEnv: 'PLANE_B_DB_PORT',
    nameEnv: 'PLANE_B_DB_NAME',
    usernameEnv: 'PLANE_B_DB_USERNAME',
    passwordEnv: 'PLANE_B_DB_PASSWORD',
    requireJson: true,
    required: true,
    sslModeEnv: 'PGSSLMODE',
    jsonKeys: ['url', 'DATABASE_URL_PLANE_B', 'database_url'],
  })

  // Optional: privileged migration credentials. When present, db-migrate.ts will prefer this URL.
  // This lets CI/CD run migrations as a migrator user while app runtime uses a restricted user.
  await resolveDatabaseUrl({
    envVar: 'DATABASE_URL_PLANE_B_MIGRATOR',
    secretArnEnv: 'PLANE_B_DB_MIGRATOR_SECRET_ARN',
    ssmNameEnv: 'PLANE_B_DB_MIGRATOR_SSM_NAME',
    hostEnv: 'PLANE_B_DB_MIGRATOR_HOST',
    portEnv: 'PLANE_B_DB_MIGRATOR_PORT',
    nameEnv: 'PLANE_B_DB_MIGRATOR_NAME',
    usernameEnv: 'PLANE_B_DB_MIGRATOR_USERNAME',
    passwordEnv: 'PLANE_B_DB_MIGRATOR_PASSWORD',
    requireJson: true,
    required: false,
    sslModeEnv: 'PGSSLMODE',
    jsonKeys: ['url', 'DATABASE_URL_PLANE_B_MIGRATOR', 'database_url'],
  })

  const allowMigratorUrl = process.env.ALLOW_DB_MIGRATOR_URL === '1'
  if (process.env.DATABASE_URL_PLANE_B_MIGRATOR && !allowMigratorUrl) {
    throw new Error(
      'DATABASE_URL_PLANE_B_MIGRATOR is set but ALLOW_DB_MIGRATOR_URL=1 was not provided',
    )
  }
  if (!allowMigratorUrl) {
    delete process.env.DATABASE_URL_PLANE_B_MIGRATOR
  }

  const { runStartupChecks } = await import('../../shared/startup')
  await runStartupChecks({
    requirements: {
      requirePlaneB: true,
    },
  })

  try {
    if (process.env.DATABASE_URL_PLANE_B) {
      process.env.DATABASE_URL_PLANE_B = stripSslMode(process.env.DATABASE_URL_PLANE_B)
    }
    if (process.env.DATABASE_URL_PLANE_B_MIGRATOR) {
      process.env.DATABASE_URL_PLANE_B_MIGRATOR = stripSslMode(
        process.env.DATABASE_URL_PLANE_B_MIGRATOR,
      )
    }
    if (!process.env.DATABASE_URL_PLANE_C && process.env.DATABASE_URL_PLANE_B) {
      process.env.DATABASE_URL_PLANE_C = process.env.DATABASE_URL_PLANE_B
    }

    const { runMigrations } = await import('../db-migrate')
    await runMigrations()
  } finally {
    await stopHealthServer().catch(() => {
      // ignore
    })
  }
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('fatal', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
