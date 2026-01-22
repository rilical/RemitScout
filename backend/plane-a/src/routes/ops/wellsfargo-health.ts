import type { FastifyInstance } from 'fastify'
import { registerProviderHealthRoutes } from './provider-health'

export const wellsFargoHealthRoutes = async (app: FastifyInstance) => {
  registerProviderHealthRoutes(app, { providerId: 'wellsfargo', displayName: 'Wells Fargo' })
}
