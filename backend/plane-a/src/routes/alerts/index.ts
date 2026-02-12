import type { FastifyInstance } from 'fastify'
import { registerAlertsSmartRoutes } from './alerts-smart'
import { registerAlertsNotificationRoutes } from './alerts-notifications'
import { registerAlertsCrudRoutes } from './alerts-crud'
import { registerAlertsEvaluationRoutes } from './alerts-evaluation'

export const alertsRoutes = async (app: FastifyInstance) => {
  await registerAlertsSmartRoutes(app)
  await registerAlertsNotificationRoutes(app)
  await registerAlertsCrudRoutes(app)
  await registerAlertsEvaluationRoutes(app)
}

