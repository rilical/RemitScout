import type { FastifyInstance } from 'fastify'
import { registerProviderHealthRoutes } from './provider-health'

export const worldRemitHealthRoutes = async (app: FastifyInstance) => {
  registerProviderHealthRoutes(app, { providerId: 'worldremit', displayName: 'WorldRemit' })
}
