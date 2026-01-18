import type { FastifyInstance } from 'fastify'
import { registerProviderHealthRoutes } from './provider-health'

export const riaHealthRoutes = async (app: FastifyInstance) => {
  registerProviderHealthRoutes(app, { providerId: 'ria', displayName: 'RIA' })
}
