import type { FastifyInstance } from 'fastify'
import { registerProviderHealthRoutes } from './provider-health'

export const dahabshiilHealthRoutes = async (app: FastifyInstance) => {
  registerProviderHealthRoutes(app, { providerId: 'dahabshiil', displayName: 'Dahabshiil' })
}
