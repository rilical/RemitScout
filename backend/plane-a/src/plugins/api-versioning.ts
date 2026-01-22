import type { FastifyInstance, FastifyRequest, FastifyReply, RouteOptions } from 'fastify'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.api-versioning')

export type ApiVersion = 'v1' | 'unversioned'

export interface VersionedRouteOptions {
  version?: ApiVersion
  deprecated?: boolean
  deprecationDate?: string
  sunsetDate?: string
  alternativePath?: string
}

const DEPRECATION_WARNING_HEADER = 'X-API-Deprecation-Warning'
const SUNSET_HEADER = 'Sunset'
const API_VERSION_HEADER = 'X-API-Version'

const DEPRECATION_DATE = '2025-01-03'
const SUNSET_DATE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

export const addDeprecationHeaders = (
  reply: FastifyReply,
  options: {
    deprecated: boolean
    deprecationDate?: string
    sunsetDate?: string
    alternativePath?: string
  },
): void => {
  if (!options.deprecated) return

  const warnings: string[] = []
  
  if (options.deprecationDate) {
    warnings.push(`This endpoint is deprecated as of ${options.deprecationDate}`)
  } else {
    warnings.push('This endpoint is deprecated')
  }

  if (options.sunsetDate) {
    warnings.push(`This endpoint will be sunset on ${options.sunsetDate}`)
    reply.header(SUNSET_HEADER, options.sunsetDate)
  }

  if (options.alternativePath) {
    warnings.push(`Please migrate to ${options.alternativePath}`)
  } else {
    warnings.push('Please migrate to the versioned endpoint at /api/v1/*')
  }

  reply.header(DEPRECATION_WARNING_HEADER, warnings.join('. '))
  reply.header(API_VERSION_HEADER, 'unversioned')
}

export const registerVersionedRoute = (
  app: FastifyInstance,
  route: RouteOptions,
  options: VersionedRouteOptions = {},
) => {
  const { version = 'v1', deprecated = false, deprecationDate = DEPRECATION_DATE, sunsetDate = SUNSET_DATE } = options

  if (!route.url || !route.url.startsWith('/api/')) {
    throw new Error('Route URL must start with /api/')
  }

  const unversionedPath = route.url
  const versionedPath = `/api/${version}${unversionedPath.replace('/api', '')}`

  const originalHandler = route.handler
  if (!originalHandler) {
    throw new Error('Route handler is required')
  }

  const versionedRoute: RouteOptions = {
    ...route,
    url: versionedPath,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      reply.header(API_VERSION_HEADER, version)
      return originalHandler.call(app, request, reply)
    },
  }

  app.route(versionedRoute)

  if (deprecated || version === 'unversioned') {
    const unversionedRoute: RouteOptions = {
      ...route,
      url: unversionedPath,
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        addDeprecationHeaders(reply, {
          deprecated: true,
          deprecationDate,
          sunsetDate,
          alternativePath: versionedPath,
        })

        logger.warn('deprecated_endpoint_accessed', {
          path: unversionedPath,
          user_id: (request.user as { user_id?: string })?.user_id,
          ip: request.ip,
        })

        return originalHandler.call(app, request, reply)
      },
    }

    app.route(unversionedRoute)
  }
}

export const createBackwardCompatibilityLayer = (app: FastifyInstance) => {
  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0]
    
    if (path.startsWith('/api/') && !path.startsWith('/api/v') && !path.startsWith('/api-docs')) {
      const versionedPath = `/api/v1${path.replace('/api', '')}`
      
      addDeprecationHeaders(reply, {
        deprecated: true,
        deprecationDate: DEPRECATION_DATE,
        sunsetDate: SUNSET_DATE,
        alternativePath: versionedPath,
      })

      logger.debug('unversioned_api_accessed', {
        path,
        versioned_path: versionedPath,
        user_id: (request.user as { user_id?: string })?.user_id,
      })
    }
  })
}

export const registerVersionedRoutes = async (
  app: FastifyInstance,
  routes: (app: FastifyInstance) => Promise<void> | void,
) => {
  await routes(app)
}
