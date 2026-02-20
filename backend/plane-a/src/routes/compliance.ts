import type { FastifyInstance } from 'fastify'
import { config } from '../../../shared/config'

export const complianceRoutes = async (app: FastifyInstance) => {
  app.get('/compliance/status', async () => ({
    updated_at: new Date().toISOString(),
    certifications: {
      gdpr: config.compliance.certifications.gdpr,
      ccpa: config.compliance.certifications.ccpa,
      soc2_type_ii: config.compliance.certifications.soc2_type_ii.status,
    },
    privacy_controls: {
      data_minimization: 'enforced',
      ip_handling: 'truncate_then_hash',
      session_identity: 'rotating_non_persistent',
    },
  }))
}
