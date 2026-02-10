import http from 'node:http'

import { resolveDatabaseUrl } from '../../shared/aws-params'

const stripSslMode = (value: string): string => {
  try {
    const url = new URL(value)
    url.searchParams.delete('sslmode')
    return url.toString()
  } catch {
    return value
  }
}

const startHealthServer = async (): Promise<(() => Promise<void>)> => {
  const port = Number(process.env.HEALTH_PORT) || 8080
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

  try {
    if (process.env.DATABASE_URL_PLANE_B) {
      process.env.DATABASE_URL_PLANE_B = stripSslMode(process.env.DATABASE_URL_PLANE_B)
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
      console.error(error)
      process.exit(1)
    })
}
