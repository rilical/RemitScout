import type { FastifyInstance } from 'fastify'
import { config } from '../../../shared/config'
import { getInstitutionalDataMaturity } from '../services/institutional-launch'

export const complianceRoutes = async (app: FastifyInstance) => {
  app.get('/compliance/status', async () => {
    const maturity = await getInstitutionalDataMaturity(app.container.pool)

    return {
      updated_at: new Date().toISOString(),
      certifications: {
        gdpr: config.compliance.certifications.gdpr,
        ccpa: config.compliance.certifications.ccpa,
        soc2_type_ii: {
          status: config.compliance.certifications.soc2_type_ii.status,
          report_state: config.compliance.certifications.soc2_type_ii.report_state,
          report_date: config.compliance.certifications.soc2_type_ii.report_date,
          report_url: config.compliance.certifications.soc2_type_ii.report_url,
          expires_on: config.compliance.certifications.soc2_type_ii.expires_on,
        },
      },
      institutional_data_maturity: {
        ready: maturity.ready,
        required_days: maturity.requiredDays,
        available_days: maturity.availableDays,
        reason: maturity.reason,
        updated_at: maturity.updatedAt,
      },
      privacy_controls: {
        data_minimization: 'enforced',
        ip_handling: 'truncate_then_hash',
        session_identity: 'rotating_non_persistent',
      },
    }
  })
}
