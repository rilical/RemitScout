import type { FastifyInstance } from 'fastify'
import { config } from '../../../shared/config'

export const complianceRoutes = async (app: FastifyInstance) => {
  app.get('/compliance/status', async () => ({
    updated_at: new Date().toISOString(),
    certifications: {
      gdpr: {
        status: config.compliance.certifications.gdpr,
      },
      ccpa: {
        status: config.compliance.certifications.ccpa,
      },
      soc2_type_ii: {
        status: config.compliance.certifications.soc2_type_ii.status,
        report_date: config.compliance.certifications.soc2_type_ii.report_date || null,
        expires_on: config.compliance.certifications.soc2_type_ii.expires_on || null,
      },
    },
    privacy_controls: {
      k_anonymity_min: Math.max(1, Math.floor(config.privacy.kAnonymityMinimum || 5)),
      corridor_min_datapoints_24h: Math.max(1, Math.floor(config.privacy.corridorMinDataPoints24h || 100)),
      provider_min_quotes_per_corridor: Math.max(1, Math.floor(config.privacy.providerMinQuotesPerCorridor || 50)),
      trend_min_lookback_days: Math.max(1, Math.floor(config.privacy.trendMinLookbackDays || 7)),
      geography_scope: 'country',
      ip_handling: 'truncate_then_hash',
      session_identity: 'rotating_non_persistent',
      user_agent_scope: 'browser_family',
    },
  }))
}

