import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { randomUUID } from 'crypto'
import { SpanStatusCode } from '@opentelemetry/api'
import { config } from '../../shared/config'
import { getPool } from '../../shared/db'
import { createLogger } from '../../shared/logger'
import {
  recordRequest,
  getMetrics as getApiMetrics,
  metricsContentType as apiMetricsContentType,
} from '../../shared/api-metrics'
import { getTracer } from '../../shared/tracing'
import { getRedisClient } from '../../shared/redis'
import { authPlugin, requireAuth } from './plugins/auth-plugin'
import { createBackwardCompatibilityLayer } from './plugins/api-versioning'
import { swaggerPlugin } from './plugins/swagger'
import { setupErrorHandler } from './plugins/error-handler'
import { registerRedisRateLimit, registerMemoryRateLimit } from './plugins/rate-limit-redis'
import { setupTimeoutMonitor } from './plugins/timeout-monitor'
import { setupPayloadSizeMonitor } from './plugins/payload-size'
import { setupLambdaOptimizations } from './plugins/lambda-optimization'
import { setupRdsProxyMonitor } from './plugins/rds-proxy-monitor'
import { registerSessionTracker } from './plugins/session-tracker-plugin'
import { billingRoutes } from './routes/billing'
import { meRoutes } from './routes/me'
import { quotesRoutes } from './routes/quotes'
import { providersRoutes } from './routes/providers'
import { providerMetadataRoutes } from './routes/provider-metadata'
import { corridorCurrenciesRoutes } from './routes/corridor-currencies'
import { corridorLimitsRoutes } from './routes/corridor-limits'
import { ratesRoutes } from './routes/rates'
import { pulseStatusRoutes } from './routes/pulse-status'
import { pulseRoutes } from './routes/pulse'
import { popularCorridorsRoutes } from './routes/popular-corridors'
import { opsRoutes } from './routes/ops'
import { contactRoutes } from './routes/contact'
import { watchlistRoutes } from './routes/watchlist'
import { alertsRoutes } from './routes/alerts'
import { newsletterRoutes } from './routes/newsletter'
import { recentSearchRoutes } from './routes/recent-searches'
import { telemetryRoutes } from './routes/telemetry'
import { historyRoutes } from './routes/history'
import { indicesRoutes } from './routes/indices'
import { exportsRoutes } from './routes/exports'
import { dataExportRoutes } from './routes/data-export'
import { bankVsSpecialistRoutes } from './routes/bank-vs-specialist'
import { geoRoutes } from './routes/geo'
import { sessionsRoutes } from './routes/sessions'
import { accountRoutes } from './routes/account'
import { providerVisitRoutes } from './routes/provider-visits'
import { analyticsRoutes } from './routes/analytics'
import { auditRoutes } from './routes/audit'
import { adminRoutes } from './routes/admin'
import { notificationsRoutes } from './routes/notifications'
import { adsRoutes } from './routes/ads'
import { marketingRoutes } from './routes/marketing'

export const buildApp = async () => {
  const app = Fastify({
    logger: { level: config.env === 'production' ? 'info' : 'debug' },
    genReqId: (req) => {
      const headerId = req.headers['x-request-id']
      if (typeof headerId === 'string' && headerId.trim()) {
        return headerId
      }
      if (Array.isArray(headerId) && headerId[0]) {
        return headerId[0]
      }
      return randomUUID()
    },
  })

  // Lazy load database pool - only create when needed
  // This reduces cold start time
  const getPlaneAPool = () => getPool(config.db.planeAUrl)

  if (config.planeA.adminEmails.length === 0) {
    const logger = createLogger('plane-a.app')
    logger.warn('admin_emails_empty', {
      message: 'PLANE_A_ADMIN_EMAILS is not set or empty. Admin routes will be inaccessible.',
      env: config.env,
    })
  }

  if (config.runtime.readOnly) {
    const readOnlyAllowMethods = new Set(['GET', 'HEAD', 'OPTIONS'])
    const readOnlyAllowPaths = new Set(['/healthz', '/readyz', '/metrics'])

    app.addHook('preHandler', async (request, reply) => {
      if (readOnlyAllowMethods.has(request.method)) {
        return
      }
      const path = request.url.split('?')[0]
      if (readOnlyAllowPaths.has(path)) {
        return
      }
      reply.code(503)
      return reply.send({
        error: 'read_only',
        message: 'Writes are disabled in this environment.',
      })
    })
  }

  authPlugin(app)
  registerSessionTracker(app)
  const corsOrigins = config.planeA.cors.origins
  const corsOriginSetting =
    corsOrigins.length > 0 ? corsOrigins : config.env === 'production' ? false : true
  if (config.env === 'production' && corsOrigins.length === 0) {
    const logger = createLogger('plane-a.app')
    logger.warn('cors_disabled', {
      message: 'PLANE_A_CORS_ORIGINS is empty; CORS is disabled in production.',
    })
  }
  
  // CORS configuration for API Gateway compatibility
  // API Gateway requires explicit CORS headers
  app.register(cors, {
    origin: corsOriginSetting,
    credentials: config.planeA.cors.allowCredentials,
    methods: config.planeA.cors.allowedMethods.length > 0
      ? config.planeA.cors.allowedMethods
      : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: config.planeA.cors.allowedHeaders.length > 0
      ? config.planeA.cors.allowedHeaders
      : ['authorization', 'content-type', 'x-request-id', 'x-api-key'],
    // API Gateway specific: expose custom headers
    exposedHeaders: ['X-API-Version', 'X-API-Deprecation-Warning', 'Sunset', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  })

  app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  })
  const accountRoutePrefixes = [
    '/api/me',
    '/api/v1/me',
    '/api/billing',
    '/api/v1/billing',
    '/api/pulse',
    '/api/v1/pulse',
    '/api/watchlist',
    '/api/v1/watchlist',
    '/api/alerts',
    '/api/v1/alerts',
    '/api/history',
    '/api/v1/history',
    '/api/exports',
    '/api/v1/exports',
    '/api/data',
    '/api/v1/data',
    '/api/account',
    '/api/v1/account',
    '/api/dashboard',
    '/api/v1/dashboard',
    '/api/sessions',
    '/api/v1/sessions',
  ]
  const authBypassPaths = new Set(['/api/billing/webhook', '/api/v1/billing/webhook'])
  const allowUnauthedAlerts =
    config.env === 'development' || config.env === 'test' || process.env.ENVIRONMENT === 'dev'
  if (allowUnauthedAlerts) {
    authBypassPaths.add('/api/alerts/corridor-eligibility')
    authBypassPaths.add('/api/v1/alerts/corridor-eligibility')
    authBypassPaths.add('/api/alerts/macro-corridors')
    authBypassPaths.add('/api/v1/alerts/macro-corridors')
  }
  const accountAuth = requireAuth()

  app.addHook('preHandler', async (request, reply) => {
    if (request.method === 'OPTIONS') {
      return
    }
    const path = request.url.split('?')[0]
    if (authBypassPaths.has(path)) {
      return
    }
    if (!accountRoutePrefixes.some((prefix) => path.startsWith(prefix))) {
      return
    }
    return accountAuth(request, reply)
  })

  createBackwardCompatibilityLayer(app)
  setupErrorHandler(app)
  setupTimeoutMonitor(app)
  setupPayloadSizeMonitor(app)
  setupLambdaOptimizations(app)
  setupRdsProxyMonitor(app)
  
  // Use Redis-based rate limiting for Lambda (distributed) or fallback to memory
  // In Lambda, in-memory rate limiting only works within a single invocation
  // For production, use Redis/ElastiCache or API Gateway throttling
  const isAwsRuntime = Boolean(
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_REGION,
  )
  
  if (isAwsRuntime && config.redis.url) {
    // Use Redis for distributed rate limiting in Lambda
    await registerRedisRateLimit(app, {
      timeWindow: config.planeA.rateLimitWindowMs,
      max: (request) => (request.user ? config.planeA.rateLimitMax * 5 : config.planeA.rateLimitMax),
      keyGenerator: (request) => (request.user ? `user:${request.user.user_id}` : `ip:${request.ip}`),
      skipOnError: true, // Fail open if Redis is unavailable
    })
  } else {
    // Fallback to in-memory rate limiting (local dev or Redis unavailable)
    // Note: In Lambda, this only works within a single invocation
    registerMemoryRateLimit(app, {
      timeWindow: config.planeA.rateLimitWindowMs,
      max: (request) => (request.user ? config.planeA.rateLimitMax * 5 : config.planeA.rateLimitMax),
      keyGenerator: (request) => (request.user ? `user:${request.user.user_id}` : `ip:${request.ip}`),
    })
  }

  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, body, done) => {
    // Preserve raw body for Stripe webhook signature verification
    // Works with both /api/billing/webhook and /api/v1/billing/webhook
    const path = request.url.split('?')[0]
    if (path === '/api/billing/webhook' || path === '/api/v1/billing/webhook') {
      done(null, body)
      return
    }
    const buffer = body as Buffer
    if (!buffer.length) {
      done(null, {})
      return
    }
    try {
      const parsed = JSON.parse(buffer.toString('utf8'))
      done(null, parsed)
    } catch (error) {
      done(error as Error, undefined)
    }
  })

  const tracer = getTracer('plane-a')

  app.addHook('onRequest', async (request) => {
    request.traceId = request.id

    // Start OpenTelemetry span for the request
    const route = request.routeOptions?.url || request.url.split('?')[0]
    const span = tracer.startSpan(`HTTP ${request.method} ${route}`)
    span.setAttributes({
      'http.method': request.method,
      'http.url': request.url,
      'http.route': route,
      'http.user_agent': request.headers['user-agent'] || '',
      'http.request_id': request.id,
    })
    // Store span on request for later use
    request.span = span
  })

  app.addHook('onResponse', async (request, reply) => {
    try {
      const method = request.method
      const route = request.routeOptions?.url || request.url.split('?')[0]
      const statusCode = reply.statusCode
      const durationSeconds = reply.elapsedTime / 1000
      recordRequest(method, route, statusCode, durationSeconds)

      // Security headers
      reply.header('X-Content-Type-Options', 'nosniff')
      reply.header('X-Frame-Options', 'DENY')
      reply.header('X-XSS-Protection', '1; mode=block')
      if (config.env === 'production') {
        reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
      }
      reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')

      // End OpenTelemetry span
      const span = request.span
      if (span) {
        span.setAttributes({
          'http.status_code': statusCode,
          'http.response_content_length': reply.getHeader('content-length') || 0,
        })
        if (statusCode >= 500) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${statusCode}` })
        } else {
          span.setStatus({ code: SpanStatusCode.OK })
        }
        span.end()
      }
    } catch {
      // Silently ignore metrics/tracing recording errors
    }
  })

  app.get('/healthz', async () => ({ status: 'ok' }))

  app.get('/readyz', async (_request, reply) => {
    try {
      const pool = getPlaneAPool()
      const dbCheck = pool.query('SELECT 1')
      const redisCheck = (async () => {
        const client = await getRedisClient()
        if (!client) return false
        await client.ping()
        return true
      })()

      const [dbOk, redisOk] = await Promise.all([
        dbCheck.then(() => true).catch(() => false),
        redisCheck.catch(() => false),
      ])

      const status = dbOk && redisOk ? 'ready' : 'not_ready'
      const statusCode = dbOk && redisOk ? 200 : 503

      reply.code(statusCode)
      return {
        status,
        dependencies: {
          database: dbOk ? 'ok' : 'unreachable',
          redis: redisOk ? 'ok' : 'unreachable',
        },
      }
    } catch (error) {
      reply.code(503)
      return { status: 'not_ready' }
    }
  })

  app.get('/metrics', async (_request, reply) => {
    try {
      const metrics = await getApiMetrics()
      reply.type(apiMetricsContentType)
      return metrics
    } catch (error) {
      reply.code(500)
      return { error: 'Failed to collect metrics' }
    }
  })

  app.register(quotesRoutes, { prefix: '/api/v1' })
  app.register(providersRoutes, { prefix: '/api/v1' })
  app.register(providerMetadataRoutes, { prefix: '/api/v1' })
  app.register(corridorCurrenciesRoutes, { prefix: '/api/v1' })
  app.register(corridorLimitsRoutes, { prefix: '/api/v1' })
  app.register(popularCorridorsRoutes, { prefix: '/api/v1' })
  app.register(meRoutes, { prefix: '/api/v1' })
  app.register(billingRoutes, { prefix: '/api/v1' })
  app.register(pulseStatusRoutes, { prefix: '/api/v1' })
  app.register(pulseRoutes, { prefix: '/api/v1' })
  app.register(ratesRoutes, { prefix: '/api/v1' })
  app.register(opsRoutes, { prefix: '/api/v1' })
  app.register(contactRoutes, { prefix: '/api/v1' })
  app.register(watchlistRoutes, { prefix: '/api/v1' })
  app.register(alertsRoutes, { prefix: '/api/v1' })
  app.register(newsletterRoutes, { prefix: '/api/v1' })
  app.register(recentSearchRoutes, { prefix: '/api/v1' })
  app.register(telemetryRoutes, { prefix: '/api/v1' })
  app.register(historyRoutes, { prefix: '/api/v1' })
  app.register(indicesRoutes, { prefix: '/api/v1' })
  app.register(exportsRoutes, { prefix: '/api/v1' })
  app.register(dataExportRoutes, { prefix: '/api/v1' })
  app.register(sessionsRoutes, { prefix: '/api/v1' })
  app.register(accountRoutes, { prefix: '/api/v1' })
  app.register(providerVisitRoutes, { prefix: '/api/v1' })
  app.register(analyticsRoutes, { prefix: '/api/v1' })
  app.register(auditRoutes, { prefix: '/api/v1' })
  app.register(adminRoutes, { prefix: '/api/v1' })
  app.register(notificationsRoutes, { prefix: '/api/v1' })
  app.register(adsRoutes, { prefix: '/api/v1' })
  app.register(marketingRoutes, { prefix: '/api/v1' })
  app.register(bankVsSpecialistRoutes, { prefix: '/api/v1' })
  app.register(geoRoutes, { prefix: '/api/v1' })

  app.register(quotesRoutes, { prefix: '/api' })
  app.register(providersRoutes, { prefix: '/api' })
  app.register(providerMetadataRoutes, { prefix: '/api' })
  app.register(corridorCurrenciesRoutes, { prefix: '/api' })
  app.register(corridorLimitsRoutes, { prefix: '/api' })
  app.register(popularCorridorsRoutes, { prefix: '/api' })
  app.register(meRoutes, { prefix: '/api' })
  app.register(billingRoutes, { prefix: '/api' })
  app.register(pulseStatusRoutes, { prefix: '/api' })
  app.register(pulseRoutes, { prefix: '/api' })
  app.register(ratesRoutes, { prefix: '/api' })
  app.register(opsRoutes, { prefix: '/api' })
  app.register(contactRoutes, { prefix: '/api' })
  app.register(watchlistRoutes, { prefix: '/api' })
  app.register(alertsRoutes, { prefix: '/api' })
  app.register(newsletterRoutes, { prefix: '/api' })
  app.register(recentSearchRoutes, { prefix: '/api' })
  app.register(telemetryRoutes, { prefix: '/api' })
  app.register(historyRoutes, { prefix: '/api' })
  app.register(indicesRoutes, { prefix: '/api' })
  app.register(exportsRoutes, { prefix: '/api' })
  app.register(dataExportRoutes, { prefix: '/api' })
  app.register(sessionsRoutes, { prefix: '/api' })
  app.register(accountRoutes, { prefix: '/api' })
  app.register(providerVisitRoutes, { prefix: '/api' })
  app.register(analyticsRoutes, { prefix: '/api' })
  app.register(auditRoutes, { prefix: '/api' })
  app.register(adminRoutes, { prefix: '/api' })
  app.register(notificationsRoutes, { prefix: '/api' })
  app.register(adsRoutes, { prefix: '/api' })
  app.register(marketingRoutes, { prefix: '/api' })
  app.register(bankVsSpecialistRoutes, { prefix: '/api' })
  app.register(geoRoutes, { prefix: '/api' })

  // Register Swagger plugin last to ensure all routes are registered
  await app.register(swaggerPlugin)

  return app
}
