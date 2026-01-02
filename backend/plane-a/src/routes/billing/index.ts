import type { FastifyInstance } from 'fastify'
import { checkoutSessionRoutes } from './checkout-session'
import { billingPortalRoutes } from './portal'
import { webhookRoutes } from './webhook'
import { verifySessionRoutes } from './verify-session'

export const billingRoutes = async (app: FastifyInstance) => {
  app.register(checkoutSessionRoutes)
  app.register(billingPortalRoutes)
  app.register(webhookRoutes)
  app.register(verifySessionRoutes)
}
