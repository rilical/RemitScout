import type { FastifyInstance } from 'fastify'
import { requireEntitlement } from '../plugins/auth-plugin'

export const pulseStatusRoutes = async (app: FastifyInstance) => {
  app.get('/api/pulse/status', { preHandler: requireEntitlement('pulse') }, async () => {
    return { status: 'ok' }
  })
}
