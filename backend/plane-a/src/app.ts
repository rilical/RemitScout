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
import { recordBusinessMetric } from '../../shared/business-metrics'
import { getTracer } from '../../shared/tracing'
import { getRedisClient } from '../../shared/redis'
import { authPlugin, requireAuth } from './plugins/auth-plugin'
import { swaggerPlugin } from './plugins/swagger'
import { setupErrorHandler } from './plugins/error-handler'
import { registerRedisRateLimit, registerMemoryRateLimit } from './plugins/rate-limit-redis'
import { setupTimeoutMonitor } from './plugins/timeout-monitor'
import { setupPayloadSizeMonitor } from './plugins/payload-size'
import { setupLambdaOptimizations } from './plugins/lambda-optimization'
import { setupRdsProxyMonitor } from './plugins/rds-proxy-monitor'
import { registerAdminIpAllowlist } from './plugins/ip-allowlist'
import { registerSessionTracker } from './plugins/session-tracker-plugin'
import { planeAContainer } from './container'
import { billingRoutes } from './routes/billing'
import { meRoutes } from './routes/me'
import { quotesRoutes } from './routes/quotes'
import { providersRoutes } from './routes/providers/index'
import { providerMetadataRoutes } from './routes/provider-metadata'
import { corridorCurrenciesRoutes } from './routes/corridor-currencies'
import { corridorLimitsRoutes } from './routes/corridor-limits'
import { ratesRoutes } from './routes/rates'
import { pulseStatusRoutes } from './routes/pulse-status'
import { pulseTeaserRoutes } from './routes/pulse-teaser'
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

const logger = createLogger('plane-a.app')

export const PLANE_A_ACCOUNT_ROUTE_PREFIXES = [
  '/api/v1/me',
  '/api/v1/pulse',
  '/api/v1/watchlist',
  '/api/v1/alerts',
  '/api/v1/history',
  '/api/v1/exports',
  '/api/v1/data',
  '/api/v1/account',
  '/api/v1/dashboard',
  '/api/v1/sessions',
] as const

export const PLANE_A_AUTH_BYPASS_PATHS_BASE = [
  '/api/v1/billing/webhook',
  '/api/v1/alerts/unsubscribe',
] as const

export const getPlaneAAuthBypassPaths = () => {
  const authBypassPaths = new Set<string>(PLANE_A_AUTH_BYPASS_PATHS_BASE)
  const allowUnauthedAlerts =
    config.env === 'development' || config.env === 'test' || process.env.ENVIRONMENT === 'dev'
  if (allowUnauthedAlerts) {
    authBypassPaths.add('/api/v1/alerts/corridor-eligibility')
    authBypassPaths.add('/api/v1/alerts/macro-corridors')
  }
  return authBypassPaths
}

export const buildApp = async (options?: {
  onRoute?: (routeOptions: unknown) => void
}) => {
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

  if (options?.onRoute) {
    // Used by tests to capture registered routes for auth coverage assertions.
    app.addHook('onRoute', (routeOptions) => {
      options.onRoute?.(routeOptions)
    })
  }

  // Lazy load database pool - only create when needed
  // This reduces cold start time
  const getPlaneAPool = () => getPool(config.db.planeAUrl)
  app.decorate('container', planeAContainer)

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
  app.register(cors as any, {
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
  const accountRoutePrefixes = [...PLANE_A_ACCOUNT_ROUTE_PREFIXES]
  const authBypassPaths = getPlaneAAuthBypassPaths()
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

  setupErrorHandler(app)
  setupTimeoutMonitor(app)
  setupPayloadSizeMonitor(app)
  setupLambdaOptimizations(app)
  setupRdsProxyMonitor(app)
  registerAdminIpAllowlist(app)

  // Security headers (API responses).
  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    reply.header('X-Content-Type-Options', 'nosniff')

    const prodLike =
      config.env === 'production'
      || config.env === 'staging'
      || ['prod', 'production', 'staging'].includes((process.env.ENVIRONMENT ?? '').toLowerCase())
    if (prodLike) {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    const path = request.url.split('?')[0] || ''
    if (path.startsWith('/api/v1') && (request.user || request.apiKey)) {
      reply.header('Cache-Control', 'no-store, no-cache, must-revalidate')
      reply.header('Pragma', 'no-cache')
      reply.header('Expires', '0')
    }

    return payload
  })
  
  // Use Redis-based rate limiting for Lambda (distributed) or fallback to memory
  // In Lambda, in-memory rate limiting only works within a single invocation
  // For production, use Redis/ElastiCache or API Gateway throttling
  const isAwsRuntime = Boolean(
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_REGION,
  )

  const toPerWindow = (perMinute: number) => {
    const windowMs = Math.max(1000, config.planeA.rateLimitWindowMs)
    return Math.max(1, Math.ceil((perMinute * windowMs) / 60_000))
  }

  const maxRequestsForPath = (request: import('fastify').FastifyRequest) => {
    const path = request.url.split('?')[0] || ''
    const method = request.method

    // Admin/ops surfaces: high but not unlimited.
    if (
      path.startsWith('/api/v1/ops')
      || path.startsWith('/api/v1/admin')
      || path.startsWith('/api/v1/analytics')
      || path.startsWith('/api/v1/audit')
      || path.startsWith('/api/v1/telemetry/analytics')
    ) {
      return toPerWindow(600)
    }

    // Auth-sensitive paths (lower ceilings).
    if (method === 'POST' && (path === '/api/v1/billing/checkout-session' || path === '/api/v1/stripe/create-checkout')) {
      return toPerWindow(10)
    }
    if (method === 'POST' && path === '/api/v1/billing/webhook') {
      return toPerWindow(60)
    }
    if (method === 'POST' && path === '/api/v1/me/api-keys') {
      return toPerWindow(5)
    }
    if (method === 'POST' && path.startsWith('/api/v1/me/api-keys/') && path.endsWith('/rotate')) {
      return toPerWindow(5)
    }
    if (method === 'POST' && path === '/api/v1/me/password') {
      return toPerWindow(5)
    }
    if (method === 'DELETE' && path === '/api/v1/account') {
      return toPerWindow(2)
    }

    // Default: public vs authenticated budget.
    const base = config.planeA.rateLimitMax
    return request.user ? base * 5 : base
  }

  const isProdLike =
    config.env === 'production'
    || config.env === 'staging'
    || ['prod', 'production', 'staging'].includes((process.env.ENVIRONMENT ?? '').toLowerCase())
  
  if (isAwsRuntime && config.redis.url) {
    // Use Redis for distributed rate limiting in Lambda
    await registerRedisRateLimit(app, {
      timeWindow: config.planeA.rateLimitWindowMs,
      max: maxRequestsForPath,
      keyGenerator: (request) => {
        if (request.apiKey) return `apiKey:${request.apiKey.key_id}`
        if (request.user) return `user:${request.user.user_id}`
        return `ip:${request.ip}`
      },
      // In prod/staging, do not skip; fall back to in-memory limiter to avoid fail-open.
      skipOnError: !isProdLike,
    })
  } else {
    // Fallback to in-memory rate limiting (local dev or Redis unavailable)
    // Note: In Lambda, this only works within a single invocation
    registerMemoryRateLimit(app, {
      timeWindow: config.planeA.rateLimitWindowMs,
      max: maxRequestsForPath,
      keyGenerator: (request) => {
        if (request.apiKey) return `apiKey:${request.apiKey.key_id}`
        if (request.user) return `user:${request.user.user_id}`
        return `ip:${request.ip}`
      },
    })
  }

  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, body, done) => {
    // Preserve raw body for Stripe webhook signature verification
    // Works on /api/v1/billing/webhook only (legacy /api/* removed)
    const path = request.url.split('?')[0]
    if (path === '/api/v1/billing/webhook') {
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
      recordBusinessMetric('api_requests_total', 1, {
        endpoint: route,
        method,
        status_code: String(statusCode),
      })

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
    } catch (error) {
      logger.debug('request_observability_record_failed', {
        method: request.method,
        url: request.url,
        error: error instanceof Error ? error.message : String(error),
      })
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
      logger.warn('ready_check_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
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
      logger.warn('metrics_collection_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return { error: 'Failed to collect metrics' }
    }
  })

  // Register Swagger before routes so it captures OpenAPI paths.
  await swaggerPlugin(app)

  app.register(quotesRoutes, { prefix: '/api/v1' })
  app.register(providersRoutes, { prefix: '/api/v1' })
  app.register(providerMetadataRoutes, { prefix: '/api/v1' })
  app.register(corridorCurrenciesRoutes, { prefix: '/api/v1' })
  app.register(corridorLimitsRoutes, { prefix: '/api/v1' })
  app.register(popularCorridorsRoutes, { prefix: '/api/v1' })
  app.register(meRoutes, { prefix: '/api/v1' })
  app.register(billingRoutes, { prefix: '/api/v1' })
  app.register(pulseStatusRoutes, { prefix: '/api/v1' })
  app.register(pulseTeaserRoutes, { prefix: '/api/v1' })
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

  const legacyGonePayload = (legacyPath: string) => {
    const normalized = legacyPath === '/api' ? '/api' : legacyPath.replace(/\/+$/, '')
    const suffix = normalized === '/api' ? '' : normalized.slice('/api'.length)
    return {
      error: 'gone',
      message: 'Legacy /api/* routes have been removed. Use /api/v1/*.',
      alternativePath: `/api/v1${suffix || ''}`,
    }
  }

  app.all('/api', async (_request, reply) => {
    reply.code(410)
    return legacyGonePayload('/api')
  })

  app.all('/api/*', async (request, reply) => {
    const path = request.url.split('?')[0] || '/api'
    reply.code(410)
    return legacyGonePayload(path)
  })

  return app
}
