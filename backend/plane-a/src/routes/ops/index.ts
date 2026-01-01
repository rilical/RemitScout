import type { FastifyInstance } from 'fastify'
import { remitlyHealthRoutes } from './remitly-health'
import { westernUnionHealthRoutes } from './westernunion-health'
import { xeHealthRoutes } from './xe-health'
import { worldRemitHealthRoutes } from './worldremit-health'
import { wiseHealthRoutes } from './wise-health'

export const opsRoutes = async (app: FastifyInstance) => {
  await remitlyHealthRoutes(app)
  await westernUnionHealthRoutes(app)
  await xeHealthRoutes(app)
  await worldRemitHealthRoutes(app)
  await wiseHealthRoutes(app)
}
