import awsLambdaFastify from '@fastify/aws-lambda'
import { resolveDatabaseUrl } from '../../shared/aws-params'
import { assertRuntimeConfig } from '../../shared/config'
import { initErrorTracking } from '../../shared/error-tracker'
import { createLogger } from '../../shared/logger'
import { initTracing } from '../../shared/tracing'
import { buildApp } from './app'

const logger = createLogger('plane-c.lambda')

let proxy: ReturnType<typeof awsLambdaFastify> | null = null
let initPromise: Promise<void> | null = null

const withOptionalKey = (key: string | undefined, defaults: string[]) => {
  return key ? [key, ...defaults] : defaults
}

const init = async () => {
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    await resolveDatabaseUrl({
      envVar: 'DATABASE_URL_PLANE_C',
      secretArnEnv: 'PLANE_C_DB_SECRET_ARN',
      ssmNameEnv: 'PLANE_C_DB_SSM_NAME',
      hostEnv: 'PLANE_C_DB_HOST',
      portEnv: 'PLANE_C_DB_PORT',
      nameEnv: 'PLANE_C_DB_NAME',
      usernameEnv: 'PLANE_C_DB_USERNAME',
      passwordEnv: 'PLANE_C_DB_PASSWORD',
      requireJson: true,
      required: true,
      sslModeEnv: 'PGSSLMODE',
      jsonKeys: withOptionalKey(process.env.PLANE_C_DB_SECRET_JSON_KEY, [
        'url',
        'DATABASE_URL_PLANE_C',
        'database_url',
      ]),
    })

    assertRuntimeConfig({ requirePlaneC: true })

    initErrorTracking('plane-c')
    initTracing('plane-c')

    const { app } = buildApp()
    await app.ready()
    proxy = awsLambdaFastify(app)
    logger.info('lambda_initialized')
  })()

  return initPromise
}

export const handler = async (
  event: unknown,
  context: { callbackWaitsForEmptyEventLoop: boolean },
  _callback: (err?: Error, result?: unknown) => void,
) => {
  context.callbackWaitsForEmptyEventLoop = false
  await init()
  if (!proxy) {
    throw new Error('Plane C lambda not initialized')
  }
  return new Promise((resolve, reject) => {
    proxy?.(event, context, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(result)
    })
  })
}
