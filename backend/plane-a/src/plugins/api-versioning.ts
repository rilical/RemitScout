import type { FastifyInstance, FastifyReply, FastifyRequest, RouteOptions } from 'fastify'

export type ApiVersion = 'v1'

export interface VersionedRouteOptions {
  version?: ApiVersion
}

const API_VERSION_HEADER = 'X-API-Version'

export const registerVersionedRoute = (
  app: FastifyInstance,
  route: RouteOptions,
  options: VersionedRouteOptions = {},
) => {
  const version = options.version ?? 'v1'
  if (!route.url || !route.url.startsWith('/api/v1')) {
    throw new Error('Route URL must start with /api/v1')
  }

  const originalHandler = route.handler
  if (!originalHandler) {
    throw new Error('Route handler is required')
  }

  const versionedRoute: RouteOptions = {
    ...route,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      reply.header(API_VERSION_HEADER, version)
      return originalHandler.call(app, request, reply)
    },
  }

  app.route(versionedRoute)
}

export const registerVersionedRoutes = async (
  app: FastifyInstance,
  routes: (app: FastifyInstance) => Promise<void> | void,
) => {
  await routes(app)
}
