import type { FastifyInstance } from 'fastify'
import { providersListRoutes } from './providers-list'
import { providersDetailRoutes } from './providers-detail'
import { providersCorridorRoutes } from './providers-corridor'
import { providersPulseRoutes } from './providers-pulse'

export const providersRoutes = async (app: FastifyInstance) => {
  await providersListRoutes(app)
  await providersDetailRoutes(app)
  await providersCorridorRoutes(app)
  await providersPulseRoutes(app)
}
