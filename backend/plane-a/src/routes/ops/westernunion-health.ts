import type { FastifyInstance } from 'fastify'
import { registerProviderHealthRoutes } from './provider-health'

export const westernUnionHealthRoutes = async (app: FastifyInstance) => {
  registerProviderHealthRoutes(app, { providerId: 'westernunion', displayName: 'Western Union' })
}
