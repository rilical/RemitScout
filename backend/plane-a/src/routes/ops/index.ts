import type { FastifyInstance } from 'fastify'
import { b2bSweepStatusRoutes } from './b2b-sweep-status'
import { indicesHealthRoutes } from './indices-health'
import { observerSummaryRoutes } from './observer-summary'
import { dbAdminRoutes } from './db-admin'
import { alertEvaluationAdminRoutes } from './alert-evaluation-admin'
import { apiKeysAdminRoutes } from './api-keys-admin'
import { providersExplainRoutes } from './providers-explain'
import { goldExportsRoutes } from './gold-exports'
import {
  providerHealthRegistry,
  registerProviderHealthRoutes,
  registerProvidersHealthAggregateRoute,
} from './provider-health'

export const opsRoutes = async (app: FastifyInstance) => {
  for (const provider of providerHealthRegistry) {
    registerProviderHealthRoutes(app, provider)
  }

  registerProvidersHealthAggregateRoute(app)
  b2bSweepStatusRoutes(app)
  indicesHealthRoutes(app)
  observerSummaryRoutes(app)
  dbAdminRoutes(app)
  alertEvaluationAdminRoutes(app)
  apiKeysAdminRoutes(app)
  providersExplainRoutes(app)
  goldExportsRoutes(app)
}
